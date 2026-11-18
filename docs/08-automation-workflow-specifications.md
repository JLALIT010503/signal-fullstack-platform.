# 08 — Automation Workflow Specifications (n8n, Webhooks & Scheduled Jobs): SIGNAL

**Automation Engine:** n8n (Self-Hosted or Cloud) + Next.js Signed Webhook Endpoints (`/api/v1/webhooks/*`)  
**Security:** HMAC-SHA256 signature verification (`X-Signal-Signature`) + `Idempotency-Key` header on every webhook execution

---

## 1. Workflow Architecture Overview

While synchronous prospect qualification and immediate response drafting execute directly inside the Next.js Supervisor Agent runtime (`< 3 seconds`), **asynchronous timers, multi-day nurture sequences, SLA breach escalations, and scheduled Firecrawl knowledge freshness checks** are orchestrated by **4 production n8n workflows**.

---

## 2. Workflow 1: Inbound Prospect & Omnichannel Reply Router (`WF-01-INBOUND-ROUTER`)

### Trigger
- **Webhook:** `POST /webhook/signal-inbound-message` (receives events from WhatsApp Cloud API `messages` webhook, Resend inbound parse, or Acquisition Studio intake).

### Execution Nodes
1. **HMAC Signature Validator:** Verifies `X-Hub-Signature-256` (WhatsApp) or `X-Signal-Signature`. Rejects unsigned requests with `401`.
2. **Opt-Out Interceptor (Deterministic Fast-Path):**
   - Checks if normalized message text matches `^(stop|unsubscribe|dnd|nahi chahiye|opt out)$` (case-insensitive).
   - **If True:** Calls `PATCH /api/v1/prospects/consent` to set `consent_whatsapp = false`, cancels all `PENDING` `followup_tasks` for the prospect, sends mandatory compliance confirmation, and terminates.
3. **Cancel Pending Automated Sequences:**
   - Calls `POST /api/v1/webhooks/n8n` (`event: "PROSPECT_REPLIED"`) to transition any scheduled `AUTOMATED_WHATSAPP_FOLLOWUP` or `AUTOMATED_EMAIL_NURTURE` tasks to `CANCELLED_ON_REPLY` so the prospect never receives a stale drip message after replying.
4. **Invoke SIGNAL Supervisor Agent:**
   - Calls `POST /api/v1/agent/execute` with `{ prospect_id, trigger_type: "INBOUND_INQUIRY", latest_message }`.
5. **Channel Dispatch Branch:**
   - If the agent output `communication.status === 'SENT'` (auto-approved):
     - **WhatsApp Branch:** Calls Meta Graph API `POST https://graph.facebook.com/v21.0/{{PHONE_NUMBER_ID}}/messages` with localized body.
     - **Email Branch:** Calls Resend API `POST https://api.resend.com/emails` with formatted HTML + brochure attachment link.
   - If `requires_human_approval === true`:
     - Pushes high-priority alert to Counsellor Workspace via Supabase Realtime & Slack/Teams webhook.

---

## 3. Workflow 2: Drop-Off Prevention & Scheduled Nurture Cadence (`WF-02-NURTURE-CADENCE`)

### Trigger
- **Cron Schedule:** Runs every 15 minutes (`*/15 * * * *`).

### Execution Nodes
1. **Fetch Due Tasks:** Queries `GET /api/v1/tasks?status=PENDING&due_before=now()&type=AUTOMATED_*`.
2. **Pre-Flight Guardrail Check (Per Prospect):**
   - Has the prospect replied since `task.created_at`? → If yes, mark `CANCELLED_ON_REPLY`.
   - Has the prospect already reached `APPLICATION_SUBMITTED` or `ENROLLED`? → If yes, mark `COMPLETED`.
   - Has the prospect received an outbound message within the last 18 hours (Anti-Fatigue Cap)? → If yes, defer `scheduled_for` by `+6 hours`.
3. **Barrier-Specific Re-Engagement Generation:**
   - Calls `POST /api/v1/agent/execute` with `trigger_type: "SCHEDULED_FOLLOWUP"`.
   - The Supervisor Agent inspects the prospect's top unresolved barrier (`lead_assessments.detected_barriers[0]`):
     - If `FEE_ANXIETY`: Sends verified Scholarship Aptitude Test invitation & EMI breakdown sheet.
     - If `ELIGIBILITY_DOUBT` / `TECHNICAL_PREREQUISITE_FEAR`: Sends 3-week Python Foundations Bridge syllabus & alumni transition story.
     - If `ROI_OR_PLACEMENT_SKEPTICISM`: Sends verified cohort placement report with role breakdown.
4. **Update Task & Audit Log:** Marks `followup_tasks.status = 'COMPLETED'` and writes delivery receipt to `communications`.

---

## 4. Workflow 3: Human Counsellor SLA Breach Monitor (`WF-03-SLA-GUARDIAN`)

### Trigger
- **Cron Schedule:** Runs every 5 minutes (`*/5 * * * *`).

### Execution Nodes
1. **Query At-Risk Escalations:**
   - Selects `followup_tasks` where `task_type = 'HUMAN_COUNSELLOR_CALL'`, `status = 'PENDING'`, and `sla_due_at <= now() + INTERVAL '10 minutes'`.
2. **Tiered Intervention:**
   - **Warning (`10 minutes` before breach):** Pings assigned counsellor in Counsellor Command Centre with a high-visibility amber SLA badge.
   - **Breach (`sla_due_at < now()`):**
     1. Marks task `OVERDUE`.
     2. Queries `counsellor_users` for the next available online counsellor matching `preferred_language` and `target_programme_code` with lowest `current_active_load`.
     3. Reassigns `assigned_counsellor_id` and logs `SLA_AUTO_REASSIGNED` in `audit_logs`.
     4. Dispatches an empathetic holding WhatsApp message to the prospect so they are never left waiting without an update.

---

## 5. Workflow 4: Firecrawl Knowledge Freshness & Verification Pipeline (`WF-04-KNOWLEDGE-SYNC`)

### Trigger
- **Cron Schedule:** Daily at `02:00 IST` (`30 20 * * *` UTC) or manual trigger from Knowledge Centre UI.

### Execution Nodes
1. **Identify Expiring or Monitored Sources:**
   - Queries `knowledge_sources` where `expires_at <= now() + INTERVAL '7 days'` or `source_type = 'UNIVERSITY_WEBPAGE'`.
2. **Firecrawl Extraction:**
   - Calls Firecrawl API (`POST https://api.firecrawl.dev/v1/scrape`) with `formats: ["markdown"]` on each `source_url`.
3. **SHA-256 Checksum Comparison:**
   - Computes `sha256(scraped_markdown)` and compares against `knowledge_sources.checksum_sha256`.
   - **If Identical:** Extends `last_crawled_at = now()` and logs heartbeat.
   - **If Changed (e.g., fee revision or deadline extension):**
     1. Stages new chunks with `verification_status = 'PENDING_REVIEW'`.
     2. Highlights diff in the **Knowledge Centre** for Admin 1-click verification before replacing active RAG chunks.
4. **Hard Expiration Enforcement:**
   - Any source where `expires_at < now()` and unverified is automatically marked `EXPIRED`, immediately excluding it from `match_programme_knowledge` RPC results so the agent can never cite stale deadlines or old tuition fees.
