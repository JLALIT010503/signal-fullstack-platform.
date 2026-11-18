# 02 — Technical Architecture: SIGNAL

**System Name:** SIGNAL (Student Intelligence, Guidance & Nurturing Agent Layer)  
**Architecture Paradigm:** Event-Driven, TypeScript-First, Grounded Agentic Monolith with Async Automation Offload  
**Runtime Stack:** Next.js 15 (App Router) + Supabase (PostgreSQL 16 + `pgvector` + Realtime + Auth) + OpenAI Agents SDK + n8n

---

## 1. Architectural Principles

1. **Simplicity Over Distributed Sprawl:** Where two technologies overlap, SIGNAL chooses the simplest reliable path. Next.js App Router serves both the React 19 UI and the typed Server Route Handlers (`/api/v1/*`), eliminating a separate microservice tier while preserving clean domain boundaries in `/src/modules/*` and `/src/lib/*`.
2. **Database as the Canonical Event Spine:** PostgreSQL (via Supabase) stores relational state, vector embeddings (`pgvector`), execution audit logs, and realtime publication channels. Every state transition emits an immutable `audit_logs` and/or `conversion_events` entry.
3. **Deterministic Guardrails Around Probabilistic AI:** The OpenAI Supervisor Agent never writes directly to external communication APIs or alters programme facts without passing through deterministic Zod schema validators, confidence thresholds, and institutional grounding checks.
4. **Graceful Degradation & Idempotency:** Every mutating API route and webhook handler accepts an `Idempotency-Key` or deduplicates by external `event_id`. If the OpenAI API experiences elevated latency or rate limits, SIGNAL falls back to a deterministic rule-based qualification & template engine so no prospect inquiry is ever dropped.

---

## 2. Coherent Technology Stack Resolution

The technology stack reconciles all required libraries into clear, non-overlapping responsibilities:

| Layer | Selected Technology | Architectural Role & Justification |
| :--- | :--- | :--- |
| **Application Framework** | **Next.js 15 (App Router) + React 19 + TypeScript 5.6** | Unified full-stack framework for SSR/RSC data fetching, API Route Handlers, and edge middleware. (Vite is used solely via Vitest for unit/integration testing so build tooling stays unified on Next.js). |
| **Styling & UI Primitives** | **Tailwind CSS + shadcn/ui (Radix Primitives) + Lucide Icons** | High-density enterprise dark-mode design system with accessible keyboard navigation, dialogs, drawers, and command palettes (`cmdk`). |
| **Motion & Visual Polish** | **Framer Motion + GSAP + Three.js (Selective)** | **Framer Motion** handles layout transitions, drawer slides, and live agent trace step animations. **Three.js / React Three Fiber** + **GSAP** are strictly scoped to the Command Centre's interactive 3D/WebGL Signal Topology Header & live node pulse canvas, kept lazy-loaded (`next/dynamic`) so core table/form TTI remains `< 400ms`. |
| **Client State Management** | **Zustand** | Lightweight client store for global UI state: active workspace filters, selected Prospect 360 drawer, live Agent Control Room stream buffer, and counsellor quick-action queue. |
| **Data Visualization** | **Recharts** | Responsive, theme-aligned SVG charts for funnel velocity, score distribution histograms, barrier breakdown bars, and channel attribution curves. |
| **Database & Vector Store** | **Supabase PostgreSQL 16 + `pgvector`** | Single ACID database holding relational entities (`prospects`, `communications`, `agent_runs`) alongside 1536-dimensional `vector(1536)` embeddings in `programme_knowledge`—avoiding external vector DB sync drift. |
| **Authentication & Realtime** | **Supabase Auth + Row Level Security + Supabase Realtime** | JWT-based RBAC (`ADMIN`, `COUNSELLOR`, `GROWTH_ANALYST`, `SERVICE_ROLE`) enforced at the Postgres RLS layer; WebSocket Postgres Changes push live `agent_runs` and `agent_tool_calls` updates to the UI. |
| **AI & Agent Orchestration** | **OpenAI Agents SDK for TypeScript + OpenAI API (`gpt-4o` / `gpt-4o-mini` + `text-embedding-3-small`)** | Supervisor agent loop with strict JSON Schema / Zod structured outputs and 9 typed specialist tools. `gpt-4o` powers complex multi-tool reasoning and multilingual drafting; `gpt-4o-mini` handles low-latency intent classification; `text-embedding-3-small` computes RAG vectors. |
| **Workflow Automation** | **n8n + Signed Webhooks** | Offloads delayed follow-up timers, SLA escalation sweeps, Firecrawl scheduled ingestion, and multi-step retry queues outside Vercel serverless execution limits. |
| **External Integrations** | **WhatsApp Cloud API, Resend, Firecrawl, PostHog, Sentry** | Meta Graph API v21.0 for WhatsApp; Resend for transactional HTML/plain-text email; Firecrawl for converting public university web pages into clean Markdown for RAG ingestion; PostHog for product telemetry; Sentry for exception capture. |

---

