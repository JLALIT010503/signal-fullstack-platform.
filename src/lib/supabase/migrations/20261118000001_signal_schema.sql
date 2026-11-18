-- ============================================================================
-- SIGNAL: Student Intelligence, Guidance & Nurturing Agent Layer
-- Complete Production PostgreSQL + pgvector Schema Migration
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'COUNSELLOR', 'GROWTH_ANALYST');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE lifecycle_stage_enum AS ENUM (
        'NEW_INQUIRY',
        'QUALIFYING',
        'NURTURING',
        'COUNSELLOR_ESCALATED',
        'APPLICATION_STARTED',
        'APPLICATION_SUBMITTED',
        'OFFER_ISSUED',
        'ENROLLED',
        'DROPPED_OUT',
        'DISQUALIFIED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE lead_tier_enum AS ENUM ('HOT', 'WARM', 'NURTURE', 'DISQUALIFIED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE channel_enum AS ENUM ('WHATSAPP', 'EMAIL', 'SMS', 'PHONE_CALL', 'WEB_CHAT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE comm_direction_enum AS ENUM ('INBOUND', 'OUTBOUND');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE comm_status_enum AS ENUM (
        'DRAFT',
        'PENDING_APPROVAL',
        'QUEUED',
        'SENT',
        'DELIVERED',
        'READ',
        'REPLIED',
        'FAILED',
        'BLOCKED_NO_CONSENT'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE task_status_enum AS ENUM (
        'PENDING',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED_ON_REPLY',
        'OVERDUE'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE task_priority_enum AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE agent_run_status_enum AS ENUM (
        'RUNNING',
        'COMPLETED',
        'AWAITING_HUMAN_APPROVAL',
        'FAILED',
        'FALLBACK_EXECUTED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 2. TABLE: counsellor_users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.counsellor_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role user_role_enum NOT NULL DEFAULT 'COUNSELLOR',
    languages_spoken TEXT[] NOT NULL DEFAULT ARRAY['en'],
    specializations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    active_capacity INT NOT NULL DEFAULT 40 CHECK (active_capacity >= 0),
    current_active_load INT NOT NULL DEFAULT 0 CHECK (current_active_load >= 0),
    is_online BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. TABLE: experiments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    hypothesis TEXT NOT NULL,
    target_segment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('DRAFT', 'RUNNING', 'PAUSED', 'CONCLUDED')),
    variants JSONB NOT NULL DEFAULT '[]'::JSONB,
    metrics_summary JSONB NOT NULL DEFAULT '{}'::JSONB,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. TABLE: prospects
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_ref TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL,
    phone_e164 TEXT NOT NULL,
    preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'hinglish', 'ta', 'te', 'es')),
    preferred_channel channel_enum NOT NULL DEFAULT 'WHATSAPP',
    target_programme_code TEXT NOT NULL,
    target_programme_name TEXT NOT NULL,
    lifecycle_stage lifecycle_stage_enum NOT NULL DEFAULT 'NEW_INQUIRY',
    current_tier lead_tier_enum NOT NULL DEFAULT 'NURTURE',
    current_composite_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (current_composite_score >= 0 AND current_composite_score <= 100),
    drop_off_risk_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (drop_off_risk_score >= 0 AND drop_off_risk_score <= 100),
    assigned_counsellor_id UUID REFERENCES public.counsellor_users(id) ON DELETE SET NULL,
    experiment_id UUID REFERENCES public.experiments(id) ON DELETE SET NULL,
    experiment_variant TEXT,
    utm_source TEXT NOT NULL DEFAULT 'direct',
    utm_medium TEXT NOT NULL DEFAULT 'none',
    utm_campaign TEXT NOT NULL DEFAULT 'organic',
    utm_content TEXT,
    consent_whatsapp BOOLEAN NOT NULL DEFAULT true,
    consent_email BOOLEAN NOT NULL DEFAULT true,
    consent_call BOOLEAN NOT NULL DEFAULT true,
    consent_captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_retention_until TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 months'),
    last_inbound_at TIMESTAMPTZ,
    last_outbound_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_prospects_email UNIQUE (email),
    CONSTRAINT uq_prospects_phone UNIQUE (phone_e164)
);

