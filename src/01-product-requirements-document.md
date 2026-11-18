# 01 — Product Requirements Document (PRD): SIGNAL

**Product Name:** SIGNAL — Student Intelligence, Guidance & Nurturing Agent Layer  
**Document Version:** 1.0.0 (Production Blueprint)  
**Target Release:** P0 Full-Lifecycle Prototype (Day-1 Deliverable) + P1/P2 Roadmap  
**Owner:** Founding CTO, Chief Product Officer & Principal Systems Architect

---

## 1. Executive Summary & Product Thesis

Higher education institutions, edtech academies, and career accelerators lose 60–78% of high-intent prospective students between initial inquiry and enrollment. The root cause is not a lack of leads; it is **operational latency, generic drip spam, unverified chatbot hallucinations, and blind counsellor prioritization**:

1. **Speed-to-Lead Decay:** Prospects inquiring at 10:30 PM wait 14+ hours for a human reply, by which time intent has cooled or a competitor has engaged them.
2. **Opaque Lead Scoring:** Traditional CRMs use brittle rules (`+5 points for email open`) that fail to distinguish a curious browser from a ready-to-enroll applicant blocked by a single scholarship or EMI question.
3. **Unverified AI Risk:** Generic LLM wrappers hallucinate tuition fees, placement statistics, and eligibility criteria, creating severe compliance and brand liability.
4. **Counsellor Overload:** Human admissions counsellors spend 75% of their day chasing cold leads or answering repetitive syllabus queries instead of closing high-readiness candidates experiencing specific conversion friction.

**SIGNAL** solves this by operating as an **autonomous, grounded, multi-component Student Acquisition, Qualification, Engagement & Conversion Intelligence Layer**. Rather than acting as a passive chat widget, SIGNAL ingests multi-channel signals, evaluates behavioral intent and readiness, retrieves strictly verified programme facts with freshness guarantees, computes an explainable Next-Best-Action (NBA), executes personalized multilingual outreach or escalates to human counsellors with a complete intelligence brief, and closes the loop by feeding conversion outcomes back into its scoring and growth models.

---

## 2. Core Value Propositions & Strategic Differentiators

| Differentiator | Legacy Admissions CRM / Basic Chatbot | SIGNAL Autonomous Architecture | Demonstrable Business Impact |
| :--- | :--- | :--- | :--- |
| **Explainable Lead Scoring** | Black-box number or static demographic rules | Multi-axis score (`Fit`, `Intent`, `Readiness`, `Friction`) with itemized positive/negative factor attribution | Counsellors immediately see *why* a score is 84/100 and which exact barrier to resolve |
| **Zero-Hallucination Grounding** | Unconstrained LLM text generation | Mandatory `search_programme_facts` tool retrieval with source citation, confidence check, and freshness TTL enforcement | 0% fabricated fees, eligibility rules, or placement promises |
| **Friction & Drop-Off Detection** | Reacts only after 14 days of silence | Real-time classification of 8 canonical barriers (`FEE_ANXIETY`, `ELIGIBILITY_DOUBT`, `TIME_COMMITMENT`, `ROI_SKEPTICISM`, etc.) | Proactive objection handling via targeted proof points or financial aid workflows |
| **Deterministic + Agentic NBA** | Rigid linear email sequences | Hybrid supervisor agent + policy guardrail matrix selecting channel, timing, tone, and escalation level | Right intervention on the right channel (WhatsApp vs. Email vs. Human Call) |
| **Multilingual Cultural Nuance** | Literal machine translation | Native-register drafting across English, Hindi, Hinglish, Tamil, Telugu, Spanish, etc., preserving institutional terminology | Higher reply rates in regional and tier-2/3 student cohorts |
| **Closed-Loop Attribution** | Disconnected ad spend and enrollment tables | Source-level cohort LTV, barrier frequency by campaign, and experiment uplift tracking | Reallocates acquisition budget toward sources producing *verified conversions*, not just cheap clicks |

---