## 3. Detailed Module Contract Matrix (Inputs, Outputs, Dependencies, APIs & Events)

### 3.1 Module 1: Prospect Acquisition Studio
- **Inputs:** `POST /api/v1/prospects` payload (name, email, phone E.164, preferred_language, target_programme_id, academic_background, career_goal, budget_bracket, utm_source, utm_medium, utm_campaign, consent_flags, initial_inquiry_text).
- **Outputs:** Created/updated `prospects` + `prospect_profiles` rows; initial `conversion_events` (`LEAD_CAPTURED`); async or synchronous trigger of `POST /api/v1/agent/execute`.
- **Data Dependencies:** `prospects`, `prospect_profiles`, `programme_knowledge` (for programme lookup), `conversion_events`, `audit_logs`.
- **Events Emitted:** `prospect.captured`, `prospect.inquiry_received`.

### 3.2 Module 2: AI Qualification Engine
- **Inputs:** `prospect_id`, `prospect_profiles`, historical `communications`, latest inquiry text.
- **Outputs:** `lead_assessments` row (`composite_score`, `fit_score`, `intent_score`, `readiness_score`, `friction_score`, `tier`, `intent_category`, `detected_barriers`, `score_breakdown`, `explanation_summary`).
- **Data Dependencies:** `prospects`, `prospect_profiles`, `lead_assessments`, `programme_knowledge`.
- **APIs / Tools:** `POST /api/v1/prospects/[id]/qualify`, Agent tools `score_prospect`, `classify_intent`, `detect_conversion_barriers`.
- **Events Emitted:** `prospect.qualified`, `prospect.barrier_detected`.

### 3.3 Module 3: Programme Knowledge Intelligence
- **Inputs:** Search query, `programme_id`, `category` (`FEES`, `ELIGIBILITY`, `CURRICULUM`, `PLACEMENTS`, `SCHOLARSHIPS`, `DEADLINES`), or ingestion payload (`source_url` via Firecrawl / Markdown upload).
- **Outputs:** Ranked array of verified `programme_knowledge` chunks with `similarity_score`, `source_title`, `source_url`, `verified_at`, `expires_at`, and `is_fresh` boolean.
- **Data Dependencies:** `programme_knowledge`, `knowledge_sources`.
- **APIs / Tools:** `POST /api/v1/knowledge/search`, `POST /api/v1/knowledge/ingest`, Agent tool `search_programme_facts`.
- **Events Emitted:** `knowledge.retrieved`, `knowledge.gap_detected` (when top chunk similarity `< 0.78`), `knowledge.source_expired`.

### 3.4 Module 4: Next Best Action (NBA) Engine
- **Inputs:** `lead_assessments` record, retrieved knowledge availability, communication cadence history (`last_contacted_at`, `unanswered_outbound_count`), active cohort deadline proximity.
- **Outputs:** Structured NBA recommendation (`action_type`, `channel`, `priority`, `confidence`, `requires_human_approval`, `reasoning`, `suggested_delay_minutes`).
- **Data Dependencies:** `lead_assessments`, `communications`, `followup_tasks`, `experiments`.
- **APIs / Tools:** Agent tool `recommend_next_action`.
- **Events Emitted:** `nba.recommended`, `nba.human_approval_required`.

### 3.5 Module 5: Multilingual Engagement Studio
- **Inputs:** `prospect_id`, `nba_decision`, verified `knowledge_chunks[]`, `target_language` (`en`, `hi`, `hinglish`, `ta`, `te`, `es`), `channel` (`WHATSAPP`, `EMAIL`, `SMS`).
- **Outputs:** `communications` record (`DRAFT`, `PENDING_APPROVAL`, `SENT`, `DELIVERED`, `READ`, `FAILED`) with `body_localized`, `body_english_translation`, `citations[]`, and provider `external_message_id`.
- **Data Dependencies:** `communications`, `programme_knowledge`, `prospects`.
- **APIs / Tools:** `POST /api/v1/communications/send`, Agent tool `draft_multilingual_followup`.
- **Events Emitted:** `communication.drafted`, `communication.sent`, `communication.delivered`, `communication.replied`.

### 3.6 Module 6: Automated Follow-Up Engine
- **Inputs:** Scheduled `followup_tasks` (`due_at <= now()`), n8n cron webhook triggers, or inbound prospect replies.
- **Outputs:** Task state updates, automated follow-up dispatch, or sequence cancellation on prospect reply.
- **Data Dependencies:** `followup_tasks`, `communications`, `prospects`.
- **APIs / Tools:** `POST /api/v1/tasks`, `PATCH /api/v1/tasks/[id]`, `POST /api/v1/webhooks/n8n`, Agent tool `create_followup_task`.
- **Events Emitted:** `task.created`, `task.executed`, `task.cancelled_on_reply`.