CREATE INDEX IF NOT EXISTS idx_prospects_stage_tier ON public.prospects(lifecycle_stage, current_tier);
CREATE INDEX IF NOT EXISTS idx_prospects_score_desc ON public.prospects(current_composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_prospects_counsellor ON public.prospects(assigned_counsellor_id);
CREATE INDEX IF NOT EXISTS idx_prospects_utm_source ON public.prospects(utm_source, utm_campaign);

-- ----------------------------------------------------------------------------
-- 5. TABLE: prospect_profiles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prospect_profiles (
    prospect_id UUID PRIMARY KEY REFERENCES public.prospects(id) ON DELETE CASCADE,
    city TEXT,
    state_region TEXT,
    country TEXT NOT NULL DEFAULT 'India',
    highest_qualification TEXT,
    undergrad_discipline TEXT,
    graduation_year INT,
    cgpa_or_percentage NUMERIC(5,2),
    work_experience_months INT NOT NULL DEFAULT 0 CHECK (work_experience_months >= 0),
    current_role TEXT,
    career_goal TEXT,
    budget_sensitivity TEXT CHECK (budget_sensitivity IN ('LOW', 'MODERATE', 'HIGH', 'NEEDS_SCHOLARSHIP_OR_EMI')),
    target_intake_cohort TEXT,
    raw_initial_inquiry TEXT,
    behavioral_signals JSONB NOT NULL DEFAULT '{
        "brochure_downloaded": false,
        "fee_page_views": 0,
        "curriculum_page_views": 0,
        "webinar_attended": false,
        "session_duration_seconds": 0
    }'::JSONB,
    custom_attributes JSONB NOT NULL DEFAULT '{}'::JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 6. TABLE: knowledge_sources
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('OFFICIAL_BROCHURE', 'UNIVERSITY_WEBPAGE', 'POLICY_DOCUMENT', 'FEE_SCHEDULE', 'PLACEMENT_REPORT')),
    source_url TEXT NOT NULL,
    programme_code TEXT NOT NULL,
    version_tag TEXT NOT NULL DEFAULT '2026.1',
    verification_status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (verification_status IN ('VERIFIED', 'PENDING_REVIEW', 'EXPIRED', 'DEPRECATED')),
    verified_by UUID REFERENCES public.counsellor_users(id) ON DELETE SET NULL,
    last_crawled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '90 days'),
    checksum_sha256 TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_prog_status ON public.knowledge_sources(programme_code, verification_status, expires_at);

-- ----------------------------------------------------------------------------
-- 7. TABLE: programme_knowledge
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.programme_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
    programme_code TEXT NOT NULL,
    programme_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('OVERVIEW', 'ELIGIBILITY', 'FEES', 'SCHOLARSHIPS', 'CURRICULUM', 'PLACEMENTS', 'DEADLINES', 'FACULTY', 'FAQ')),
    chunk_title TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    structured_facts JSONB NOT NULL DEFAULT '{}'::JSONB,
    embedding vector(1536),
    search_tsv tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(chunk_title, '') || ' ' || coalesce(content_markdown, ''))
    ) STORED,
    confidence_weight NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (confidence_weight >= 0 AND confidence_weight <= 1.00),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_programme_knowledge_prog_cat ON public.programme_knowledge(programme_code, category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_programme_knowledge_tsv ON public.programme_knowledge USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS idx_programme_knowledge_embedding ON public.programme_knowledge USING hnsw (embedding vector_cosine_ops);

-- ----------------------------------------------------------------------------
-- 8. TABLE: agent_runs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('INBOUND_INQUIRY', 'BEHAVIORAL_SIGNAL', 'SCHEDULED_FOLLOWUP', 'MANUAL_COUNSELLOR_TRIGGER', 'CONVERSION_FEEDBACK')),
    status agent_run_status_enum NOT NULL DEFAULT 'RUNNING',
    supervisor_model TEXT NOT NULL DEFAULT 'gpt-4o-2024-08-06',
    input_summary TEXT NOT NULL,
    final_recommendation JSONB,
    reasoning_summary TEXT,
    confidence_score NUMERIC(4,3) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    guardrail_status TEXT NOT NULL DEFAULT 'PASSED' CHECK (guardrail_status IN ('PASSED', 'HUMAN_APPROVAL_REQUIRED', 'KNOWLEDGE_GAP_ESCALATED', 'CONSENT_BLOCKED')),
    guardrail_notes TEXT,
    total_tokens INT NOT NULL DEFAULT 0,
    duration_ms INT,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_prospect_started ON public.agent_runs(prospect_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON public.agent_runs(status, started_at DESC);

-- ----------------------------------------------------------------------------
-- 9. TABLE: lead_assessments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
    agent_run_id UUID REFERENCES public.agent_runs(id) ON DELETE SET NULL,
    composite_score NUMERIC(5,2) NOT NULL CHECK (composite_score >= 0 AND composite_score <= 100),
    fit_score NUMERIC(5,2) NOT NULL CHECK (fit_score >= 0 AND fit_score <= 100),
    intent_score NUMERIC(5,2) NOT NULL CHECK (intent_score >= 0 AND intent_score <= 100),
    readiness_score NUMERIC(5,2) NOT NULL CHECK (readiness_score >= 0 AND readiness_score <= 100),
    friction_score NUMERIC(5,2) NOT NULL CHECK (friction_score >= 0 AND friction_score <= 100),
    drop_off_probability NUMERIC(4,3) NOT NULL DEFAULT 0.150 CHECK (drop_off_probability >= 0 AND drop_off_probability <= 1),
    tier lead_tier_enum NOT NULL,
    primary_intent TEXT NOT NULL,
    secondary_intent TEXT,
    detected_barriers JSONB NOT NULL DEFAULT '[]'::JSONB,
    score_breakdown JSONB NOT NULL DEFAULT '[]'::JSONB,
    recommended_next_action TEXT NOT NULL,
    nba_rationale TEXT NOT NULL,
    nba_confidence NUMERIC(4,3) NOT NULL DEFAULT 0.850,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_assessments_prospect_created ON public.lead_assessments(prospect_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 10. TABLE: agent_tool_calls
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_tool_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
    prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
    step_Order INT NOT NULL,
    tool_name TEXT NOT NULL CHECK (tool_name IN (
        'score_prospect',
        'classify_intent',
        'detect_conversion_barriers',
        'search_programme_facts',
        'recommend_next_action',
        'draft_multilingual_followup',
        'create_followup_task',
        'escalate_to_counsellor',
        'record_conversion_event'
    )),
    tool_input JSONB NOT NULL DEFAULT '{}'::JSONB,
    tool_output JSONB NOT NULL DEFAULT '{}'::JSONB,
    knowledge_chunk_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
    status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'VALIDATION_ERROR', 'GUARDRAIL_BLOCKED', 'FAILED')),
    confidence NUMERIC(4,3),
    latency_ms INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_tool_calls_run_step ON public.agent_tool_calls(agent_run_id, step_Order ASC);

