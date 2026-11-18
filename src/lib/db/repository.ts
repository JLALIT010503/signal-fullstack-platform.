import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getSupabaseServiceClient } from '../supabase/server';
import type { ProspectRecord, SupportedLanguage, ChannelType, MessageDeliveryStatus } from '../../types/signal';
import type { ProgrammeKnowledgeChunk } from '../agent/tools';

export interface SignalDatabaseState {
  counsellor_users: Array<{
    id: string;
    full_name: string;
    email: string;
    role: 'ADMIN' | 'COUNSELLOR' | 'GROWTH_ANALYST';
    languages_spoken: SupportedLanguage[];
    specializations: string[];
    active_capacity: number;
    current_active_load: number;
    is_online: boolean;
  }>;
  knowledge_sources: Array<{
    id: string;
    title: string;
    source_type: string;
    source_url: string;
    programme_code: string;
    verification_status: 'VERIFIED' | 'PENDING_REVIEW' | 'EXPIRED';
    last_crawled_at: string;
    verified_at: string;
    expires_at: string;
    checksum_sha256: string;
  }>;
  programme_knowledge: ProgrammeKnowledgeChunk[];
  prospects: ProspectRecord[];
  lead_assessments: Array<Record<string, unknown>>;
  agent_runs: Array<Record<string, unknown>>;
  agent_tool_calls: Array<Record<string, unknown>>;
  communications: Array<{
    id: string;
    prospect_id: string;
    agent_run_id: string | null;
    is_synthetic: boolean;
    channel: ChannelType;
    language_code: SupportedLanguage;
    subject: string | null;
    body_localized: string;
    body_english_translation: string;
    cited_chunk_ids: string[];
    citation_metadata: Array<Record<string, unknown>>;
    status: MessageDeliveryStatus;
    requires_human_approval: boolean;
    approved_by: string | null;
    external_provider_id: string | null;
    diagnostic_note?: string;
    created_at: string;
    updated_at: string;
  }>;
  followup_tasks: Array<Record<string, unknown>>;
  conversion_events: Array<Record<string, unknown>>;
  experiments: Array<Record<string, unknown>>;
  automation_events: Array<Record<string, unknown>>;
  audit_logs: Array<Record<string, unknown>>;
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'signal-runtime-db.json');