## 3. Target Personas & Jobs-to-Be-Done (JTBD)

### 3.1 Prospective Student ("Aarav", 22, Final-Year B.Tech / Working Professional)
- **Needs:** Instant, accurate answers on curriculum depth, eligibility, fee financing/scholarships, and career outcomes in his preferred language (e.g., English or Hinglish on WhatsApp) without being hounded by pushy sales calls.
- **Pain:** Confusing brochures, hidden fee structures, and sales reps who don't understand technical prerequisites.

### 3.2 Admissions Counsellor ("Priya", Senior Enrollment Advisor)
- **Needs:** A prioritized queue of high-intent or high-friction prospects where the AI has already gathered qualification details, answered baseline FAQs, identified the exact blocker (e.g., "Needs 12-month no-cost EMI breakdown"), and drafted a warm handoff summary.
- **Pain:** Wasting 4 hours/day dialing unreachable leads or repeating the same fee structure 40 times.

### 3.3 Head of Growth & Admissions Operations ("Vikram", VP Growth)
- **Needs:** Real-time visibility into source-to-enrollment conversion rates, drop-off bottlenecks by stage, AI agent execution reliability, knowledge gaps (questions prospects ask that lack verified documentation), and A/B experiment velocity.
- **Pain:** Blind spots between Meta/Google UTMs and actual tuition payments.

---

## 4. End-to-End Functional Architecture: The 10 Product Modules

### Module 1: Prospect Acquisition Studio
- **Purpose:** Multi-source lead capture, interactive progressive qualification micro-forms, UTM/referral attribution, and instant intent fingerprinting.
- **Inputs:** Web intake submissions, UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`), behavioral telemetry (pages viewed, brochure downloads, fee calculator interactions), webhook payloads from Meta/Google/LinkedIn Lead Ads, CSV batch imports, and WhatsApp inbound messages.
- **Outputs:** Normalized `prospects` + `prospect_profiles` records, initial `CONVERSION_EVENT` (`LEAD_CAPTURED`), and real-time trigger to the AI Qualification Engine.
- **Key Features:** Duplicate resolution (by phone E.164 / email), explicit consent capture (WhatsApp/Email opt-in + timestamp), and source quality tagging.

### Module 2: AI Qualification Engine
- **Purpose:** Continuous, explainable evaluation of every prospect across four orthogonal dimensions: **Academic/Career Fit (0–100)**, **Behavioral Intent (0–100)**, **Enrollment Readiness (0–100)**, and **Conversion Friction Risk (0–100)**.
- **Inputs:** Prospect profile, academic background, career goal, budget/timeline signals, interaction history, and message transcripts.
- **Outputs:** Structured `lead_assessments` record containing composite score, tier (`HOT`, `WARM`, `NURTURE`, `DISQUALIFIED`), itemized scoring breakdown (`[{ factor, delta, evidence }]`), detected intent class, and friction barriers.
- **Key Features:** Deterministic rule floor + LLM semantic extraction; historical score delta tracking.

### Module 3: Programme Knowledge Intelligence
- **Purpose:** Single source of truth for institutional facts (programmes, fees, scholarships, eligibility rules, deadlines, placement metrics, faculty, syllabus).
- **Inputs:** Official brochures (PDF/Markdown), Firecrawl-ingested institutional web pages, structured programme tables, and admin-verified updates.
- **Outputs:** Chunked, embedded (`pgvector` `text-embedding-3-small` 1536-d), metadata-tagged `programme_knowledge` chunks linked to `knowledge_sources` with `verified_at`, `expires_at`, and `verification_status`.
- **Key Features:** Hybrid search (vector cosine similarity + PostgreSQL full-text keyword match + category/programme filters), staleness alerts when `expires_at < now()`, and "Unanswered Question Detection" logging when agent retrieval confidence falls below `0.78`.

### Module 4: Next Best Action (NBA) Engine
- **Purpose:** Decision brain that synthesizes qualification scores, detected friction barriers, communication fatigue rules, and programme deadlines into an executable action recommendation.
- **Inputs:** Latest `lead_assessments`, recent `communications`, open `followup_tasks`, programme cohort start dates, and active `experiments`.
- **Outputs:** Structured NBA decision (`SEND_WHATSAPP_FOLLOWUP`, `SEND_EMAIL_BROCHURE`, `SHARE_SCHOLARSHIP_GUIDE`, `INVITE_WEBINAR`, `ESCALATE_COUNSELLOR_CALL`, `SCHEDULE_DEFERRED_CHECKIN`, `PAUSE_OUTREACH`) with confidence score, rationale, and human-approval flag.
- **Key Features:** Anti-spam frequency cap guardrails (max 1 outbound message per 18 hours unless replying to inbound prospect message).

### Module 5: Multilingual Engagement Studio
- **Purpose:** Drafts, previews, validates, and dispatches hyper-personalized, fact-grounded messages across WhatsApp and Email in the prospect's preferred language and register.
- **Inputs:** NBA decision, retrieved `programme_knowledge` citations, prospect profile, preferred language (`en`, `hi`, `hinglish`, `ta`, `te`, `es`), and channel constraints.
- **Outputs:** Grounded message payload (`communications` record), inline citation mapping showing which knowledge chunk supports each factual claim, and dispatch status via WhatsApp Cloud API or Resend.
- **Key Features:** Side-by-side English back-translation for counsellor audit, tone selector (`Empathetic Advisor`, `Academic Formal`, `Deadline Urgent`), and zero-hallucination validator check prior to send.

### Module 6: Automated Follow-Up Engine
- **Purpose:** Orchestrates asynchronous, event-driven, and time-delayed nurturing workflows via Next.js APIs and n8n webhooks/cron schedules.
- **Inputs:** `followup_tasks` queue, webhook callbacks (`delivered`, `read`, `replied`, `bounced`), and inactivity timers.
- **Outputs:** Automated task execution, state transitions (`PENDING` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED_ON_REPLY`), and drop-off re-engagement triggers.
- **Key Features:** Automatic sequence cancellation the millisecond a prospect replies or books a counsellor call.