-- ----------------------------------------------------------------------------
-- 11. TABLE: communications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
    agent_run_id UUID REFERENCES public.agent_runs(id) ON DELETE SET NULL,
    direction comm_direction_enum NOT NULL DEFAULT 'OUTBOUND',
    channel channel_enum NOT NULL DEFAULT 'WHATSAPP',
    language_code TEXT NOT NULL DEFAULT 'en',
    subject TEXT,
    body_localized TEXT NOT NULL,
    body_english_translation TEXT,
    cited_chunk_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
    citation_metadata JSONB NOT NULL DEFAULT '[]'::JSONB,
    status comm_status_enum NOT NULL DEFAULT 'DRAFT',
    requires_human_approval BOOLEAN NOT NULL DEFAULT false,
    approved_by UUID REFERENCES public.counsellor_users(id) ON DELETE SET NULL,
    external_provider_id TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communications_prospect_created ON public.communications(prospect_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communications_status ON public.communications(status) WHERE status IN ('DRAFT', 'PENDING_APPROVAL', 'QUEUED');

-- ----------------------------------------------------------------------------
-- 12. TABLE: followup_tasks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.followup_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
    agent_run_id UUID REFERENCES public.agent_runs(id) ON DELETE SET NULL,
    assigned_counsellor_id UUID REFERENCES public.counsellor_users(id) ON DELETE SET NULL,
    task_type TEXT NOT NULL CHECK (task_type IN (
        'AUTOMATED_WHATSAPP_FOLLOWUP',
        'AUTOMATED_EMAIL_NURTURE',
        'HUMAN_COUNSELLOR_CALL',
        'SCHOLARSHIP_REVIEW',
        'ELIGIBILITY_VERIFICATION',
        'APPLICATION_COMPLETION_NUDGE'
    )),
    priority task_priority_enum NOT NULL DEFAULT 'MEDIUM',
    status task_status_enum NOT NULL DEFAULT 'PENDING',
    title TEXT NOT NULL,
    ai_brief_markdown TEXT NOT NULL,
    talking_points JSONB NOT NULL DEFAULT '[]'::JSONB,
    escalation_reason TEXT,
    sla_due_at TIMESTAMPTZ NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_followup_tasks_queue ON public.followup_tasks(status, priority, sla_due_at ASC);
CREATE INDEX IF NOT EXISTS idx_followup_tasks_counsellor ON public.followup_tasks(assigned_counsellor_id, status);

-- ----------------------------------------------------------------------------
-- 13. TABLE: conversion_events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversion_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
    agent_run_id UUID REFERENCES public.agent_runs(id) ON DELETE SET NULL,
    recorded_by_counsellor_id UUID REFERENCES public.counsellor_users(id) ON DELETE SET NULL,
    experiment_id UUID REFERENCES public.experiments(id) ON DELETE SET NULL,
    experiment_variant TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'LEAD_CAPTURED',
        'QUALIFIED_HOT',
        'BROCHURE_ENGAGED',
        'COUNSELLOR_CALL_COMPLETED',
        'APPLICATION_STARTED',
        'APPLICATION_SUBMITTED',
        'APTITUDE_TEST_CLEARED',
        'OFFER_ISSUED',
        'SCHOLARSHIP_AWARDED',
        'TUITION_DEPOSIT_PAID',
        'ENROLLED',
        'DROPPED_OUT'
    )),
    revenue_value_inr NUMERIC(12,2) NOT NULL DEFAULT 0,
    attribution_source TEXT,
    attribution_campaign TEXT,
    resolved_barriers TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    event_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_prospect ON public.conversion_events(prospect_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_events_type_date ON public.conversion_events(event_type, occurred_at DESC);

-- ----------------------------------------------------------------------------
-- 14. TABLE: audit_logs (Immutable Governance Spine)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type TEXT NOT NULL CHECK (actor_type IN ('SUPERVISOR_AGENT', 'COUNSELLOR', 'SYSTEM_WEBHOOK', 'ADMIN')),
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_table TEXT NOT NULL,
    entity_id UUID NOT NULL,
    before_state JSONB,
    after_state JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_table, entity_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 15. HYBRID KNOWLEDGE SEARCH RPC FUNCTION (Vector + Full-Text + Freshness)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_programme_knowledge(
    query_embedding vector(1536),
    query_text TEXT,
    filter_programme_code TEXT DEFAULT NULL,
    filter_categories TEXT[] DEFAULT NULL,
    match_threshold FLOAT DEFAULT 0.72,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    chunk_id UUID,
    programme_code TEXT,
    programme_name TEXT,
    category TEXT,
    chunk_title TEXT,
    content_markdown TEXT,
    structured_facts JSONB,
    source_id UUID,
    source_title TEXT,
    source_url TEXT,
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pk.id AS chunk_id,
        pk.programme_code,
        pk.programme_name,
        pk.category,
        pk.chunk_title,
        pk.content_markdown,
        pk.structured_facts,
        ks.id AS source_id,
        ks.title AS source_title,
        ks.source_url,
        ks.verified_at,
        ks.expires_at,
        (
            CASE
                WHEN pk.embedding IS NOT NULL AND query_embedding IS NOT NULL
                THEN (0.75 * (1 - (pk.embedding <=> query_embedding))) +
                     (0.25 * LEAST(ts_rank_cd(pk.search_tsv, websearch_to_tsquery('english', query_text)), 1.0))
                ELSE LEAST(ts_rank_cd(pk.search_tsv, websearch_to_tsquery('english', query_text)) + 0.80, 0.99)
            END
        )::FLOAT AS similarity
    FROM public.programme_knowledge pk
    INNER JOIN public.knowledge_sources ks ON ks.id = pk.source_id
    WHERE pk.is_active = true
      AND ks.verification_status = 'VERIFIED'
      AND ks.expires_at > now()
      AND (filter_programme_code IS NULL OR pk.programme_code = filter_programme_code)
      AND (filter_categories IS NULL OR pk.category = ANY(filter_categories))
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- ----------------------------------------------------------------------------
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.counsellor_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programme_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated staff read/write policies (Service role bypasses RLS automatically)
CREATE POLICY "Authenticated staff can read prospects"
    ON public.prospects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated staff can insert/update prospects"
    ON public.prospects FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated staff can read/write profiles"
    ON public.prospect_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated staff can read verified knowledge"
    ON public.programme_knowledge FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated staff can read knowledge sources"
    ON public.knowledge_sources FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated staff can read agent runs and tool calls"
    ON public.agent_runs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated staff can read tool calls"
    ON public.agent_tool_calls FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated staff can manage tasks and communications"
    ON public.followup_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated staff can manage communications"
    ON public.communications FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated staff can read/insert conversion events"
    ON public.conversion_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Audit logs are append-only"
    ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Audit logs insert"
    ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
