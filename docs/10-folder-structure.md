# 10 — Production Repository & Folder Structure: SIGNAL

**Framework:** Next.js 15 App Router (TypeScript Strict Mode)  
**Architecture Style:** Modular Domain-Driven Directory Layout (`/src/app`, `/src/modules`, `/src/lib`, `/supabase`, `/docs`)

---

## 1. Complete Directory Tree

```text
signal-platform/
├── docs/                                           # Complete Architectural Blueprint (12 Core Docs)
│   ├── 01-product-requirements-document.md
│   ├── 02-technical-architecture.md
│   ├── 03-architecture-diagram.md
│   ├── 04-user-journeys.md
│   ├── 05-database-schema.md
│   ├── 06-api-specifications.md
│   ├── 07-agent-tool-contracts.md
│   ├── 08-automation-workflow-specifications.md
│   ├── 09-ux-ui-design-system.md
│   ├── 10-folder-structure.md
│   ├── 11-environment-variable-template.md
│   └── 12-implementation-checklist.md
├── supabase/
│   ├── config.toml                                 # Local Supabase CLI configuration
│   ├── migrations/
│   │   └── 20261118000001_signal_schema.sql        # Complete 13-table DDL, pgvector RPC & RLS policies
│   └── seed.sql                                    # Realistic Indian & global edtech demo dataset
├── n8n/
│   └── workflows/
│       ├── wf-01-inbound-router.json               # Exported n8n inbound webhook & opt-out router
│       ├── wf-02-nurture-cadence.json              # Scheduled barrier-specific follow-up engine
│       ├── wf-03-sla-guardian.json                 # Counsellor SLA breach monitor & auto-reassign
│       └── wf-04-knowledge-sync.json               # Firecrawl institutional URL scraper & checksum diff
├── src/
│   ├── app/                                        # Next.js App Router (UI Screens & Server API Routes)
│   │   ├── layout.tsx                              # Root layout (Geist/Inter fonts, Obsidian Navy shell)
│   │   ├── page.tsx                                # Screen 1: Command Centre (KPIs, Live Stream, WebGL Pulse)
│   │   ├── prospects/
│   │   │   ├── page.tsx                            # Screen 2: Prospect Explorer & Acquisition Studio
│   │   │   └── [id]/
│   │   │       └── page.tsx                        # Screen 3: Prospect 360 Intelligence View
│   │   ├── agent-control/
│   │   │   └── page.tsx                            # Screen 4: AI Agent Execution Control Room
│   │   ├── knowledge/
│   │   │   └── page.tsx                            # Screen 5: Programme Knowledge Centre & RAG Tester
│   │   ├── engagement/
│   │   │   └── page.tsx                            # Screen 6: Multilingual Engagement Studio
│   │   ├── counsellor/
│   │   │   └── page.tsx                            # Screen 7: Human Counsellor Command Centre
│   │   ├── growth/
│   │   │   └── page.tsx                            # Screen 8: Growth Intelligence & Experiment Feedback
│   │   └── api/
│   │       └── v1/
│   │           ├── prospects/
│   │           │   ├── route.ts                    # GET list / POST intake & auto-qualify
│   │           │   └── [id]/
│   │           │       └── route.ts                # GET Prospect 360 / PATCH profile & consent
│   │           ├── agent/
│   │           │   ├── execute/
│   │           │   │   └── route.ts                # POST trigger Supervisor Agent & 9 tools
│   │           │   └── runs/
│   │           │       └── route.ts                # GET agent run history & tool traces
│   │           ├── knowledge/
│   │           │   ├── search/
│   │           │   │   └── route.ts                # POST hybrid vector + FTS verified retrieval
│   │           │   └── ingest/
│   │           │       └── route.ts                # POST Firecrawl / markdown chunk ingestion
│   │           ├── communications/
│   │           │   └── send/
│   │           │       └── route.ts                # POST approve/dispatch WhatsApp or Resend email
│   │           ├── tasks/
│   │           │   └── route.ts                    # GET/POST/PATCH counsellor & automated tasks
│   │           ├── conversions/
│   │           │   └── route.ts                    # POST record conversion event & update attribution
│   │           ├── analytics/
│   │           │   └── growth/
│   │           │       └── route.ts                # GET funnel velocity, source ROI & barrier stats
│   │           └── webhooks/
│   │               ├── whatsapp/
│   │               │   └── route.ts                # POST Meta WhatsApp Cloud API webhook
│   │               ├── resend/
│   │               │   └── route.ts                # POST Resend email delivery/open webhook
│   │               └── n8n/
│   │                   └── route.ts                # POST signed n8n automation callback
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppSidebar.tsx                      # Enterprise navigation rail with live SLA counters
│   │   │   ├── TopCommandBar.tsx                   # Global search (Cmd+K), live status & quick simulator
│   │   │   └── SignalTopologyCanvas.tsx            # Three.js / Canvas interactive signal pulse header
│   │   ├── prospects/
│   │   │   ├── AcquisitionStudioModal.tsx          # Interactive lead capture & persona simulator
│   │   │   ├── ScoreBreakdownCard.tsx              # 4-axis explainable score bars + factor deltas
│   │   │   └── BarrierBadges.tsx                   # Severity-coded conversion friction pills
│   │   ├── agent/
│   │   │   ├── ExecutionTraceTimeline.tsx          # Live DAG/step inspector for the 9 agent tools
│   │   │   └── GuardrailStatusBanner.tsx           # Grounding, consent & confidence threshold display
│   │   ├── engagement/
│   │   │   └── MultilingualComposer.tsx            # Dual-pane localized draft + English back-translation
│   │   └── ui/                                     # shadcn/ui primitives (Button, Badge, Dialog, Drawer...)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                           # Browser Supabase client (Realtime + Auth)
│   │   │   └── server.ts                           # Server-side Supabase client & fallback store
│   │   ├── agent/
│   │   │   ├── supervisor.ts                       # OpenAI Agents SDK Supervisor loop orchestrator
│   │   │   ├── tools.ts                            # 9 strongly-typed specialist tool definitions & Zod schemas
│   │   │   ├── guardrails.ts                       # Zero-hallucination numeric & citation verifier
│   │   │   └── fallback-engine.ts                  # Deterministic qualification & NBA engine when offline
│   │   ├── integrations/
│   │   │   ├── whatsapp.ts                         # WhatsApp Cloud API sender & HMAC verifier
│   │   │   ├── resend.ts                           # Resend transactional email dispatcher
│   │   │   └── firecrawl.ts                        # Firecrawl markdown scraper & chunker
│   │   ├── store/
│   │   │   └── useSignalStore.ts                   # Zustand store for reactive UI & live trace state
│   │   └── mock-db/
│   │       └── seed-data.ts                        # Rich in-memory + persistent seed state for instant P0 demo
│   └── types/
│       └── signal.ts                               # Canonical TypeScript interfaces mirroring SQL schema
├── .env.example                                    # Documented environment variable template
├── next.config.mjs                                 # Next.js configuration
├── tailwind.config.ts                              # Obsidian Navy, Violet & Teal design tokens
├── tsconfig.json                                   # Strict TypeScript configuration
└── package.json                                    # Dependencies & scripts
```
