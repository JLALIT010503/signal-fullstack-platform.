# 07 — AI Agent Architecture & Specialist Tool Contracts: SIGNAL

**Orchestration Framework:** OpenAI Agents SDK for TypeScript + OpenAI Responses/Tool Calling API (`gpt-4o-2024-08-06` with `strict: true` JSON Schemas)  
**Architecture Pattern:** Single Deterministic-Guardrailed Supervisor Agent with 9 Specialist Tools  
**Zero-Hallucination Policy:** Hard enforcement that every programme claim (fee, eligibility, scholarship, deadline, placement metric) MUST reference a `chunk_id` returned by `search_programme_facts` during the same run.

---

## 1. Supervisor Agent System Instructions

```markdown
You are the SIGNAL Supervisor Agent — an autonomous, compliance-first Student Intelligence, Qualification, Guidance & Nurturing orchestrator for higher education and career accelerator programmes.

### MANDATORY EXECUTION PROTOCOL
For every prospect interaction or lifecycle trigger, you MUST execute your specialist tools in a disciplined sequence:
1. ANALYSE INTENT & BARRIERS: Call `classify_intent` and `detect_conversion_barriers` on the prospect's profile and inquiry text.
2. SCORE PROSPECT: Call `score_prospect` to compute an explainable 4-axis score (Fit, Intent, Readiness, Friction) with explicit evidence bullets.
3. RETRIEVE VERIFIED FACTS: Whenever the prospect asks a question or has a barrier related to curriculum, eligibility, tuition fees, EMI/financing, scholarships, placement outcomes, or deadlines, you MUST call `search_programme_facts`.
4. DECIDE NEXT BEST ACTION: Call `recommend_next_action` based on the assessment score, barrier severity, retrieved fact confidence, and communication cadence rules.
5. ACT OR ESCALATE:
   - If `search_programme_facts` returns `max_similarity < 0.78` or no verified chunks cover the prospect's specific factual question, DO NOT guess or extrapolate. Immediately call `escalate_to_counsellor` with reason `UNVERIFIED_FACT_QUERY` and draft only a safe holding acknowledgement.
   - Otherwise, call `draft_multilingual_followup` in the prospect's preferred language (`en`, `hi`, `hinglish`, `ta`, `te`, `es`), explicitly passing the `cited_chunk_ids` that support every number or policy stated.
   - Call `create_followup_task` to schedule the next touchpoint, and if the prospect is `HOT` (score >= 75) or has high-friction financial/eligibility barriers, also call `escalate_to_counsellor`.
   - Whenever a milestone transition occurs, call `record_conversion_event`.

### NON-NEGOTIABLE GUARDRAILS
- NEVER invent, estimate, or round tuition fees, EMI amounts, scholarship percentages, eligibility cutoffs, cohort start dates, or placement statistics.
- NEVER promise "100% placement guarantee" or "guaranteed admission".
- NEVER schedule or send outreach on a channel where the prospect's consent flag (`consent_whatsapp`, `consent_email`, `consent_call`) is `false`.
```

---

## 2. The 9 Required Specialist Tool Contracts (Strict JSON / Zod Schemas)

### Tool 1: `score_prospect`
Computes the explainable 4-axis qualification score and persists a `lead_assessments` record.

```typescript
export const ScoreProspectInputSchema = z.object({
  prospect_id: z.string().uuid(),
  fit_score: z.number().min(0).max(100).describe("Academic and work experience alignment with programme prerequisites (0-100)"),
  intent_score: z.number().min(0).max(100).describe("Behavioral urgency and specificity of inquiry (0-100)"),
  readiness_score: z.number().min(0).max(100).describe("Timeline and financial readiness to enroll in upcoming cohort (0-100)"),
  friction_score: z.number().min(0).max(100).describe("Magnitude of unresolved conversion barriers (0-100, higher means more friction)"),
  drop_off_probability: z.number().min(0).max(1).describe("Predicted probability of prospect dropping out within 7 days without intervention (0.0-1.0)"),
  tier: z.enum(["HOT", "WARM", "NURTURE", "DISQUALIFIED"]),
  score_breakdown: z.array(
    z.object({
      dimension: z.enum(["FIT", "INTENT", "READINESS", "FRICTION"]),
      factor: z.string(),
      delta: z.number().describe("Positive or negative point contribution, e.g., +25 or -12"),
      evidence: z.string().describe("Direct quote or profile attribute justifying this delta")
    })
  ).min(3)
});
```
- **Composite Formula:** `Composite = round(0.30 * fit_score + 0.35 * intent_score + 0.25 * readiness_score + 0.10 * (100 - friction_score))`

---

### Tool 2: `classify_intent`
Classifies the primary and secondary behavioral intent of the prospect's latest interaction.

