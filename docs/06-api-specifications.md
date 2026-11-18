# 06 — REST & Webhook API Specifications: SIGNAL

**Base Path:** `/api/v1`  
**Transport & Format:** HTTPS, `application/json`, UTF-8  
**Authentication:** Supabase JWT (`Authorization: Bearer <token>`) or Signed Webhook Header (`X-Signal-Signature` / `X-Hub-Signature-256`)  
**Validation Engine:** Strict Zod runtime validation on all path params, query params, and request bodies

---

## 1. Standard Response Envelope & Error Contract

Every endpoint returns a deterministic JSON envelope:

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: {
    request_id: string;
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
  error?: {
    code:
      | 'VALIDATION_ERROR'
      | 'UNAUTHORIZED'
      | 'FORBIDDEN_RLS'
      | 'NOT_FOUND'
      | 'RATE_LIMITED'
      | 'CONSENT_BLOCKED'
      | 'KNOWLEDGE_UNVERIFIED'
      | 'AGENT_EXECUTION_ERROR';
    message: string;
    details?: Record<string, unknown>;
  };
}
```

---

## 2. Core Endpoints Reference

### 2.1 Prospect Acquisition & 360 Management

#### `POST /api/v1/prospects`
Captures a new prospect or merges an existing prospect by `email` / `phone_e164`, creates/updates `prospect_profiles`, logs `LEAD_CAPTURED` in `conversion_events`, and optionally auto-triggers the Supervisor Agent.

- **Request Body (`CreateProspectSchema`):**
```json
{
  "first_name": "Aarav",
  "last_name": "Mehta",
  "email": "aarav.mehta@example.com",
  "phone_e164": "+919829011223",
  "preferred_language": "hinglish",
  "preferred_channel": "WHATSAPP",
  "target_programme_code": "PGP-AIML",
  "city": "Jaipur",
  "highest_qualification": "B.Com (Hons)",
  "graduation_year": 2024,
  "cgpa_or_percentage": 74.5,
  "work_experience_months": 18,
  "current_role": "Junior Data Analyst",
  "career_goal": "Transition into Applied Machine Learning Engineer role",
  "budget_sensitivity": "NEEDS_SCHOLARSHIP_OR_EMI",
  "raw_initial_inquiry": "Main B.Com background se hoon, worked 1.5 yrs in SQL. Kya main PGP AI & ML ke liye eligible hoon? Total fee aur no-cost EMI milegi kya?",
  "utm_source": "youtube_creator_collab",
  "utm_medium": "video_description",
  "utm_campaign": "aiml_q4_cohort",
  "consent_whatsapp": true,
  "consent_email": true,
  "consent_call": true,
  "auto_run_agent": true
}
```
- **Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "prospect_id": "c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d",
    "lifecycle_stage": "QUALIFYING",
    "agent_run_id": "9f8e7d6c-5b4a-4321-8765-1a2b3c4d5e6f",
    "agent_run_status": "COMPLETED"
  }
}
```

#### `GET /api/v1/prospects`
Lists prospects with multi-facet filtering (`stage`, `tier`, `programme_code`, `utm_source`, `barrier`, `assigned_counsellor_id`, `search`, `sort_by`).

#### `GET /api/v1/prospects/[id]/360`
Returns the unified **Prospect 360** payload in a single round-trip:
- `prospect` + `profile`
- `latest_assessment` (4-axis scores, breakdown factors, detected barriers, NBA recommendation)
- `assessment_history[]`
- `communications[]` (with inline `citation_metadata`)
- `followup_tasks[]`
- `agent_runs[]` (with nested `agent_tool_calls[]`)
- `conversion_events[]`

---

### 2.2 Supervisor Agent Execution & Control Room

#### `POST /api/v1/agent/execute`
Executes the SIGNAL Supervisor Agent loop for a specified prospect.

- **Request Body (`ExecuteAgentSchema`):**
```json
{
  "prospect_id": "c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d",
  "trigger_type": "INBOUND_INQUIRY",
  "latest_message": "Kya main B.Com ke baad PGP AI & ML kar sakta hoon? EMI kitni aayegi?",
  "force_language": "hinglish"
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "agent_run_id": "9f8e7d6c-5b4a-4321-8765-1a2b3c4d5e6f",
    "status": "COMPLETED",
    "guardrail_status": "PASSED",
    "confidence_score": 0.94,
    "duration_ms": 2840,
    "assessment": {
      "composite_score": 84,
      "fit_score": 82,
      "intent_score": 91,
      "readiness_score": 76,
      "friction_score": 68,
      "tier": "HOT",
      "primary_intent": "ELIGIBILITY_AND_FINANCING_INQUIRY",
      "detected_barriers": [
        { "code": "ELIGIBILITY_DOUBT", "severity": 0.78 },
        { "code": "FEE_ANXIETY", "severity": 0.72 }
      ]
    },
    "next_best_action": {
      "action_type": "SEND_WHATSAPP_FOLLOWUP",
      "secondary_action": "ESCALATE_COUNSELLOR_CALL",
      "requires_human_approval": false
    },
    "drafted_communication_id": "d1a2b3c4-e5f6-4789-8012-3456789abcde",
    "created_task_id": "f6e5d4c3-b2a1-4987-8654-3210fedcba98",
    "tool_calls_count": 7
  }
}
```