### Module 7: Human Counsellor Command Centre
- **Purpose:** High-velocity workspace for human admissions advisors to manage escalations, review AI-prepared prospect briefs, approve high-stakes messages, and log call outcomes.
- **Inputs:** Escalated `followup_tasks`, SLA timers, prospect 360 history, and AI call-prep talking points.
- **Outputs:** Counsellor notes, approved/edited outbound messages, status transitions, and `conversion_events` (`COUNSELLOR_CALL_COMPLETED`, `APPLICATION_STARTED`, `OFFER_ISSUED`, `FEE_PAID`).
- **Key Features:** SLA breach countdowns, 1-click "Approve & Send AI Draft", and structured call disposition logging.

### Module 8: AI Agent Execution Control Room
- **Purpose:** Real-time observability, auditability, and human-in-the-loop governance over the SIGNAL Supervisor Agent and its 9 specialist tools.
- **Inputs:** `agent_runs` and `agent_tool_calls` streams via Supabase Realtime.
- **Outputs:** Live execution DAG/timeline, token/latency metrics, tool input/output JSON inspector, guardrail intervention logs, and manual re-run / override controls.
- **Key Features:** Complete transparency into why the agent chose a tool, what knowledge chunks were retrieved, and whether confidence thresholds were met.

### Module 9: Growth Intelligence Dashboard
- **Purpose:** Executive and growth analytics tying acquisition channels, campaign UTMs, programme demand, friction barriers, and counsellor performance directly to revenue and enrollment conversion.
- **Inputs:** Aggregated `prospects`, `lead_assessments`, `conversion_events`, `communications`, and `experiments`.
- **Outputs:** Funnel velocity charts, source ROI matrix, top conversion barriers heatmap, and AI-synthesized weekly operational insights.
- **Key Features:** Cohort comparison and automated anomaly surfacing (e.g., "Meta Campaign 'DataSci_Q4' has 2.4x higher `FEE_ANXIETY` barrier than organic search").