### 3.7 Module 7: Human Counsellor Command Centre
- **Inputs:** Escalated prospects, `followup_tasks` assigned to `counsellor_id`, pending message approvals, call disposition inputs.
- **Outputs:** Updated `followup_tasks`, approved `communications`, counsellor notes, `conversion_events`.
- **Data Dependencies:** `counsellor_users`, `followup_tasks`, `prospects`, `lead_assessments`, `communications`.
- **APIs / Tools:** `POST /api/v1/escalations`, Agent tool `escalate_to_counsellor`.
- **Events Emitted:** `escalation.created`, `escalation.claimed`, `escalation.resolved`.

### 3.8 Module 8: AI Agent Execution Control Room
- **Inputs:** Trigger payload (`prospect_id`, `trigger_event`, `input_context`), live tool execution telemetry.
- **Outputs:** `agent_runs` master record + ordered `agent_tool_calls` trace steps, token usage, latency breakdown, guardrail status.
- **Data Dependencies:** `agent_runs`, `agent_tool_calls`, `audit_logs`.
- **APIs / Tools:** `POST /api/v1/agent/execute`, `GET /api/v1/agent/runs`, `GET /api/v1/agent/runs/[runId]`.
- **Events Emitted:** `agent.run_started`, `agent.tool_called`, `agent.guardrail_triggered`, `agent.run_completed`.

### 3.9 Module 9: Growth Intelligence Dashboard
- **Inputs:** Time-range filters, programme filter, UTM source filter.
- **Outputs:** Funnel conversion metrics, channel efficiency table, barrier distribution, AI-generated executive growth brief.
- **Data Dependencies:** `prospects`, `lead_assessments`, `conversion_events`, `communications`, `experiments`.
- **APIs / Tools:** `GET /api/v1/analytics/growth`.
- **Events Emitted:** `analytics.snapshot_computed`.

### 3.10 Module 10: Conversion Feedback Engine
- **Inputs:** Conversion milestone events (`APPLICATION_SUBMITTED`, `INTERVIEW_CLEARED`, `OFFER_ACCEPTED`, `TUITION_PAID`, `LOST_TO_COMPETITOR`, `LOST_FEE_BARRIER`), experiment variant IDs.
- **Outputs:** New `conversion_events` row, updated prospect lifecycle stage, updated experiment conversion counters, recalibrated source conversion score.
- **Data Dependencies:** `conversion_events`, `experiments`, `prospects`, `lead_assessments`.
- **APIs / Tools:** `POST /api/v1/conversions`, Agent tool `record_conversion_event`.
- **Events Emitted:** `conversion.recorded`, `experiment.metrics_updated`.

---

## 4. Security, Privacy & Reliability Architecture

### 4.1 Authentication & Role-Based Access Control (RBAC)
- **Supabase Auth (JWT + SSR Cookies):** Users authenticate via email/password or Google SSO. Custom JWT claims or lookup against `counsellor_users` assign one of four roles:
  - `ADMIN`: Full access to all modules, knowledge verification, agent guardrails, and user management.
  - `COUNSELLOR`: Access to assigned/unassigned prospects, Engagement Studio, and Counsellor Workspace; read-only access to Knowledge Centre.
  - `GROWTH_ANALYST`: Access to Growth Intelligence, Experiments, and aggregated Prospect Explorer metrics.
  - `SERVICE_ROLE`: Server-side only key used strictly inside Next.js Server Route Handlers for agent execution and webhook ingestion.

### 4.2 Row Level Security (RLS)
- All 13 tables in the `public` schema have `ENABLE ROW LEVEL SECURITY` enforced from migration 001.
- Counsellors can read all active prospects in their institution's tenant scope and mutate `followup_tasks` and `communications` assigned to them or in the shared escalation queue.
- `audit_logs` and `agent_tool_calls` are **append-only** for application roles (`INSERT` + `SELECT` only; `UPDATE` and `DELETE` are revoked).

### 4.3 Input Validation & Webhook Signature Verification
- Every API route validates request bodies, query params, and headers using **Zod** schemas before executing business logic.
- **WhatsApp Cloud API Webhooks:** Verified using HMAC-SHA256 (`X-Hub-Signature-256`) signed with `WHATSAPP_APP_SECRET`.
- **n8n & Internal Automation Webhooks:** Verified using HMAC-SHA256 (`X-Signal-Signature`) + timestamp replay protection (`±300 seconds` window).
- **Resend Webhooks:** Verified via `svix-id`, `svix-timestamp`, and `svix-signature` headers.

### 4.4 Rate Limiting, Consent & Data Minimization
- **Token-Bucket Rate Limiting:** Applied on public intake endpoints (`10 req/min/IP`) and agent execution triggers (`30 runs/min/workspace`).
- **Consent Enforcement:** Every prospect record tracks `consent_whatsapp`, `consent_email`, `consent_call`, and `consent_updated_at`. The `draft_multilingual_followup` and dispatch services hard-block outbound delivery on any channel where consent is `false` or `OPTED_OUT`.
- **PII Minimization in LLM Prompts:** Before invoking OpenAI, the Supervisor Agent sanitizer strips raw government IDs, bank account numbers, or payment tokens, passing only the prospect's first name, academic/career profile, and inquiry context.