export function createInitialSeedState(): SignalDatabaseState {
  return {
    counsellor_users: [
      {
        id: 'a1111111-1111-4111-8111-111111111101',
        full_name: 'Priya Sharma',
        email: 'priya.sharma@signal-institute.edu',
        role: 'COUNSELLOR',
        languages_spoken: ['en', 'hi', 'hinglish'],
        specializations: ['PGP-AIML', 'BTECH-AIDS'],
        active_capacity: 40,
        current_active_load: 14,
        is_online: true,
      },
      {
        id: 'a1111111-1111-4111-8111-111111111102',
        full_name: 'Rohan Deshmukh',
        email: 'rohan.deshmukh@signal-institute.edu',
        role: 'COUNSELLOR',
        languages_spoken: ['en', 'hi', 'te', 'kn'],
        specializations: ['EMBA-DT', 'PGP-AIML'],
        active_capacity: 35,
        current_active_load: 11,
        is_online: true,
      },
      {
        id: 'a1111111-1111-4111-8111-111111111103',
        full_name: 'Ananya Iyer',
        email: 'ananya.iyer@signal-institute.edu',
        role: 'COUNSELLOR',
        languages_spoken: ['en', 'ta', 'te', 'ml', 'kn'],
        specializations: ['BTECH-AIDS', 'PGP-AIML'],
        active_capacity: 40,
        current_active_load: 9,
        is_online: true,
      },
      {
        id: 'a1111111-1111-4111-8111-111111111104',
        full_name: 'Vikram Nair',
        email: 'vikram.nair@signal-institute.edu',
        role: 'ADMIN',
        languages_spoken: ['en', 'ml', 'hi'],
        specializations: ['PGP-AIML', 'BTECH-AIDS', 'EMBA-DT'],
        active_capacity: 20,
        current_active_load: 3,
        is_online: true,
      },
    ],
    knowledge_sources: [
      {
        id: 'b1111111-1111-4111-8111-111111111101',
        title: 'PGP in Applied AI & Machine Learning — Official Prospectus 2026-27',
        source_type: 'OFFICIAL_BROCHURE',
        source_url: 'https://admissions.signal-institute.edu/pgp-aiml/prospectus-2026',
        programme_code: 'PGP-AIML',
        verification_status: 'VERIFIED',
        last_crawled_at: '2026-11-15T08:00:00Z',
        verified_at: '2026-11-15T09:00:00Z',
        expires_at: '2027-06-30T23:59:59Z',
        checksum_sha256: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
      },
      {
        id: 'b1111111-1111-4111-8111-111111111102',
        title: 'B.Tech in Artificial Intelligence & Data Science — Admissions Handbook 2026',
        source_type: 'FEE_SCHEDULE',
        source_url: 'https://admissions.signal-institute.edu/btech-aids/handbook-2026',
        programme_code: 'BTECH-AIDS',
        verification_status: 'VERIFIED',
        last_crawled_at: '2026-11-14T10:00:00Z',
        verified_at: '2026-11-14T11:30:00Z',
        expires_at: '2027-06-30T23:59:59Z',
        checksum_sha256: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
      },
      {
        id: 'b1111111-1111-4111-8111-111111111103',
        title: 'Executive MBA in Digital Transformation — Programme & Fee Charter 2026',
        source_type: 'POLICY_DOCUMENT',
        source_url: 'https://admissions.signal-institute.edu/emba-dt/charter-2026',
        programme_code: 'EMBA-DT',
        verification_status: 'VERIFIED',
        last_crawled_at: '2026-11-12T10:00:00Z',
        verified_at: '2026-11-12T12:00:00Z',
        expires_at: '2027-06-30T23:59:59Z',
        checksum_sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      },
    ],
    programme_knowledge: [
      {
        id: '11111111-2222-4333-8444-555555555501',
        source_id: 'b1111111-1111-4111-8111-111111111101',
        programme_code: 'PGP-AIML',
        programme_name: 'Postgraduate Programme in Applied AI & Machine Learning',
        category: 'ELIGIBILITY',
        chunk_title: 'Academic Eligibility & Zero-Cost 3-Week Python Foundations Bridge',
        content_markdown:
          'Candidates holding a Bachelor degree in any quantitative discipline (B.Tech, B.E., B.Sc, B.Com, BCA, BBA, or Economics) with >= 55% aggregate marks are eligible. Non-CS candidates complete a mandatory 3-week Python & Linear Algebra Foundations Bridge at zero additional fee.',
        structured_facts: {
          min_percentage: 55,
          non_cs_eligible: true,
          bridge_duration_weeks: 3,
          bridge_extra_cost_inr: 0,
        },
        source_title: 'PGP in Applied AI & Machine Learning — Official Prospectus 2026-27',
        source_url: 'https://admissions.signal-institute.edu/pgp-aiml/prospectus-2026',
        verified_at: '2026-11-15T09:00:00Z',
        expires_at: '2027-06-30T23:59:59Z',
      },
      {
        id: '11111111-2222-4333-8444-555555555502',
        source_id: 'b1111111-1111-4111-8111-111111111101',
        programme_code: 'PGP-AIML',
        programme_name: 'Postgraduate Programme in Applied AI & Machine Learning',
        category: 'FEES',
        chunk_title: 'Tuition Fee Structure, 12-Month No-Cost EMI & Merit Scholarships',
        content_markdown:
          'Total programme tuition is INR 1,85,000 (inclusive of GST). Admission registration deposit is INR 15,000. 12-month no-cost EMI starts at INR 15,417/month via approved financing partners. Merit scholarships up to 25% (up to INR 46,250 waiver) are awarded to candidates scoring >= 80% on the National AI Aptitude Assessment.',
        structured_facts: {
          total_fee_inr: 185000,
          registration_deposit_inr: 15000,
          no_cost_emi_12m_inr: 15417,
          max_scholarship_pct: 25,
        },
        source_title: 'PGP in Applied AI & Machine Learning — Official Prospectus 2026-27',
        source_url: 'https://admissions.signal-institute.edu/pgp-aiml/prospectus-2026',
        verified_at: '2026-11-15T09:00:00Z',
        expires_at: '2027-06-30T23:59:59Z',
      },
      {
        id: '11111111-2222-4333-8444-555555555503',
        source_id: 'b1111111-1111-4111-8111-111111111102',
        programme_code: 'BTECH-AIDS',
        programme_name: 'B.Tech in Artificial Intelligence & Data Science',
        category: 'FEES',
        chunk_title: 'B.Tech AI & DS Annual Tuition, Hostel & Merit Scholarship Tiers',
        content_markdown:
          'Annual tuition fee is INR 2,40,000 per year (4-year UGC/AICTE approved degree). Semester-wise payment and education loan assistance via SBI/HDFC Credila are available. Candidates with >= 90 percentile in JEE Main or >= 85% in 12th PCM qualify for a 30% merit scholarship.',
        structured_facts: {
          total_fee_inr: 240000,
          no_cost_emi_12m_inr: 20000,
          min_percentage: 60,
          max_scholarship_pct: 30,
        },
        source_title: 'B.Tech in Artificial Intelligence & Data Science — Admissions Handbook 2026',
        source_url: 'https://admissions.signal-institute.edu/btech-aids/handbook-2026',
        verified_at: '2026-11-14T11:30:00Z',
        expires_at: '2027-06-30T23:59:59Z',
      },
      {
        id: '11111111-2222-4333-8444-555555555504',
        source_id: 'b1111111-1111-4111-8111-111111111103',
        programme_code: 'EMBA-DT',
        programme_name: 'Executive MBA in Digital Transformation',
        category: 'ELIGIBILITY',
        chunk_title: 'Executive MBA Work Experience, Weekend Schedule & Fee Policy',
        content_markdown:
          'Requires a Bachelor degree with >= 55% marks and a minimum of 24 months (2 years) full-time work experience. Live weekend classes (Saturday & Sunday) plus 2 campus immersions. Total fee is INR 3,20,000 with 12-month no-cost EMI at INR 26,667/month and corporate sponsorship support.',
        structured_facts: {
          total_fee_inr: 320000,
          no_cost_emi_12m_inr: 26667,
          min_percentage: 55,
          max_scholarship_pct: 20,
        },
        source_title: 'Executive MBA in Digital Transformation — Programme & Fee Charter 2026',
        source_url: 'https://admissions.signal-institute.edu/emba-dt/charter-2026',
        verified_at: '2026-11-12T12:00:00Z',
        expires_at: '2027-06-30T23:59:59Z',
      },
    ],
    prospects: [
      {
        id: 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b01',
        is_synthetic: true,
        first_name: 'Aarav',
        last_name: 'Mehta',
        email: 'aarav.mehta@demo.signal.local',
        phone_e164: '+919829011223',
        preferred_language: 'hi',
        preferred_channel: 'WHATSAPP',
        target_programme_code: 'PGP-AIML',
        target_programme_name: 'Postgraduate Programme in Applied AI & Machine Learning',
        lifecycle_stage: 'COUNSELLOR_ESCALATED',
        current_tier: 'HOT',
        current_composite_score: 84,
        fit_score: 82,
        intent_score: 91,
        readiness_score: 76,
        friction_score: 68,
        drop_off_risk_score: 28,
        assigned_counsellor_id: 'a1111111-1111-4111-8111-111111111101',
        utm_source: 'youtube_creator_collab',
        utm_medium: 'video_description',
        utm_campaign: 'aiml_q4_cohort',
        consent_whatsapp: true,
        consent_email: true,
        consent_call: true,
        city: 'Jaipur',
        state_region: 'Rajasthan',
        highest_qualification: 'B.Com (Hons)',
        undergrad_discipline: 'B.Com Commerce',
        graduation_year: 2024,
        cgpa_or_percentage: 74.5,
        work_experience_months: 18,
        current_role: 'Junior SQL & BI Analyst',
        career_goal: 'Transition into Applied Machine Learning Engineer role',
        budget_sensitivity: 'NEEDS_SCHOLARSHIP_OR_EMI',
        raw_initial_inquiry:
          'Main B.Com background se hoon, worked 1.5 yrs in SQL. Kya main PGP AI & ML ke liye eligible hoon? Aur total fee kya hai, 12-month no-cost EMI milegi kya?',
        created_at: '2026-11-18T09:15:00Z',
        updated_at: '2026-11-18T09:15:04Z',
      },
      {
        id: 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b02',
        is_synthetic: true,
        first_name: 'Divya',
        last_name: 'Reddy',
        email: 'divya.reddy@demo.signal.local',
        phone_e164: '+919848022334',
        preferred_language: 'te',
        preferred_channel: 'WHATSAPP',
        target_programme_code: 'BTECH-AIDS',
        target_programme_name: 'B.Tech in Artificial Intelligence & Data Science',
        lifecycle_stage: 'APPLICATION_STARTED',
        current_tier: 'HOT',
        current_composite_score: 88,
        fit_score: 90,
        intent_score: 89,
        readiness_score: 85,
        friction_score: 42,
        drop_off_risk_score: 18,
        assigned_counsellor_id: 'a1111111-1111-4111-8111-111111111103',
        utm_source: 'google_search_brand',
        utm_medium: 'cpc',
        utm_campaign: 'btech_south_2026',
        consent_whatsapp: true,
        consent_email: true,
        consent_call: true,
        city: 'Hyderabad',
        state_region: 'Telangana',
        highest_qualification: '12th MPC (Intermediate)',
        undergrad_discipline: '12th PCM',
        graduation_year: 2026,
        cgpa_or_percentage: 89.2,
        work_experience_months: 0,
        current_role: 'Student',
        career_goal: 'AI Research & Software Engineering',
        budget_sensitivity: 'MODERATE',
        raw_initial_inquiry: 'I scored 89.2% in 12th MPC. Am I eligible for the 30% merit scholarship in B.Tech AI & DS?',
        created_at: '2026-11-18T10:05:00Z',
        updated_at: '2026-11-18T10:20:00Z',
      },
      {
        id: 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b03',
        is_synthetic: true,
        first_name: 'Karthik',
        last_name: 'Subramanian',
        email: 'karthik.s@demo.signal.local',
        phone_e164: '+919444033445',
        preferred_language: 'ta',
        preferred_channel: 'EMAIL',
        target_programme_code: 'EMBA-DT',
        target_programme_name: 'Executive MBA in Digital Transformation',
        lifecycle_stage: 'NURTURING',
        current_tier: 'WARM',
        current_composite_score: 73,
        fit_score: 84,
        intent_score: 70,
        readiness_score: 66,
        friction_score: 64,
        drop_off_risk_score: 41,
        assigned_counsellor_id: 'a1111111-1111-4111-8111-111111111103',
        utm_source: 'linkedin_sponsored',
        utm_medium: 'paid_social',
        utm_campaign: 'emba_exec_q4',
        consent_whatsapp: true,
        consent_email: true,
        consent_call: true,
        city: 'Chennai',
        state_region: 'Tamil Nadu',
        highest_qualification: 'B.E. Mechanical',
        undergrad_discipline: 'Engineering',
        graduation_year: 2020,
        cgpa_or_percentage: 78.0,
        work_experience_months: 60,
        current_role: 'Operations Team Lead',
        career_goal: 'VP Digital Operations',
        budget_sensitivity: 'MODERATE',
        raw_initial_inquiry: 'Can I manage the Executive MBA weekend live classes alongside a full-time operations role, and what is the EMI?',
        created_at: '2026-11-18T11:00:00Z',
        updated_at: '2026-11-18T11:02:00Z',
      },
    ],
    lead_assessments: [],
    agent_runs: [],
    agent_tool_calls: [],
    communications: [],
    followup_tasks: [],
    conversion_events: [
      {
        id: 'ce-synth-01',
        prospect_id: 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b01',
        is_synthetic: true,
        event_type: 'LEAD_CAPTURED',
        revenue_value_inr: 0,
        attribution_source: 'youtube_creator_collab',
        attribution_campaign: 'aiml_q4_cohort',
        occurred_at: '2026-11-18T09:15:00Z',
      },
      {
        id: 'ce-synth-02',
        prospect_id: 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b02',
        is_synthetic: true,
        event_type: 'APPLICATION_STARTED',
        revenue_value_inr: 15000,
        attribution_source: 'google_search_brand',
        attribution_campaign: 'btech_south_2026',
        occurred_at: '2026-11-18T10:20:00Z',
      },
    ],
    experiments: [
      {
        id: 'e1111111-1111-4111-8111-111111111101',
        code: 'EXP-2026-EMI-FIRST',
        name: '12-Month No-Cost EMI Framing vs Full Lump-Sum Fee Disclosure',
        status: 'RUNNING',
        relative_lift_pct: 84.1,
      },
    ],
    automation_events: [],
    audit_logs: [],
  };
}