### Module 10: Conversion Feedback Engine
- **Purpose:** Closes the learning loop by analyzing won vs. lost/dropped prospects, evaluating experiment cohorts, and calibrating scoring weights and NBA playbooks.
- **Inputs:** Terminal `conversion_events` (`ENROLLED`, `DROPPED_OUT`, `OFFER_DECLINED`), counsellor disposition reasons, and experiment variant assignments.
- **Outputs:** Experiment lift statistics (`experiments` table), scoring calibration insights, and playbook efficacy rankings.

---

## 5. Prioritized Delivery Plan (P0 vs. P1 vs. P2)

### P0: Critical Working MVP (Constrained 1-Day Prototype — 100% Executable End-to-End)
1. **End-to-End Data Flow:** Prospect capture (Acquisition Studio or interactive simulator) → Live Supervisor Agent run (`score_prospect` → `classify_intent` → `detect_conversion_barriers` → `search_programme_facts` → `recommend_next_action` → `draft_multilingual_followup` → `create_followup_task` / `escalate_to_counsellor`) → Persisted in PostgreSQL/Supabase → Reflected live across Command Centre, Prospect 360, Agent Control Room, Counsellor Workspace, and Growth Intelligence.
2. **Complete 8-Screen Enterprise UI:** Deep navy (`#070B14`) Linear/Attio/Vercel-inspired interface with real database reads/writes, interactive agent trigger, live tool trace inspector, multilingual message studio, knowledge verifier, and conversion event recorder.
3. **Grounded RAG & Guardrails:** Seeded verified programmes (`B.Tech AI & Data Science`, `PGP in Applied Machine Learning`, `Executive MBA in Digital Transformation`) with strict source attribution and anti-hallucination guardrails.

### P1: Important Differentiators (Week 1 Post-Prototype)
1. **Live External Webhook Dispatch:** Production WhatsApp Cloud API template & session messaging + Resend transactional email delivery with live `delivered`/`read` webhook ingestion.
2. **Firecrawl Automated Knowledge Sync:** Scheduled n8n workflow crawling official university URLs, diffing fee/deadline changes, and queuing knowledge chunks for admin verification.
3. **Supabase Realtime Live Subscriptions:** Multi-counsellor presence and sub-second push updates on inbound student WhatsApp messages.

### P2: Advanced Enhancements (Month 1 Roadmap)
1. **Voice AI Pre-Qualification Call Agent:** Low-latency voice briefings for high-intent leads requesting an immediate callback.
2. **Predictive Propensity Calibration:** Automated logistic regression / gradient-boosted weight tuning from 1,000+ historical `conversion_events`.
3. **ERP / SIS Bi-Directional Sync:** Native connectors for Salesforce Education Cloud, LeadSquared, Banner, and Slate.

---

## 6. Success Metrics & KPIs

| Metric Category | KPI | Baseline (Pre-SIGNAL) | Target (With SIGNAL) | Measurement Source |
| :--- | :--- | :--- | :--- | :--- |
| **Speed & Responsiveness** | P95 First Intelligent Response Latency | 11.4 hours | **< 12 seconds** | `agent_runs.duration_ms` |
| **Qualification Accuracy** | High-Intent Lead Precision (Enroll % of `HOT` leads) | 14% | **> 38%** | `lead_assessments` vs `conversion_events` |
| **Knowledge Compliance** | Unverified Fact / Hallucination Rate | 8–15% (generic LLM) | **0.0%** | `agent_tool_calls` guardrail audit |
| **Counsellor Efficiency** | Counsellor Time Spent on Qualified/Escalated Leads | 28% | **> 80%** | `followup_tasks` disposition logs |
| **Conversion Lift** | Inquiry-to-Application Conversion Rate | 9.2% | **16.5% (+79% relative)** | `conversion_events` funnel table |
