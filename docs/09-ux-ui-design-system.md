# 09 — Enterprise UX/UI Design System & Screen Architecture: SIGNAL

**Design Philosophy:** High-density, zero-clutter operational precision inspired by **Linear, Attio, Stripe Dashboard, and Vercel Observability**.  
**Visual Theme:** Deep Obsidian Navy dark-first surface hierarchy with restrained Electric Violet (AI intelligence/agent layer) and Cyan-Teal (verified grounding & conversion signal) accents.

---

## 1. Visual Design Tokens (Tailwind CSS & CSS Variables)

### 1.1 Color Palette (WCAG AAA / AA Compliant Contrast)

| Semantic Token | Hex / RGBA | Usage |
| :--- | :--- | :--- |
| `--bg-canvas` | `#070B14` | Primary application background (Deep Obsidian Navy) |
| `--bg-surface-1` | `#0D1322` | Cards, primary panels, table containers, sidebar |
| `--bg-surface-2` | `#131C31` | Hover states, active row highlight, secondary drawers, code/JSON inspector blocks |
| `--bg-glass` | `rgba(13, 19, 34, 0.78)` | Sticky top navigation header & modal overlays (`backdrop-blur-md`) |
| `--border-subtle` | `rgba(148, 163, 184, 0.12)` | Hairline `1px` structural dividers, table cell borders, card outlines |
| `--border-active` | `rgba(139, 92, 246, 0.45)` | Active focus ring, selected prospect card, running agent node border |
| `--text-primary` | `#F8FAFC` | Primary headings, prospect names, key metrics (`15.8:1` contrast on canvas) |
| `--text-secondary` | `#94A3B8` | Table labels, descriptions, secondary metadata (`7.2:1` contrast) |
| `--text-muted` | `#64748B` | Timestamps, UUIDs, keyboard shortcut hints |
| `--accent-violet` | `#8B5CF6` | AI Supervisor Agent actions, NBA recommendations, reasoning traces |
| `--accent-teal` | `#14B8A6` | Verified RAG knowledge citations, conversion events, high-fit scores |
| `--status-hot` | `#F43F5E` | `HOT` lead tier badge, critical SLA breach countdown |
| `--status-warm` | `#F59E0B` | `WARM` lead tier, pending human approval warning, friction barrier pill |
| `--status-emerald` | `#10B981` | `ENROLLED` stage, guardrail passed, WhatsApp delivered receipt |

### 1.2 Typography & Spacing Density
- **Sans Font (`--font-sans`):** `Inter` / `Geist Sans` — tight tracking (`-0.015em` on headings), crisp legibility at `12px–14px` operational table density.
- **Monospace Font (`--font-mono`):** `Geist Mono` / `JetBrains Mono` — used for all numeric scores (`tabular-nums`), SLA timers, tool call JSON payloads, latencies (`2,840ms`), and chunk IDs.
- **Spacing & Radii:**
  - Card padding: `16px` (`p-4`) or `20px` (`p-5`).
  - Grid gap: `12px` (`gap-3`) or `16px` (`gap-4`).
  - Border radius: `8px` (`rounded-lg`) for cards, `6px` (`rounded-md`) for buttons/inputs, `4px` (`rounded`) for status pills.

---

## 2. Detailed Specification of the 8 Required Screens

### Screen 1: Command Centre (`/`)
- **Purpose:** Real-time operational cockpit for founders, admissions leads, and AI operators.
- **Layout:**
  - **Top Hero Strip (Interactive Signal Pulse Bar):** Features a lightweight, GPU-accelerated Three.js / Canvas particle-node network representing live signal flow (`Acquisition → Qualification → RAG → NBA → Conversion`) alongside a 1-click **"Simulate Live Prospect Inquiry & Run Agent"** button.
  - **4-Column KPI Bento Row:**
    1. *Active Pipeline & Hot Prospects* (`84.2` avg score on hot cohort, `+18.4%` WoW).
    2. *Autonomous Resolution vs. Escalation Rate* (`76%` auto-handled, `< 3.1s` median latency).
    3. *Knowledge Grounding Compliance* (`100.0%` verified citation coverage, `0` hallucinations).
    4. *Attributed Pipeline Revenue* (`INR 42.8L` active qualified pipeline).
  - **Main Split View (8 Cols / 4 Cols):**
    - *Left (8 Cols):* **Live Autonomous Activity Stream** showing recent prospect inquiries, their 4-axis score bars, detected barriers, and instant button to open `Prospect 360` or `Agent Trace`.
    - *Right (4 Cols):* **Urgent Counsellor Escalations & AI Operational Insights** (e.g., top barrier trends and expiring knowledge alerts).