```typescript
export const ClassifyIntentInputSchema = z.object({
  prospect_id: z.string().uuid(),
  primary_intent: z.enum([
    "DIRECT_ADMISSION_APPLICATION",
    "ELIGIBILITY_AND_PREREQUISITE_CHECK",
    "FEE_SCHOLARSHIP_AND_EMI_INQUIRY",
    "CURRICULUM_AND_CAPSTONE_COMPARISON",
    "CAREER_OUTCOMES_AND_PLACEMENT_ROI",
    "SCHEDULE_COUNSELLOR_CALLBACK",
    "GENERAL_EXPLORATION",
    "OPT_OUT_OR_NOT_INTERESTED"
  ]),
  secondary_intent: z.string().nullable(),
  urgency_level: z.enum(["IMMEDIATE", "HIGH", "MODERATE", "EXPLORATORY"]),
  buying_stage: z.enum(["AWARENESS", "CONSIDERATION", "EVALUATION", "DECISION"]),
  confidence: z.number().min(0).max(1),
  evidence_quotes: z.array(z.string())
});
```

---

### Tool 3: `detect_conversion_barriers`
Identifies specific friction points blocking the prospect from starting or completing their application.

```typescript
export const DetectConversionBarriersInputSchema = z.object({
  prospect_id: z.string().uuid(),
  barriers: z.array(
    z.object({
      code: z.enum([
        "FEE_ANXIETY",
        "ELIGIBILITY_DOUBT",
        "TIME_COMMITMENT_CONFLICT",
        "ROI_OR_PLACEMENT_SKEPTICISM",
        "EMPLOYER_OR_FAMILY_APPROVAL",
        "COMPETITOR_COMPARISON",
        "TECHNICAL_PREREQUISITE_FEAR",
        "DEADLINE_PROCRASTINATION"
      ]),
      severity: z.number().min(0).max(1).describe("0.0 to 1.0 severity score"),
      evidence: z.string(),
      recommended_rebuttal_category: z.enum([
        "SCHOLARSHIPS",
        "FEES",
        "ELIGIBILITY",
        "PLACEMENTS",
        "CURRICULUM",
        "DEADLINES"
      ])
    })
  )
});
```

---

### Tool 4: `search_programme_facts`
Executes hybrid vector + keyword retrieval against `programme_knowledge` joined with `knowledge_sources`, enforcing freshness (`expires_at > now()`) and `verification_status = 'VERIFIED'`.

```typescript
export const SearchProgrammeFactsInputSchema = z.object({
  programme_code: z.enum(["PGP-AIML", "BTECH-AIDS", "EMBA-DT"]),
  search_queries: z.array(z.string()).min(1).max(4),
  categories: z.array(
    z.enum([
      "OVERVIEW",
      "ELIGIBILITY",
      "FEES",
      "SCHOLARSHIPS",
      "CURRICULUM",
      "PLACEMENTS",
      "DEADLINES",
      "FACULTY",
      "FAQ"
    ])
  ).min(1)
});
```
- **Output Contract:** Returns `chunks[]` with `chunk_id`, `chunk_title`, `content_markdown`, `structured_facts`, `source_title`, `source_url`, `verified_at`, `expires_at`, `similarity`, and `grounding_passed: boolean` (`true` iff `max_similarity >= 0.78`).

---

### Tool 5: `recommend_next_action`
Determines the optimal next best action, channel, timing, and whether human counsellor approval is required.

```typescript
export const RecommendNextActionInputSchema = z.object({
  prospect_id: z.string().uuid(),
  action_type: z.enum([
    "SEND_WHATSAPP_FOLLOWUP",
    "SEND_EMAIL_BROCHURE_AND_FEE_SHEET",
    "SHARE_SCHOLARSHIP_APTITUDE_LINK",
    "SEND_PYTHON_BRIDGE_SYLLABUS",
    "ESCALATE_COUNSELLOR_CALL",
    "SCHEDULE_48H_NURTURE_CHECKIN",
    "PAUSE_OUTREACH_OPT_OUT"
  ]),
  secondary_action: z.enum([
    "NONE",
    "ESCALATE_COUNSELLOR_CALL",
    "CREATE_SCHOLARSHIP_REVIEW_TASK",
    "SCHEDULE_48H_NURTURE_CHECKIN"
  ]),
  recommended_channel: z.enum(["WHATSAPP", "EMAIL", "PHONE_CALL"]),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  confidence: z.number().min(0).max(1),
  requires_human_approval: z.boolean(),
  rationale: z.string()
});
```

---

### Tool 6: `draft_multilingual_followup`
Drafts a personalized message in the prospect's preferred language with mandatory citation linking and English back-translation.