export function loadDatabaseState(): SignalDatabaseState {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      return JSON.parse(raw) as SignalDatabaseState;
    }
  } catch {
    // Re-initialize if missing or corrupted
  }
  const seed = createInitialSeedState();
  saveDatabaseState(seed);
  return seed;
}

export function saveDatabaseState(state: SignalDatabaseState): void {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

export async function persistProspectAndRun(params: {
  prospect: ProspectRecord;
  agentRunResult: Awaited<ReturnType<typeof import('../agent/supervisor').executeSupervisorAgentRun>>;
}) {
  const state = loadDatabaseState();
  const runId = crypto.randomUUID();
  const commId = crypto.randomUUID();
  const taskId = crypto.randomUUID();
  const assessmentId = crypto.randomUUID();

  // Upsert prospect with updated scores
  const updatedProspect: ProspectRecord = {
    ...params.prospect,
    current_composite_score: params.agentRunResult.assessment.composite_score,
    fit_score: params.agentRunResult.assessment.fit_score,
    intent_score: params.agentRunResult.assessment.intent_score,
    readiness_score: params.agentRunResult.assessment.readiness_score,
    friction_score: params.agentRunResult.assessment.friction_score,
    drop_off_risk_score: Math.round(params.agentRunResult.assessment.drop_off_probability * 100),
    current_tier: params.agentRunResult.assessment.tier,
    lifecycle_stage:
      params.agentRunResult.assessment.tier === 'HOT' ? 'COUNSELLOR_ESCALATED' : 'QUALIFYING',
    assigned_counsellor_id: params.agentRunResult.escalation.assigned_counsellor_id,
    updated_at: new Date().toISOString(),
  };

  const existingIdx = state.prospects.findIndex((p) => p.id === updatedProspect.id);
  if (existingIdx >= 0) {
    state.prospects[existingIdx] = updatedProspect;
  } else {
    state.prospects.unshift(updatedProspect);
  }

  state.lead_assessments.unshift({
    id: assessmentId,
    prospect_id: updatedProspect.id,
    agent_run_id: runId,
    is_synthetic: updatedProspect.is_synthetic,
    ...params.agentRunResult.assessment,
    primary_intent: params.agentRunResult.intent.primary_intent,
    detected_barriers: params.agentRunResult.barriers,
    recommended_next_action: params.agentRunResult.nba.action_type,
    nba_rationale: params.agentRunResult.nba.rationale,
    created_at: new Date().toISOString(),
  });

  state.agent_runs.unshift({
    id: runId,
    prospect_id: updatedProspect.id,
    prospect_name: `${updatedProspect.first_name} ${updatedProspect.last_name}`.trim(),
    is_synthetic: updatedProspect.is_synthetic,
    trigger_type: 'INBOUND_INQUIRY',
    status: params.agentRunResult.status,
    guardrail_status: params.agentRunResult.guardrail_status,
    confidence_score: params.agentRunResult.confidence_score,
    duration_ms: params.agentRunResult.duration_ms,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });

  for (const tc of params.agentRunResult.tool_calls) {
    state.agent_tool_calls.push({
      id: crypto.randomUUID(),
      agent_run_id: runId,
      prospect_id: updatedProspect.id,
      ...tc,
      created_at: new Date().toISOString(),
    });
  }

  state.communications.unshift({
    id: commId,
    prospect_id: updatedProspect.id,
    agent_run_id: runId,
    is_synthetic: updatedProspect.is_synthetic,
    channel: params.agentRunResult.draft.channel,
    language_code: params.agentRunResult.draft.language_code,
    subject: params.agentRunResult.draft.subject,
    body_localized: params.agentRunResult.draft.body_localized,
    body_english_translation: params.agentRunResult.draft.body_english_translation,
    cited_chunk_ids: params.agentRunResult.draft.cited_chunk_ids,
    citation_metadata: params.agentRunResult.draft.citation_metadata,
    status: 'PENDING_APPROVAL',
    requires_human_approval: true,
    approved_by: null,
    external_provider_id: null,
    diagnostic_note: 'Draft created by AI Agent; awaiting mandatory human counsellor approval before external send.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  state.followup_tasks.unshift({
    id: taskId,
    prospect_id: updatedProspect.id,
    prospect_name: `${updatedProspect.first_name} ${updatedProspect.last_name}`.trim(),
    agent_run_id: runId,
    is_synthetic: updatedProspect.is_synthetic,
    ...params.agentRunResult.task,
    created_at: new Date().toISOString(),
  });

  state.conversion_events.unshift({
    id: crypto.randomUUID(),
    is_synthetic: updatedProspect.is_synthetic,
    ...params.agentRunResult.conversion_event,
  });

  state.audit_logs.unshift({
    id: crypto.randomUUID(),
    actor_type: 'SUPERVISOR_AGENT',
    actor_id: 'signal-supervisor-v1',
    action: 'EXECUTED_9_TOOL_QUALIFICATION_AND_DRAFT',
    entity_table: 'prospects',
    entity_id: updatedProspect.id,
    created_at: new Date().toISOString(),
  });

  // Also sync to Supabase if configured
  const sb = getSupabaseServiceClient();
  if (sb) {
    try {
      await sb.from('prospects').upsert({
        id: updatedProspect.id,
        first_name: updatedProspect.first_name,
        last_name: updatedProspect.last_name,
        email: updatedProspect.email,
        phone_e164: updatedProspect.phone_e164,
        preferred_language: updatedProspect.preferred_language,
        target_programme_code: updatedProspect.target_programme_code,
        target_programme_name: updatedProspect.target_programme_name,
        lifecycle_stage: updatedProspect.lifecycle_stage,
        current_tier: updatedProspect.current_tier,
        current_composite_score: updatedProspect.current_composite_score,
      });
    } catch {
      // Continues with local ACID persistence
    }
  }

  saveDatabaseState(state);
  return {
    prospect: updatedProspect,
    agent_run_id: runId,
    communication_id: commId,
    followup_task_id: taskId,
    assessment_id: assessmentId,
  };
}