#### `GET /api/v1/agent/runs` & `GET /api/v1/agent/runs/[runId]`
Retrieves live and historical agent runs along with every step's `tool_input`, `tool_output`, retrieved `knowledge_chunk_ids`, latency, and guardrail decisions.

---

### 2.3 Programme Knowledge Intelligence

#### `POST /api/v1/knowledge/search`
Executes hybrid vector (`pgvector`) + full-text (`tsvector`) retrieval restricted strictly to `verification_status = 'VERIFIED'` and `expires_at > now()`.

- **Request Body:**
```json
{
  "query": "eligibility criteria for non engineering B.Com graduate and 12 month no-cost EMI fee",
  "programme_code": "PGP-AIML",
  "categories": ["ELIGIBILITY", "FEES", "SCHOLARSHIPS"],
  "top_k": 4
}
```
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "is_grounded": true,
    "max_similarity": 0.924,
    "chunks": [
      {
        "chunk_id": "11111111-2222-4333-8444-555555555501",
        "programme_code": "PGP-AIML",
        "category": "ELIGIBILITY",
        "chunk_title": "Academic Eligibility & Non-CS Python Foundations Bridge",
        "content_markdown": "Candidates holding a Bachelor's degree (B.Tech, B.Sc, B.Com, BCA, BBA, Economics) with a minimum of 55% aggregate marks are eligible...",
        "structured_facts": {
          "min_percentage": 55,
          "non_cs_eligible": true,
          "bridge_course_duration_weeks": 3,
          "bridge_course_fee_inr": 0
        },
        "source_title": "PGP-AIML Official Admissions Prospectus 2026-27",
        "source_url": "https://admissions.signal-institute.edu/pgp-aiml/prospectus-2026",
        "verified_at": "2026-11-01T00:00:00Z",
        "expires_at": "2027-03-31T23:59:59Z",
        "similarity": 0.924
      }
    ]
  }
}
```

#### `POST /api/v1/knowledge/ingest`
Ingests a verified document or triggers Firecrawl scraping on an institutional URL, chunks the markdown, computes `text-embedding-3-small` vectors, and writes to `knowledge_sources` + `programme_knowledge`.

---

### 2.4 Multilingual Engagement, Counsellor Escalations & Conversions

#### `POST /api/v1/communications/send`
Approves, edits, or dispatches a drafted message via WhatsApp Cloud API or Resend email after verifying channel consent and factual citation grounding.

#### `POST /api/v1/tasks/[id]/resolve`
Allows a counsellor to claim an escalation, record call notes, and transition task status to `COMPLETED`.

#### `POST /api/v1/conversions`
Records a verified funnel progression event (`COUNSELLOR_CALL_COMPLETED`, `APPLICATION_STARTED`, `OFFER_ISSUED`, `ENROLLED`, `DROPPED_OUT`), updates `prospects.lifecycle_stage`, and triggers the Conversion Feedback Engine to update cohort & experiment lift metrics.

#### `GET /api/v1/analytics/growth`
Returns aggregated funnel conversion rates, UTM source ROI, friction barrier frequency distribution, counsellor SLA compliance, and active A/B experiment statistics.

---

### 2.5 Webhook Endpoints

| Endpoint | Source | Signature Header | Purpose |
| :--- | :--- | :--- | :--- |
| `POST /api/v1/webhooks/whatsapp` | Meta WhatsApp Cloud API | `X-Hub-Signature-256` | Receives inbound student WhatsApp replies + `delivered`/`read` status receipts |
| `POST /api/v1/webhooks/resend` | Resend Email | `svix-signature` | Processes email `delivered`, `opened`, `clicked`, and `bounced` events |
| `POST /api/v1/webhooks/n8n` | n8n Workflow Engine | `X-Signal-Signature` | Executes scheduled follow-up nudges, SLA breach escalations, and knowledge freshness sweeps |