### Screen 2: Prospect Explorer (`/prospects`)
- **Purpose:** High-density Attio/Linear-style filterable data grid + Acquisition Studio drawer for capturing new prospects.
- **Components & Interactions:**
  - **Multi-Facet Filter Bar:** Instant filter pills by `Tier (HOT/WARM/NURTURE)`, `Programme (PGP-AIML / BTECH-AIDS / EMBA-DT)`, `Friction Barrier (FEE_ANXIETY, ELIGIBILITY_DOUBT...)`, `Language`, and `UTM Source`.
  - **High-Density Table:** Columns for Prospect Name & Location, Target Programme, 4-Axis Score Mini-Sparkbar (`Fit / Intent / Readiness / Friction`), Active Barriers, Recommended Next Action, Preferred Language, and Last Activity.
  - **Prospect Acquisition Studio Modal/Drawer (`+ New Prospect Inquiry`):** Allows testing any custom student persona, language, UTM source, and raw question, immediately running the full Supervisor Agent pipeline.

### Screen 3: Prospect 360 (`/prospects/[id]` & Slide-Over Inspector)
- **Purpose:** Complete single-pane-of-glass intelligence profile for a single student.
- **Layout (3-Zone Enterprise Workspace):**
  - **Left Column (Profile & Attribution):** Academic background, work experience, budget bracket, UTM source/campaign, explicit consent switches (`WhatsApp`, `Email`, `Call`), and lifecycle stage stepper.
  - **Center Column (Explainable AI Qualification & NBA Card + Omnichannel Timeline):**
    - **4-Axis Explainable Score Radar/Bars:** Shows exact point contributions (`+35: 1.5 yrs SQL experience`, `-12: B.Com non-CS math anxiety`) and detected barrier severity badges.
    - **Next-Best-Action Card:** Displays the agent's recommended action, confidence (`94%`), rationale, and 1-click **"Execute / Re-Run Supervisor Agent"** control.
    - **Unified Conversation & Citation Timeline:** Shows inbound inquiries and outbound AI drafts with toggleable **English Back-Translation** and clickable **Verified Knowledge Citations** (`[PK-AIML-FEE-02]`).
  - **Right Column (Counsellor Brief, Tasks & Conversion Recorder):** AI-generated call talking points, SLA countdown, and 1-click **Record Conversion Event** buttons (`COUNSELLOR_CALL_COMPLETED`, `APPLICATION_STARTED`, `OFFER_ISSUED`, `ENROLLED`).

### Screen 4: Agent Control Room (`/agent-control`)
- **Purpose:** Deep observability into the OpenAI Supervisor Agent, tool execution DAG, guardrails, and prompt/schema contracts.
- **Components:**
  - **Run Selector Sidebar:** Filterable list of `agent_runs` with status badge (`COMPLETED`, `AWAITING_HUMAN_APPROVAL`, `KNOWLEDGE_GAP_ESCALATED`), duration (`ms`), token count, and confidence score.
  - **Interactive Step-by-Step Tool Trace Inspector:**
    - Visualizes the exact ordered chain (`classify_intent` → `detect_conversion_barriers` → `score_prospect` → `search_programme_facts` → `recommend_next_action` → `draft_multilingual_followup` → `create_followup_task` / `escalate_to_counsellor`).
    - Clicking any step expands its formatted JSON `tool_input`, `tool_output`, latency bar, and linked `programme_knowledge` chunks.
  - **Guardrail Policy Monitor:** Displays active thresholds (`Min RAG Similarity: 0.78`, `Auto-Send Confidence: 0.82`, `Anti-Spam Cooldown: 18h`).