```typescript
export const DraftMultilingualFollowupInputSchema = z.object({
  prospect_id: z.string().uuid(),
  channel: z.enum(["WHATSAPP", "EMAIL"]),
  language_code: z.enum(["en", "hi", "hinglish", "ta", "te", "es"]),
  subject: z.string().nullable().describe("Required for EMAIL, null for WHATSAPP"),
  body_localized: z.string().min(20).describe("Message written naturally in the target language/register"),
  body_english_translation: z.string().min(20).describe("Faithful English translation for counsellor audit"),
  cited_chunk_ids: z.array(z.string().uuid()).min(1).describe("UUIDs of verified programme_knowledge chunks used"),
  factual_claims_verified: z.array(
    z.object({
      claim_text: z.string(),
      supporting_chunk_id: z.string().uuid()
    })
  ),
  requires_human_approval: z.boolean()
});
```

---

### Tool 7: `create_followup_task`
Creates an automated or counsellor-assigned follow-up task with SLA deadlines and AI talking points.

```typescript
export const CreateFollowupTaskInputSchema = z.object({
  prospect_id: z.string().uuid(),
  task_type: z.enum([
    "AUTOMATED_WHATSAPP_FOLLOWUP",
    "AUTOMATED_EMAIL_NURTURE",
    "HUMAN_COUNSELLOR_CALL",
    "SCHOLARSHIP_REVIEW",
    "ELIGIBILITY_VERIFICATION",
    "APPLICATION_COMPLETION_NUDGE"
  ]),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  title: z.string(),
  ai_brief_markdown: z.string(),
  talking_points: z.array(z.string()).min(2),
  sla_minutes_from_now: z.number().int().min(5).max(10080)
});
```

---

### Tool 8: `escalate_to_counsellor`
Assigns a prospect to the optimal human admissions counsellor based on language match, programme specialization, and active load, and opens a high-priority escalation ticket.

```typescript
export const EscalateToCounsellorInputSchema = z.object({
  prospect_id: z.string().uuid(),
  escalation_reason: z.enum([
    "HIGH_INTENT_HOT_LEAD",
    "COMPLEX_FINANCING_OR_SCHOLARSHIP",
    "NON_STANDARD_ELIGIBILITY_CASE",
    "UNVERIFIED_FACT_QUERY",
    "EXPLICIT_HUMAN_CALL_REQUEST",
    "HIGH_DROP_OFF_RISK_INTERVENTION"
  ]),
  urgency: z.enum(["CRITICAL_15M", "HIGH_30M", "STANDARD_2H"]),
  counsellor_brief: z.string().describe("Concise executive summary of prospect background, score, barriers, and exact question to resolve"),
  recommended_opening_line: z.string()
});
```

---

### Tool 9: `record_conversion_event`
Logs an auditable funnel milestone in `conversion_events` and updates the prospect's lifecycle stage.

```typescript
export const RecordConversionEventInputSchema = z.object({
  prospect_id: z.string().uuid(),
  event_type: z.enum([
    "LEAD_CAPTURED",
    "QUALIFIED_HOT",
    "BROCHURE_ENGAGED",
    "COUNSELLOR_CALL_COMPLETED",
    "APPLICATION_STARTED",
    "APPLICATION_SUBMITTED",
    "APTITUDE_TEST_CLEARED",
    "OFFER_ISSUED",
    "SCHOLARSHIP_AWARDED",
    "TUITION_DEPOSIT_PAID",
    "ENROLLED",
    "DROPPED_OUT"
  ]),
  revenue_value_inr: z.number().min(0).default(0),
  resolved_barriers: z.array(z.string()).default([]),
  notes: z.string()
});
```

---

## 3. Confidence Thresholds, Guardrails & Human Approval Matrix

| Condition / Check | Threshold / Rule | Automated System Behavior |
| :--- | :--- | :--- |
| **Knowledge Retrieval Confidence** | `max_similarity >= 0.78` AND `expires_at > now()` | Agent may cite retrieved facts and auto-draft response |
| **Knowledge Gap / Low Similarity** | `max_similarity < 0.78` OR `chunks.length === 0` | Blocks factual claims; sets `guardrail_status = 'KNOWLEDGE_GAP_ESCALATED'`; triggers `escalate_to_counsellor` |
| **Numeric Claim Verification** | Deterministic regex check on currency/percentage tokens in `body_localized` | Every number in outbound draft must appear in the retrieved `programme_knowledge` chunks or the draft is flagged `PENDING_APPROVAL` |
| **NBA Auto-Send Confidence** | `nba_confidence >= 0.82` AND standard inquiry | Marks communication `SENT` / `QUEUED` immediately |
| **Low NBA Confidence or Custom Waiver** | `nba_confidence < 0.82` OR custom scholarship exception request | Marks communication `PENDING_APPROVAL` in Counsellor Command Centre |
| **LLM API Timeout / Failure** | OpenAI API timeout `> 12s` or `5xx` error | Executes deterministic fallback scorer (`src/lib/agent/fallback.ts`), logs `status = 'FALLBACK_EXECUTED'`, and queues task so zero leads are lost |
