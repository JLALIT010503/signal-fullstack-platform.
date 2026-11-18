# 12 — Implementation Checklist & P0/P1/P2 Execution Roadmap: SIGNAL

**Document Version:** 1.0.0  
**Objective:** Ship a complete, end-to-end executable P0 MVP within a constrained 1-day sprint while laying down production-ready P1/P2 hooks.

---

## Phase 1: Foundation, Database Schema & Seed State (P0 — Block 1)

- [x] **1.1 Workspace & Architecture Blueprint (`/docs/01` to `/docs/12`)**
  - Complete PRD, Technical Architecture, System Diagrams, User Journeys, SQL Schema, API Specs, Agent Tool Contracts, n8n Workflows, UX/UI Design System, Folder Structure, and `.env.example`.
- [x] **1.2 PostgreSQL + `pgvector` Migration (`supabase/migrations/20261118000001_signal_schema.sql`)**
  - Define all 13 required tables: `prospects`, `prospect_profiles`, `lead_assessments`, `agent_runs`, `agent_tool_calls`, `programme_knowledge`, `knowledge_sources`, `communications`, `followup_tasks`, `counsellor_users`, `conversion_events`, `experiments`, and `audit_logs`.
  - Create `match_programme_knowledge` hybrid vector + full-text RPC with `verification_status = 'VERIFIED'` and `expires_at > now()` enforcement.
  - Enable Row Level Security (RLS) across all tables.
- [x] **1.3 Synthetic Demonstration Dataset (`supabase/seed.sql` & `src/lib/mock-db/seed-data.ts`)**
  - Seed 3 flagship programmes (`PGP-AIML`, `BTECH-AIDS`, `EMBA-DT`) with verified eligibility, fee, EMI, scholarship, curriculum, and placement chunks.
  - Seed 4 counsellors (`Priya Sharma`, `Rohan Deshmukh`, `Ananya Iyer`, `Vikram Nair`), 2 active experiments, and 8 multi-stage prospects with complete tool-call traces.

---

## Phase 2: AI Supervisor Agent & 9 Specialist Tools (P0 — Block 2)

- [x] **2.1 Strict Zod Tool Schemas (`src/lib/agent/tools.ts`)**
  - Implement typed input/output contracts for all 9 required tools:
    1. `score_prospect`
    2. `classify_intent`
    3. `detect_conversion_barriers`
    4. `search_programme_facts`
    5. `recommend_next_action`
    6. `draft_multilingual_followup`
    7. `create_followup_task`
    8. `escalate_to_counsellor`
    9. `record_conversion_event`
- [x] **2.2 Supervisor Orchestrator & Guardrail Engine (`src/lib/agent/supervisor.ts`)**
  - Wire OpenAI Agents SDK / tool-calling loop with automatic fallback to deterministic local execution so the pipeline executes reliably with or without live external API keys.
  - Enforce zero-hallucination numeric verification, RAG similarity threshold (`>= 0.78`), and per-channel consent checks (`consent_whatsapp`, `consent_email`).
  - Record full execution trace (`agent_runs` + step-by-step `agent_tool_calls` + `audit_logs`).

---

## Phase 3: Backend API Layer (`/api/v1/*`) (P0 — Block 3)

- [x] **3.1 Prospect & Qualification Endpoints**
  - `GET / POST /api/v1/prospects` (Intake, deduplication, profile creation, auto-agent trigger).
  - `GET / PATCH /api/v1/prospects/[id]` (Prospect 360 aggregation & consent updates).
- [x] **3.2 Agent & Knowledge Endpoints**
  - `POST /api/v1/agent/execute` & `GET /api/v1/agent/runs`.
  - `POST /api/v1/knowledge/search` & `POST /api/v1/knowledge/ingest`.
- [x] **3.3 Engagement, Counsellor Tasks, Conversions & Growth Analytics**
  - `POST /api/v1/communications/send` (Approve & dispatch multilingual draft).
  - `GET / POST / PATCH /api/v1/tasks` (Counsellor SLA queue & resolution).
  - `POST /api/v1/conversions` (Record funnel milestone & update experiment attribution).
  - `GET /api/v1/analytics/growth` (Funnel velocity, source ROI, barrier heatmap).

---

## Phase 4: Enterprise 8-Screen UX/UI Implementation (P0 — Block 4)

- [x] **4.1 App Shell & Navigation (`Command Centre` Aesthetic)**
  - Deep Obsidian Navy (`#070B14`) layout, collapsible sidebar with live badge counts, global search (`Cmd+K`), and interactive `"Simulate Prospect Inquiry"` launcher.
- [x] **4.2 The 8 Core Operational Screens**
  - [x] **Screen 1: Command Centre** (KPI Bento row, Signal Topology visual pulse, Live Autonomous Activity Stream, AI Operational Insights).
  - [x] **Screen 2: Prospect Explorer** (Multi-facet filter bar, 4-axis sparkbars, Acquisition Studio intake drawer).
  - [x] **Screen 3: Prospect 360** (Explainable score breakdown, barrier pills, NBA execution panel, multilingual cited transcript, conversion event buttons).
  - [x] **Screen 4: Agent Control Room** (Live run list, interactive 9-tool DAG trace inspector, JSON input/output viewer, guardrail monitor).
  - [x] **Screen 5: Knowledge Centre** (Interactive RAG search tester, verified programme chunks table, freshness expiry badges, Firecrawl source manager).
  - [x] **Screen 6: Engagement Studio** (Multilingual composer supporting English, Hindi, Hinglish, Tamil, Telugu, Spanish with English back-translation & citation check).
  - [x] **Screen 7: Counsellor Workspace** (SLA-sorted escalation queue, AI call prep brief, 1-click draft approval, call disposition logger).
  - [x] **Screen 8: Growth Intelligence** (Recharts funnel chart, UTM source ROI matrix, conversion barrier breakdown, A/B experiment lift tracker).

---

## Phase 5: P1 & P2 Post-Prototype Expansion Checklist

- [ ] **P1.1 Live WhatsApp Cloud API & Resend Webhook Wiring** (`/api/v1/webhooks/whatsapp`, `/api/v1/webhooks/resend`).
- [ ] **P1.2 n8n Scheduled Workflows Deployment** (Import `/n8n/workflows/*.json` for 15-min nurture cron, 5-min SLA guardian, and nightly Firecrawl diff).
- [ ] **P2.1 Automated Weight Calibration Job** (Recalibrating `score_prospect` factor weights weekly based on `ENROLLED` vs `DROPPED_OUT` cohorts).