### Screen 5: Knowledge Centre (`/knowledge`)
- **Purpose:** Manages verified institutional knowledge, RAG retrieval testing, source freshness TTLs, and unanswered question gaps.
- **Components:**
  - **Live RAG Playground Bar:** Type any student question (e.g., *"Can a B.Com student join PGP AI & ML and what is the 12-month EMI?"*), filter by programme, and inspect real-time similarity scores and structured facts returned by the database.
  - **Verified Knowledge Chunks Grid:** Filterable by `PGP-AIML`, `BTECH-AIDS`, `EMBA-DT` and category (`FEES`, `ELIGIBILITY`, `SCHOLARSHIPS`, `PLACEMENTS`, `CURRICULUM`, `DEADLINES`), displaying `VERIFIED` badge, `expires_at` countdown, and `source_url`.
  - **Firecrawl URL Ingest & Freshness Panel:** Allows adding/refreshing official programme URLs with SHA-256 checksum tracking.

### Screen 6: Engagement Studio (`/engagement`)
- **Purpose:** Multilingual drafting, side-by-side translation audit, citation verification, and omnichannel dispatch queue.
- **Components:**
  - **Draft & Approval Queue:** Lists all `communications` (`PENDING_APPROVAL`, `SENT`, `DELIVERED`, `READ`).
  - **Dual-Pane Multilingual Composer:**
    - *Left Pane:* Localized message (`Hinglish`, `Hindi`, `Tamil`, `Telugu`, `Spanish`, `English`) formatted for WhatsApp or Email.
    - *Right Pane:* English audit translation + **Fact Grounding Checklist** highlighting every numeric figure (`INR 1,85,000`, `INR 15,417/mo`, `55% aggregate`) and the exact verified chunk backing it.
  - **Interactive Language & Tone Switcher:** Re-generates drafts on the fly across languages while locking factual figures to verified chunks.

### Screen 7: Counsellor Workspace (`/counsellor`)
- **Purpose:** Dedicated high-velocity execution queue for human admissions advisors.
- **Components:**
  - **Prioritized Escalation Queue:** Ranked by `Priority × Composite Score × SLA Urgency`.
  - **Active Call Prep & Disposition Panel:** Displays the student's core barriers, AI-prepared rebuttal scripts grounded in programme facts, 1-click **"Approve Pending AI Message"**, call outcome logger, and instant stage progression trigger.
  - **Counsellor Load & Capacity Bar:** Shows online advisors (`Priya Sharma`, `Rohan Deshmukh`, `Ananya Iyer`), spoken languages, and active SLA compliance.

### Screen 8: Growth Intelligence (`/growth`)
- **Purpose:** Full-funnel conversion analytics, source ROI attribution, barrier heatmaps, and A/B experiment feedback loops.
- **Components:**
  - **End-to-End Funnel Velocity Chart (Recharts):** `Lead Captured → Qualified Hot → Counsellor Call → Application Started → Offer Issued → Enrolled`.
  - **UTM Source & Campaign Attribution Table:** Compares lead volume, average AI Fit/Intent score, top friction barrier, application rate, and attributed tuition revenue across `youtube_creator_collab`, `google_search_brand`, `meta_instagram_reels`, `linkedin_sponsored`, and `alumni_referral`.
  - **Conversion Barrier Frequency vs. Resolution Chart:** Shows which barriers (`FEE_ANXIETY`, `ELIGIBILITY_DOUBT`, `TIME_COMMITMENT_CONFLICT`) cause the most drop-offs and how effectively AI + Counsellor interventions resolve them.
  - **Active Experiments & Conversion Feedback Loop Panel:** Tracks live A/B experiments (`EXP-2026-EMI-FIRST`, `EXP-2026-HINGLISH-VOICE-NOTE`) with conversion uplift metrics.

---

## 3. Responsive & Interactive States

- **Desktop (`>= 1280px`):** Fixed `240px` collapsible left navigation rail + `1fr` workspace canvas + slide-over `520px` Prospect 360 / Trace inspector drawer.
- **Tablet (`768px–1279px`):** Icon-only `64px` navigation rail + responsive 2-column bento grids + horizontal scroll data tables with sticky first column.
- **Mobile (`< 768px`):** Bottom action bar + stacked cards for Counsellor on-the-go SLA triage.
- **Loading, Empty & Error States:** Skeleton shimmer rows matching exact table heights; explicit guardrail banners when an AI action is blocked due to missing consent or unverified knowledge.
