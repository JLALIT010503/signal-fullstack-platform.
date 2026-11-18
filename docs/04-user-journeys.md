# 04 — User Journeys & Operational Workflows: SIGNAL

**Document Version:** 1.0.0  
**Scope:** End-to-End Executable Journeys across Prospective Students, Admissions Counsellors, AI Operations Engineers, and Growth Leaders

---

## Journey 1: Prospective Student — High-Intent Inquiry with Eligibility & Financing Friction (P0 Core Path)

### Persona & Context
- **Prospect:** Aarav Mehta (23, B.Com graduate with 1.5 years in data analytics, based in Jaipur, India).
- **Target Programme:** Postgraduate Programme in Applied AI & Machine Learning (`PGP-AIML`).
- **Channel & Language:** Inbound web inquiry + WhatsApp opt-in, prefers **Hinglish** (conversational Hindi-English mix) or **English**.
- **Raw Inquiry:** *"Main B.Com background se hoon, worked 1.5 yrs in Excel/SQL. Kya main PGP AI & ML ke liye eligible hoon? Aur total fee kya hai, no-cost EMI milegi kya?"*

### Step-by-Step System Execution
1. **Capture & Normalization (`Prospect Acquisition Studio`):**
   - `POST /api/v1/prospects` normalizes phone (`+919829011223`), records `consent_whatsapp = true`, tags `utm_source = "youtube_creator_collab"`, creates `prospects` and `prospect_profiles`, and logs `conversion_events(LEAD_CAPTURED)`.
2. **Supervisor Agent Activation (`AI Agent Execution Control Room`):**
   - `POST /api/v1/agent/execute` creates `agent_runs` record (`run_id`) and invokes the Supervisor Agent.
3. **Intent & Barrier Detection (`AI Qualification Engine`):**
   - Agent calls `classify_intent` → returns `PRIMARY: ELIGIBILITY_VERIFICATION`, `SECONDARY: FEE_AND_FINANCING`, `urgency: HIGH`.
   - Agent calls `detect_conversion_barriers` → identifies:
     - `ELIGIBILITY_DOUBT` (Severity: `0.78`, Evidence: *"Non-engineering B.Com degree questioning AI/ML eligibility"*)
     - `FEE_ANXIETY` (Severity: `0.72`, Evidence: *"Explicitly asking for total fee and no-cost EMI availability"*)
4. **Explainable Qualification Scoring (`score_prospect`):**
   - Computes:
     - `fit_score`: **82/100** (`+35` 1.5 yrs SQL/analytics experience, `+25` quantitative degree, `-8` non-CS undergraduate requires bridge module).
     - `intent_score`: **91/100** (`+45` direct multi-part programme + fee inquiry, `+26` YouTube deep-dive referral).
     - `readiness_score`: **76/100** (Immediate cohort interest, pending EMI clarity).
     - `friction_score`: **68/100** (Two active barriers: Eligibility + EMI).
     - `composite_score`: **84/100** → Tier: **`HOT`**.
5. **Verified Knowledge Retrieval (`Programme Knowledge Intelligence`):**
   - Agent calls `search_programme_facts` for `PGP-AIML` with categories `["ELIGIBILITY", "FEES", "SCHOLARSHIPS"]`.
   - Retrieves two verified chunks (`verification_status = "VERIFIED"`, `expires_at = "2027-03-31"`):
     - **Chunk `PK-AIML-ELIG-01`:** *"Graduates from any quantitative discipline (B.Tech, B.Sc, B.Com, BCA, Economics) with >= 55% marks are eligible. Non-CS candidates complete a mandatory 3-week Python Foundations Bridge at zero extra cost."*
     - **Chunk `PK-AIML-FEE-02`:** *"Total tuition fee is INR 1,85,000 (inclusive of taxes). 12-month no-cost EMI starts at INR 15,417/month via partnered NBFCs. Merit scholarships up to 25% available for candidates scoring >= 80% on the admissions aptitude test."*
6. **Next-Best-Action Decision (`Next Best Action Engine`):**
   - Agent calls `recommend_next_action` → selects primary action `SEND_WHATSAPP_FOLLOWUP` (Confidence: `0.94`, Auto-dispatch allowed) AND secondary action `ESCALATE_COUNSELLOR_CALL` (Priority: `HIGH`, SLA: `30 minutes`) to walk Aarav through the Python Bridge and EMI sanction process.
7. **Grounded Multilingual Drafting (`Multilingual Engagement Studio`):**
   - Agent calls `draft_multilingual_followup` (`language: "hinglish"`, `channel: "WHATSAPP"`):
     - Drafts a warm, zero-hallucination Hinglish reply citing exact figures (`INR 1,85,000`, `INR 15,417/month 12-month no-cost EMI`, and the `3-week Python Foundations Bridge` for B.Com graduates) with an English back-translation stored for counsellor visibility.
8. **Task & Escalation Creation (`Human Counsellor Command Centre`):**
   - Agent calls `create_followup_task` and `escalate_to_counsellor`, assigning Senior Advisor Priya Sharma with a pre-built **Counsellor Call Brief**.

---

## Journey 2: Admissions Counsellor — High-Velocity Escalation Resolution & Conversion Logging

### Persona & Context
- **User:** Priya Sharma (Senior Admissions Advisor).
- **Screen:** `Counsellor Workspace` → `Prospect 360 Drawer`.

### Step-by-Step Workflow
1. **Priority Queue Inspection:**
   - Priya opens `Counsellor Workspace`. Leads are sorted by `Priority Score = Composite Score × SLA Urgency × Barrier Resolvability`. Aarav Mehta appears at the top with a pulsing `SLA: 24m remaining` badge and tags `HOT (84)` + `ELIGIBILITY_DOUBT` + `FEE_ANXIETY`.
2. **1-Second Context Absorption (`Prospect 360`):**
   - Instead of reading raw chat logs, Priya reads the **AI Escalation Brief**:
     - *Why Escalated:* High-intent B.Com + SQL analyst (84/100) wants confirmation on Python Bridge + 12-month no-cost EMI (`INR 15,417/mo`).
     - *Recommended Talking Points:* 1) Reassure that 34% of current PGP-AIML cohort comes from non-CS backgrounds via the 3-week Python Bridge; 2) Offer the scholarship aptitude test link (up to 25% fee waiver).
3. **Human-in-the-Loop Message Review / Call Execution:**
   - Priya reviews any pending custom scholarship message in the Engagement Studio tab, clicks **Approve & Dispatch**, logs her 8-minute phone call disposition (`CONNECTED_POSITIVE`), and clicks **Record Conversion Event → `APPLICATION_STARTED`**.
4. **Closed-Loop State Update:**
   - Recording `APPLICATION_STARTED` automatically marks the escalation task `COMPLETED`, updates Aarav's stage to `APPLICANT`, schedules an automated application-completion reminder task in 48 hours if the form is unfinished, and increments the conversion counter for `youtube_creator_collab` in Growth Intelligence.

---

## Journey 3: Knowledge Guardrail — Handling an Unverified / Out-of-Scope Prospect Question

### Scenario
- A prospect asks: *"Do you guarantee a minimum INR 25 LPA placement package in writing, and can I pay the tuition fee only after getting a job (Pay After Placement)?"*
- **System Execution:**
  1. `search_programme_facts` searches `PLACEMENTS` and `FEES`.
  2. Retrieved chunk `PK-AIML-PLAC-01` explicitly states: *"SIGNAL Institute provides dedicated career mentorship and verified placement assistance (average CTC INR 14.2 LPA across the 2025 cohort), but does NOT offer guaranteed job contracts or Pay-After-Placement (ISA) models."*
  3. If the prospect asks about a brand-new programme not yet in `programme_knowledge` (e.g., `M.Sc Quantum Computing`), `search_programme_facts` returns `max_similarity = 0.51` (`< 0.78` threshold).
  4. **Guardrail Trigger:** The Supervisor Agent refuses to guess fees or rules, logs `guardrail_triggered = "KNOWLEDGE_GAP_ESCALATION"`, sends a polite holding message acknowledging the specific question, and escalates to a human counsellor while flagging the missing topic in the **Knowledge Centre → Unanswered Questions Queue**.

---

## Journey 4: Head of Growth — Diagnosing Funnel Drop-Off & Launching an Intervention

### Persona & Context
- **User:** Vikram Nair (VP of Growth & Admissions).
- **Screen:** `Growth Intelligence Dashboard`.

### Step-by-Step Workflow
1. Vikram inspects the **Source-to-Enrollment Attribution Matrix** and notices that `meta_instagram_reels` generates 420 leads/week at low CPL, but converts to `APPLICATION_STARTED` at only 3.1% (vs. 18.4% for `google_search_brand`).
2. He checks the **Barrier Correlation Heatmap** on the same screen: 74% of `meta_instagram_reels` leads exhibit `FEE_ANXIETY` and drop off after seeing the full tuition figure.
3. He reviews the **AI Operational Insight Card**, which recommends automatically leading with the **Scholarship Aptitude Test + Monthly EMI Breakdown** before full lump-sum tuition for that segment.
4. He activates experiment `EXP-2026-EMI-FIRST` (`50/50 split`) and tracks real-time uplift in `APPLICATION_STARTED` conversion events over the next 7 days.
