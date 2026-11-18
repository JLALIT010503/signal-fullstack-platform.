'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { SignalDatabaseState } from '@/lib/db/repository';
import type { IntegrationStatusReport } from '@/lib/integrations/adapters';
import type { ProspectRecord, SupportedLanguage } from '@/types/signal';

const SignalTopologyCanvas = dynamic(
  () => import('./layout/SignalTopologyCanvas').then((m) => m.SignalTopologyCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="h-[310px] rounded-lg bg-[#0D1322] border border-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400">
        Loading 3D Education Growth Funnel...
      </div>
    ),
  }
);

export type ScreenId =
  | 'command'
  | 'explorer'
  | 'prospect360'
  | 'agent'
  | 'knowledge'
  | 'engagement'
  | 'counsellor'
  | 'growth';

const NAV_ITEMS: Array<{ id: ScreenId; label: string; badge: string }> = [
  { id: 'command', label: '1. Command Centre', badge: '3D LIVE' },
  { id: 'explorer', label: '2. Prospect Explorer', badge: 'Intake' },
  { id: 'prospect360', label: '3. Prospect 360', badge: '360°' },
  { id: 'agent', label: '4. Agent Control Room', badge: '9 Tools' },
  { id: 'knowledge', label: '5. Knowledge Centre', badge: 'RAG' },
  { id: 'engagement', label: '6. Engagement Studio', badge: '6 Langs' },
  { id: 'counsellor', label: '7. Counsellor Workspace', badge: 'SLA' },
  { id: 'growth', label: '8. Growth Intelligence', badge: 'ROI' },
];

const QA_SCENARIOS = [
  {
    code: 'S1_HIGH_INTENT_TA',
    label: '1. High-Intent Multilingual (Tamil)',
    first_name: 'Lakshmi',
    last_name: 'Narayanan',
    city: 'Coimbatore',
    preferred_language: 'ta' as SupportedLanguage,
    target_programme_code: 'PGP-AIML' as const,
    undergrad_discipline: 'B.Sc Mathematics',
    cgpa_or_percentage: 81,
    work_experience_months: 16,
    utm_source: 'google_search_brand',
    raw_initial_inquiry:
      'I have B.Sc Mathematics (81%) and 16m BI experience. Am I eligible for PGP-AIML and what is the 12-month no-cost EMI & merit scholarship?',
  },
  {
    code: 'S2_LOW_INTENT_EN',
    label: '2. Low-Intent Exploratory (English)',
    first_name: 'Kabir',
    last_name: 'Verma',
    city: 'Pune',
    preferred_language: 'en' as SupportedLanguage,
    target_programme_code: 'PGP-AIML' as const,
    undergrad_discipline: 'B.A. History',
    cgpa_or_percentage: 56,
    work_experience_months: 0,
    utm_source: 'meta_instagram_reels',
    raw_initial_inquiry: 'Just casually browsing brochures for 2028, not planning to apply this year.',
  },
  {
    code: 'S3_INCOMPLETE_HI',
    label: '3. Incomplete-Info Prospect (Hindi)',
    first_name: 'Neha',
    last_name: 'Gupta',
    city: 'Lucknow',
    preferred_language: 'hi' as SupportedLanguage,
    target_programme_code: 'BTECH-AIDS' as const,
    undergrad_discipline: 'Unspecified Stream',
    cgpa_or_percentage: 58,
    work_experience_months: 0,
    utm_source: 'youtube_creator_collab',
    raw_initial_inquiry: 'Mujhe AI course karna hai, kya admission process aur fee hai?',
  },
  {
    code: 'S4_UNVERIFIED_ML',
    label: '4. Unverified-Fact Guardrail (Malayalam)',
    first_name: 'Arjun',
    last_name: 'Menon',
    city: 'Kochi',
    preferred_language: 'ml' as SupportedLanguage,
    target_programme_code: 'PGP-AIML' as const,
    undergrad_discipline: 'B.Tech',
    cgpa_or_percentage: 78,
    work_experience_months: 24,
    utm_source: 'linkedin_sponsored',
    raw_initial_inquiry:
      'Do you give a written 100% placement guarantee of 30 LPA and Pay-After-Placement for M.Sc Quantum Robotics?',
  },
  {
    code: 'S5_KANNADA_EMI',
    label: '5. Multilingual Kannada + EMI',
    first_name: 'Nikhil',
    last_name: 'Gowda',
    city: 'Mysuru',
    preferred_language: 'kn' as SupportedLanguage,
    target_programme_code: 'EMBA-DT' as const,
    undergrad_discipline: 'B.E. CS',
    cgpa_or_percentage: 79.4,
    work_experience_months: 36,
    utm_source: 'google_search_brand',
    raw_initial_inquiry: 'What is the Executive MBA weekend live schedule and 12-month no-cost EMI in Kannada?',
  },
];

export function SignalWorkspace({
  initialState,
  integrations,
  initialScreen = 'command',
  initialProspectId,
}: {
  initialState: SignalDatabaseState;
  integrations: IntegrationStatusReport[];
  initialScreen?: ScreenId;
  initialProspectId?: string;
}) {
  const [dbState, setDbState] = useState<SignalDatabaseState>(initialState);
  const [activeScreen, setActiveScreen] = useState<ScreenId>(initialScreen);
  const [originFilter, setOriginFilter] = useState<'ALL' | 'LIVE' | 'SYNTHETIC'>('ALL');
  const [selectedProspectId, setSelectedProspectId] = useState<string>(
    initialProspectId || initialState.prospects[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [qaTab, setQaTab] = useState<'SCENARIOS' | 'LOOM'>('SCENARIOS');
  const [toast, setToast] = useState<{ title: string; detail: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Intake form state
  const [formFirstName, setFormFirstName] = useState('Siddharth');
  const [formLastName, setFormLastName] = useState('Menon');
  const [formEmail, setFormEmail] = useState('siddharth.menon@student.org');
  const [formPhone, setFormPhone] = useState('+919847055667');
  const [formProg, setFormProg] = useState<'PGP-AIML' | 'BTECH-AIDS' | 'EMBA-DT'>('PGP-AIML');
  const [formLang, setFormLang] = useState<SupportedLanguage>('ml');
  const [formDiscipline, setFormDiscipline] = useState('B.Com Finance');
  const [formCgpa, setFormCgpa] = useState('76.5');
  const [formWorkExp, setFormWorkExp] = useState('18');
  const [formUtm, setFormUtm] = useState('youtube_creator_collab');
  const [formInquiry, setFormInquiry] = useState(
    'I completed B.Com with 76.5% and have 18 months analytics experience. Am I eligible for PGP-AIML without a CS degree? Also share 12-month no-cost EMI and scholarship details.'
  );

  // Knowledge RAG Tester state
  const [ragQuery, setRagQuery] = useState('B.Com eligibility Python bridge 12-month no-cost EMI scholarship');
  const [ragProg, setRagProg] = useState<'PGP-AIML' | 'BTECH-AIDS' | 'EMBA-DT'>('PGP-AIML');

  const notify = (title: string, detail: string) => {
    setToast({ title, detail });
    setTimeout(() => setToast(null), 4500);
  };

  const filteredProspects = useMemo(() => {
    return dbState.prospects.filter((p) => {
      if (originFilter === 'LIVE' && p.is_synthetic) return false;
      if (originFilter === 'SYNTHETIC' && !p.is_synthetic) return false;
      if (tierFilter !== 'ALL' && p.current_tier !== tierFilter) return false;
      if (
        searchQuery &&
        !`${p.first_name} ${p.last_name} ${p.city} ${p.raw_initial_inquiry}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [dbState.prospects, originFilter, tierFilter, searchQuery]);

  const activeProspect: ProspectRecord | undefined = useMemo(() => {
    return dbState.prospects.find((p) => p.id === selectedProspectId) || dbState.prospects[0];
  }, [dbState.prospects, selectedProspectId]);

  const syntheticCount = dbState.prospects.filter((p) => p.is_synthetic).length;
  const liveCount = dbState.prospects.filter((p) => !p.is_synthetic).length;
  const pendingDrafts = dbState.communications.filter((c) => c.status === 'PENDING_APPROVAL').length;
  const pendingTasks = dbState.followup_tasks.filter((t) => t.status === 'PENDING').length;

  const funnelChartData = useMemo(() => {
    const total = filteredProspects.length;
    const qualified = filteredProspects.filter((p) => p.current_composite_score >= 58).length;
    const hot = filteredProspects.filter((p) => p.current_tier === 'HOT').length;
    const appStarted = filteredProspects.filter(
      (p) => p.lifecycle_stage === 'APPLICATION_STARTED' || p.lifecycle_stage === 'ENROLLED'
    ).length;
    return [
      { stage: 'Captured', count: total },
      { stage: 'Qualified', count: qualified },
      { stage: 'HOT Leads', count: hot },
      { stage: 'App Started', count: appStarted },
    ];
  }, [filteredProspects]);

  const languageChartData = useMemo(() => {
    const langs: Array<{ code: SupportedLanguage; label: string }> = [
      { code: 'en', label: 'EN' },
      { code: 'hi', label: 'HI' },
      { code: 'te', label: 'TE' },
      { code: 'ta', label: 'TA' },
      { code: 'kn', label: 'KN' },
      { code: 'ml', label: 'ML' },
    ];
    return langs.map((l) => ({
      language: l.label,
      count: filteredProspects.filter((p) => p.preferred_language === l.code).length,
    }));
  }, [filteredProspects]);

  async function submitProspectToApi(payload: {
    first_name: string;
    last_name: string;
    email: string;
    phone_e164: string;
    preferred_language: SupportedLanguage;
    target_programme_code: 'PGP-AIML' | 'BTECH-AIDS' | 'EMBA-DT';
    undergrad_discipline: string;
    cgpa_or_percentage: number;
    work_experience_months: number;
    utm_source: string;
    raw_initial_inquiry: string;
    city?: string;
  }) {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, preferred_channel: 'WHATSAPP' }),
      });
      const json = await res.json();
      if (json.success && json.data?.prospect) {
        const newProspect = json.data.prospect as ProspectRecord;
        const exec = json.data.agent_execution;
        setDbState((prev) => ({
          ...prev,
          prospects: [newProspect, ...prev.prospects],
          agent_runs: [
            {
              id: json.data.agent_run_id,
              prospect_id: newProspect.id,
              prospect_name: `${newProspect.first_name} ${newProspect.last_name}`.trim(),
              is_synthetic: false,
              status: exec.status,
              guardrail_status: exec.guardrail_status,
              confidence_score: exec.confidence_score,
              duration_ms: exec.duration_ms,
              tool_calls: exec.tool_calls,
            },
            ...prev.agent_runs,
          ],
          communications: [
            {
              id: json.data.communication_id,
              prospect_id: newProspect.id,
              agent_run_id: json.data.agent_run_id,
              is_synthetic: false,
              channel: exec.draft.channel,
              language_code: exec.draft.language_code,
              subject: exec.draft.subject,
              body_localized: exec.draft.body_localized,
              body_english_translation: exec.draft.body_english_translation,
              cited_chunk_ids: exec.draft.cited_chunk_ids,
              citation_metadata: exec.draft.citation_metadata,
              status: 'PENDING_APPROVAL',
              requires_human_approval: true,
              approved_by: null,
              external_provider_id: null,
              diagnostic_note: 'Draft created by 9-Tool Supervisor Agent; awaiting human approval.',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...prev.communications,
          ],
          followup_tasks: [
            {
              id: json.data.followup_task_id,
              prospect_id: newProspect.id,
              prospect_name: `${newProspect.first_name} ${newProspect.last_name}`.trim(),
              is_synthetic: false,
              ...exec.task,
            },
            ...prev.followup_tasks,
          ],
        }));
        setSelectedProspectId(newProspect.id);
        notify(
          '9-Tool Supervisor Agent Executed',
          `${newProspect.first_name} scored ${newProspect.current_composite_score}/100 (${newProspect.current_tier}) with grounded ${newProspect.preferred_language.toUpperCase()} draft.`
        );
      } else {
        notify('API Error', json.error?.message || 'Failed to run agent.');
      }
    } catch (err) {
      notify('Network Error', err instanceof Error ? err.message : 'Unable to reach /api/v1/prospects');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleApproveCommunication(commId: string) {
    try {
      const res = await fetch('/api/v1/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communication_id: commId }),
      });
      const json = await res.json();
      setDbState((prev) => ({
        ...prev,
        communications: prev.communications.map((c) =>
          c.id === commId
            ? {
                ...c,
                status: json.data?.communication?.status || 'MESSAGE_APPROVED',
                diagnostic_note:
                  json.data?.dispatch?.diagnostic_note ||
                  'Human approval recorded (Safe Test Mode).',
              }
            : c
        ),
      }));
      notify('Message Approved', 'Transitioned PENDING_APPROVAL → MESSAGE_APPROVED.');
    } catch {
      notify('Approval Recorded Locally', 'Updated communication status to MESSAGE_APPROVED.');
    }
  }

  async function handleRecordConversion(prospectId: string) {
    setDbState((prev) => ({
      ...prev,
      prospects: prev.prospects.map((p) =>
        p.id === prospectId ? { ...p, lifecycle_stage: 'APPLICATION_STARTED' } : p
      ),
    }));
    try {
      await fetch('/api/v1/conversions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect_id: prospectId, event_type: 'APPLICATION_STARTED' }),
      });
    } catch {
      // Local state already updated
    }
    notify('Conversion Milestone Recorded', 'Prospect advanced to APPLICATION_STARTED.');
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#070B14] text-slate-100">
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm p-3 rounded-lg bg-[#0D1322] border border-teal-500/60 shadow-2xl text-xs">
          <div className="font-semibold text-white">{toast.title}</div>
          <div className="text-slate-300 mt-0.5">{toast.detail}</div>
        </div>
      )}

      {/* Left Navigation Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 bg-[#0D1322] border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between">
        <div>
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-teal-400 flex items-center justify-center font-bold text-xs text-slate-950">
                SG
              </div>
              <div>
                <div className="font-bold tracking-tight text-sm text-white">SIGNAL</div>
                <img src="/signal-logo.jpg" alt="SIGNAL" className="h-9 w-9 rounded-lg object-cover border border-violet-500/40 shrink-0" />
              </div>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              LIVE
            </span>
          </div>

          <nav className="p-2 flex lg:flex-col gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = activeScreen === item.id;
              const dynamicBadge =
                item.id === 'engagement'
                  ? String(pendingDrafts)
                  : item.id === 'counsellor'
                  ? String(pendingTasks)
                  : item.badge;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveScreen(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between whitespace-nowrap transition ${
                    isActive
                      ? 'bg-[#131C31] text-white border border-violet-500/40'
                      : 'text-slate-300 hover:bg-[#131C31]'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-violet-500/20 text-violet-300">
                    {dynamicBadge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-3 m-3 rounded-lg bg-[#131C31] border border-slate-800 text-[11px] space-y-1">
          <div className="font-semibold text-slate-200">Guardrails & Compliance</div>
          <div className="text-slate-400">Min RAG Similarity: 0.78</div>
          <div className="text-slate-400">Outbound Gate: Human Approval</div>
          <div className="text-slate-400">Languages: EN · HI · TE · TA · KN · ML</div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Command Header */}
        <header className="bg-[#0D1322]/90 backdrop-blur border-b border-slate-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
              {NAV_ITEMS.find((n) => n.id === activeScreen)?.label}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Synthetic Demo: {syntheticCount}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Live Execution: {liveCount}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value as 'ALL' | 'LIVE' | 'SYNTHETIC')}
              className="bg-[#131C31] border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">All Data (Synthetic + Live)</option>
              <option value="LIVE">Live Execution Only</option>
              <option value="SYNTHETIC">Synthetic Demo Only</option>
            </select>
            <button
              type="button"
              onClick={() => setShowIntakeModal(true)}
              className="px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition"
            >
              + Submit Student Prospect (Run 9-Tool Agent)
            </button>
          </div>
        </header>

        {/* Live Scrolling Activity Ticker */}
        <div className="bg-[#0B101D] border-b border-slate-800/80 py-1.5 overflow-hidden">
          <div className="animate-live-ticker flex items-center gap-8 text-[11px] font-mono text-slate-300 px-4">
            {[...dbState.prospects, ...dbState.prospects].map((p, i) => (
              <span key={`${p.id}-${i}`} className="flex items-center gap-2 whitespace-nowrap">
                <span className={p.is_synthetic ? 'text-amber-400' : 'text-emerald-400'}>●</span>
                <span className="text-white font-semibold">
                  {p.first_name} {p.last_name}
                </span>
                <span className="text-violet-300">[{p.target_programme_code}]</span>
                <span className="text-teal-300">
                  {p.current_composite_score}/100 ({p.current_tier})
                </span>
                <span className="text-slate-400">· {p.lifecycle_stage}</span>
              </span>
            ))}
          </div>
        </div>

        <main className="p-4 md:p-6 space-y-6 flex-1 overflow-y-auto">
          {/* SCREEN 1: COMMAND CENTRE */}
          {activeScreen === 'command' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <SignalTopologyCanvas
                    scores={{
                      fit: activeProspect?.fit_score || 84,
                      intent: activeProspect?.intent_score || 92,
                      readiness: activeProspect?.readiness_score || 80,
                      friction: activeProspect?.friction_score || 64,
                      prospectName: activeProspect
                        ? `${activeProspect.first_name} ${activeProspect.last_name}`
                        : 'Lakshmi Narayanan',
                      tier: activeProspect?.current_tier || 'HOT',
                    }}
                    onNavigateScreen={(scr) => setActiveScreen(scr as ScreenId)}
                  />
                </div>

                {/* 5-Scenario QA & 3-Min Loom Controller */}
                <div className="p-4 rounded-lg bg-[#0D1322] border border-teal-500/30 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-semibold text-teal-300">5-Scenario QA & Loom Suite</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setQaTab('SCENARIOS')}
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          qaTab === 'SCENARIOS'
                            ? 'bg-teal-500/20 text-teal-200 border border-teal-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        5 Scenarios
                      </button>
                      <button
                        type="button"
                        onClick={() => setQaTab('LOOM')}
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          qaTab === 'LOOM'
                            ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Loom Script
                      </button>
                    </div>
                  </div>
                  {qaTab === 'SCENARIOS' ? (
                    <div className="space-y-1.5">
                      {QA_SCENARIOS.map((sc) => (
                        <button
                          key={sc.code}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() =>
                            submitProspectToApi({
                              ...sc,
                              email: `${sc.first_name.toLowerCase()}@qa-audit.org`,
                              phone_e164: '+919840011223',
                            })
                          }
                          className="w-full text-left px-2.5 py-1.5 rounded bg-[#131C31] hover:bg-violet-600/25 border border-slate-800 text-slate-200 flex items-center justify-between text-[11px] transition"
                        >
                          <span>{sc.label}</span>
                          <span className="font-mono text-[10px] text-teal-300 uppercase">
                            {sc.preferred_language}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-[11px] text-slate-300 max-h-48 overflow-y-auto pr-1">
                      <div><strong className="text-violet-300">0:00–0:20:</strong> Problem & 3D Education Growth Funnel</div>
                      <div><strong className="text-violet-300">0:20–0:45:</strong> Submit Student Form (Run 9-Tool Agent)</div>
                      <div><strong className="text-violet-300">0:45–1:20:</strong> Prospect 360 Score & Agent Control Trace</div>
                      <div><strong className="text-violet-300">1:20–1:50:</strong> Verified RAG Facts & 6-Language Draft</div>
                      <div><strong className="text-violet-300">1:50–2:20:</strong> Human Approval Gate & Counsellor SLA</div>
                      <div><strong className="text-violet-300">2:20–3:00:</strong> Live Funnel Update & Closing</div>
                    </div>
                  )}
                </div>
              </div>

              {/* KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800">
                  <div className="text-[11px] text-slate-400">Total Prospects</div>
                  <div className="text-2xl font-bold text-white mt-1 font-mono">{filteredProspects.length}</div>
                </div>
                <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800">
                  <div className="text-[11px] text-slate-400">Qualified (&gt;=58)</div>
                  <div className="text-2xl font-bold text-teal-400 mt-1 font-mono">
                    {filteredProspects.filter((p) => p.current_composite_score >= 58).length}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800">
                  <div className="text-[11px] text-slate-400">High-Intent (HOT)</div>
                  <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">
                    {filteredProspects.filter((p) => p.current_tier === 'HOT').length}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800">
                  <div className="text-[11px] text-slate-400">Pending Follow-Ups</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">{pendingTasks}</div>
                </div>
                <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800 col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-slate-400">Verified Knowledge</div>
                  <div className="text-2xl font-bold text-violet-400 mt-1 font-mono">
                    {dbState.programme_knowledge.length}
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800">
                  <h3 className="text-xs font-semibold uppercase text-slate-300 mb-3">
                    Conversion Funnel Progression
                  </h3>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={funnelChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                        <XAxis dataKey="stage" stroke="#94A3B8" fontSize={11} />
                        <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0D1322', borderColor: '#334155', fontSize: 12 }} />
                        <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800">
                  <h3 className="text-xs font-semibold uppercase text-slate-300 mb-3">
                    Multilingual Distribution (EN · HI · TE · TA · KN · ML)
                  </h3>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={languageChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                        <XAxis dataKey="language" stroke="#94A3B8" fontSize={11} />
                        <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0D1322', borderColor: '#334155', fontSize: 12 }} />
                        <Bar dataKey="count" fill="#14B8A6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Activity Stream + Integrations */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 p-4 rounded-lg bg-[#0D1322] border border-slate-800 space-y-2.5 max-h-80 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-white">Live Prospect Activity Stream</h3>
                  {filteredProspects.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-lg bg-[#131C31] border border-slate-800 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                              p.is_synthetic
                                ? 'bg-amber-500/15 text-amber-300'
                                : 'bg-emerald-500/15 text-emerald-300'
                            }`}
                          >
                            {p.is_synthetic ? 'SYNTHETIC' : 'LIVE'}
                          </span>
                          <span className="font-semibold text-xs text-white">
                            {p.first_name} {p.last_name} ({p.city})
                          </span>
                          <span className="text-[11px] font-mono text-violet-300">{p.target_programme_code}</span>
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-teal-300">
                            {p.preferred_language}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">"{p.raw_initial_inquiry}"</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-300">
                          {p.current_composite_score}/100 ({p.current_tier})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProspectId(p.id);
                            setActiveScreen('prospect360');
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-violet-600 text-[11px] text-white"
                        >
                          Inspect 360°
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800 space-y-2 max-h-80 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-white">External Adapters ({integrations.length})</h3>
                  {integrations.map((intg) => (
                    <div key={intg.service} className="p-2.5 rounded bg-[#131C31] border border-slate-800 text-xs">
                      <div className="flex items-center justify-between font-semibold uppercase">
                        <span>{intg.service}</span>
                        <span className={intg.configured ? 'text-emerald-400' : 'text-amber-400'}>
                          {intg.configured ? 'LIVE' : 'SAFE TEST'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{intg.details}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 2: PROSPECT EXPLORER */}
          {activeScreen === 'explorer' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, city, inquiry..."
                    className="bg-[#131C31] border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white"
                  />
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="bg-[#131C31] border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="ALL">All Tiers</option>
                    <option value="HOT">HOT (&gt;=76)</option>
                    <option value="WARM">WARM (58-75)</option>
                    <option value="NURTURE">NURTURE (&lt;58)</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(true)}
                  className="px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white"
                >
                  + New Student Inquiry
                </button>
              </div>
              <div className="rounded-lg bg-[#0D1322] border border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#131C31] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Origin</th>
                      <th className="p-3">Student</th>
                      <th className="p-3">Programme</th>
                      <th className="p-3">Lang</th>
                      <th className="p-3">Score (Fit/Int/Rdy/Fric)</th>
                      <th className="p-3">Stage</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {filteredProspects.map((p) => (
                      <tr key={p.id} className="hover:bg-[#131C31]/60">
                        <td className="p-3 font-mono text-[10px]">
                          <span className={p.is_synthetic ? 'text-amber-300' : 'text-emerald-300'}>
                            {p.is_synthetic ? 'SYNTHETIC' : 'LIVE'}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-white">
                          {p.first_name} {p.last_name} ({p.city})
                        </td>
                        <td className="p-3 font-mono text-violet-300">{p.target_programme_code}</td>
                        <td className="p-3 uppercase font-mono text-teal-300">{p.preferred_language}</td>
                        <td className="p-3 font-mono">
                          <span className="font-bold text-white">{p.current_composite_score}</span> ({p.fit_score}/
                          {p.intent_score}/{p.readiness_score}/{p.friction_score})
                        </td>
                        <td className="p-3 text-slate-300">{p.lifecycle_stage}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProspectId(p.id);
                              setActiveScreen('prospect360');
                            }}
                            className="px-2.5 py-1 rounded bg-violet-600 text-white text-[11px]"
                          >
                            Open 360°
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SCREEN 3: PROSPECT 360 */}
          {activeScreen === 'prospect360' && activeProspect && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <select
                  value={activeProspect.id}
                  onChange={(e) => setSelectedProspectId(e.target.value)}
                  className="bg-[#131C31] border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white"
                >
                  {dbState.prospects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.is_synthetic ? 'SYNTHETIC' : 'LIVE'}] {p.first_name} {p.last_name} —{' '}
                      {p.target_programme_code} ({p.current_composite_score}/100)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRecordConversion(activeProspect.id)}
                  className="px-3 py-1.5 rounded-md bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white"
                >
                  ✓ Record Conversion Milestone (APPLICATION_STARTED)
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800 space-y-2">
                  <div className="font-bold text-sm text-white">
                    {activeProspect.first_name} {activeProspect.last_name}
                  </div>
                  <div className="text-slate-400">Email: {activeProspect.email}</div>
                  <div className="text-slate-400">Phone: {activeProspect.phone_e164}</div>
                  <div className="text-slate-400">
                    Qualification: {activeProspect.undergrad_discipline} ({activeProspect.cgpa_or_percentage}%)
                  </div>
                  <div className="text-slate-400">Language: {activeProspect.preferred_language.toUpperCase()}</div>
                  <div className="text-slate-400">Stage: {activeProspect.lifecycle_stage}</div>
                  <div className="p-2.5 rounded bg-[#131C31] border border-slate-800 italic text-slate-300">
                    "{activeProspect.raw_initial_inquiry}"
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800 space-y-2">
                  <div className="font-semibold text-white">
                    4-Axis Score: {activeProspect.current_composite_score}/100 ({activeProspect.current_tier})
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="p-2 rounded bg-[#131C31]">Fit: {activeProspect.fit_score}</div>
                    <div className="p-2 rounded bg-[#131C31]">Intent: {activeProspect.intent_score}</div>
                    <div className="p-2 rounded bg-[#131C31]">Readiness: {activeProspect.readiness_score}</div>
                    <div className="p-2 rounded bg-[#131C31] text-rose-300">
                      Friction: {activeProspect.friction_score}
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800 space-y-2">
                  <div className="font-semibold text-white">Latest Draft & Human Approval</div>
                  {dbState.communications.find((c) => c.prospect_id === activeProspect.id) ? (
                    (() => {
                      const comm = dbState.communications.find((c) => c.prospect_id === activeProspect.id)!;
                      return (
                        <div className="space-y-2">
                          <div className="p-2.5 rounded bg-[#131C31] text-slate-200">{comm.body_localized}</div>
                          <div className="text-amber-300 font-mono text-[10px]">Status: {comm.status}</div>
                          <button
                            type="button"
                            onClick={() => handleApproveCommunication(comm.id)}
                            className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                          >
                            ✓ Approve Message
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-slate-400">Run a scenario or submit a prospect to view draft.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 4: AGENT CONTROL ROOM */}
          {activeScreen === 'agent' && (
            <div className="space-y-4">
              {dbState.agent_runs.length === 0 ? (
                <div className="p-6 rounded-lg bg-[#0D1322] border border-slate-800 text-xs text-slate-400">
                  No agent runs recorded yet. Submit a student inquiry or click a QA scenario in Command Centre.
                </div>
              ) : (
                dbState.agent_runs.map((run: Record<string, unknown>) => (
                  <div key={String(run.id)} className="p-4 rounded-lg bg-[#0D1322] border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-semibold text-white">
                        {String(run.prospect_name || 'Prospect')} · {String(run.status)}
                      </span>
                      <span className="font-mono text-teal-300">{String(run.duration_ms || 380)}ms</span>
                    </div>
                    <div className="text-slate-400">Guardrail: {String(run.guardrail_status)}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SCREEN 5: KNOWLEDGE CENTRE */}
          {activeScreen === 'knowledge' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800 flex flex-wrap gap-2">
                <select
                  value={ragProg}
                  onChange={(e) => setRagProg(e.target.value as 'PGP-AIML' | 'BTECH-AIDS' | 'EMBA-DT')}
                  className="bg-[#131C31] border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                >
                  <option value="PGP-AIML">PGP-AIML</option>
                  <option value="BTECH-AIDS">BTECH-AIDS</option>
                  <option value="EMBA-DT">EMBA-DT</option>
                </select>
                <input
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  className="flex-1 bg-[#131C31] border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div className="space-y-2.5">
                {dbState.programme_knowledge
                  .filter((k) => k.programme_code === ragProg)
                  .map((k) => (
                    <div key={k.id} className="p-4 rounded-lg bg-[#0D1322] border border-slate-800 text-xs space-y-1">
                      <div className="font-semibold text-white">{k.chunk_title}</div>
                      <p className="text-slate-300">{k.content_markdown}</p>
                      <div className="text-[10px] text-teal-300 font-mono">
                        Verified: {k.verified_at} · Source: {k.source_url}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SCREEN 6: ENGAGEMENT STUDIO */}
          {activeScreen === 'engagement' && (
            <div className="space-y-4">
              {dbState.communications.map((c) => (
                <div key={c.id} className="p-4 rounded-lg bg-[#0D1322] border border-slate-800 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-white">
                      {c.language_code.toUpperCase()} ({c.channel}) · {c.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApproveCommunication(c.id)}
                      className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                    >
                      Approve Draft
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded bg-[#131C31] text-slate-200">{c.body_localized}</div>
                    <div className="p-3 rounded bg-[#131C31] text-slate-400">{c.body_english_translation}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SCREEN 7: COUNSELLOR WORKSPACE */}
          {activeScreen === 'counsellor' && (
            <div className="space-y-3">
              {dbState.followup_tasks.map((t: Record<string, unknown>) => (
                <div key={String(t.id)} className="p-4 rounded-lg bg-[#0D1322] border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white">{String(t.title)}</div>
                    <div className="text-slate-400">{String(t.ai_brief_markdown || '')}</div>
                  </div>
                  <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-mono">{String(t.status)}</span>
                </div>
              ))}
            </div>
          )}

          {/* SCREEN 8: GROWTH INTELLIGENCE */}
          {activeScreen === 'growth' && (
            <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800 text-xs space-y-3">
              <h3 className="text-sm font-semibold text-white">Experiments & Conversion Feedback Loop</h3>
              {dbState.experiments.map((exp: Record<string, unknown>) => (
                <div key={String(exp.id)} className="p-3 rounded bg-[#131C31] border border-slate-800">
                  <div className="font-semibold text-teal-300">{String(exp.code)} — {String(exp.name)}</div>
                  <div className="text-slate-400 mt-1">Status: {String(exp.status)} · Relative Lift: +{String(exp.relative_lift_pct)}%</div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* INTAKE MODAL */}
      {showIntakeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1322] border border-slate-700 rounded-xl max-w-xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Submit Student Inquiry (Live 9-Tool Agent)</h3>
              <button type="button" onClick={() => setShowIntakeModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowIntakeModal(false);
                submitProspectToApi({
                  first_name: formFirstName,
                  last_name: formLastName,
                  email: formEmail,
                  phone_e164: formPhone,
                  preferred_language: formLang,
                  target_programme_code: formProg,
                  undergrad_discipline: formDiscipline,
                  cgpa_or_percentage: parseFloat(formCgpa) || 75,
                  work_experience_months: parseInt(formWorkExp, 10) || 12,
                  utm_source: formUtm,
                  raw_initial_inquiry: formInquiry,
                });
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <input value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} required placeholder="First Name" className="bg-[#131C31] border border-slate-700 rounded px-3 py-1.5 text-white" />
                <input value={formLastName} onChange={(e) => setFormLastName(e.target.value)} placeholder="Last Name" className="bg-[#131C31] border border-slate-700 rounded px-3 py-1.5 text-white" />
                <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required type="email" placeholder="Email" className="bg-[#131C31] border border-slate-700 rounded px-3 py-1.5 text-white" />
                <input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} required placeholder="Phone" className="bg-[#131C31] border border-slate-700 rounded px-3 py-1.5 text-white" />
                <select value={formProg} onChange={(e) => setFormProg(e.target.value as 'PGP-AIML' | 'BTECH-AIDS' | 'EMBA-DT')} className="bg-[#131C31] border border-slate-700 rounded px-3 py-1.5 text-white">
                  <option value="PGP-AIML">PGP-AIML</option>
                  <option value="BTECH-AIDS">BTECH-AIDS</option>
                  <option value="EMBA-DT">EMBA-DT</option>
                </select>
                <select value={formLang} onChange={(e) => setFormLang(e.target.value as SupportedLanguage)} className="bg-[#131C31] border border-slate-700 rounded px-3 py-1.5 text-white">
                  <option value="ml">Malayalam (ml)</option>
                  <option value="en">English (en)</option>
                  <option value="hi">Hindi (hi)</option>
                  <option value="te">Telugu (te)</option>
                  <option value="ta">Tamil (ta)</option>
                  <option value="kn">Kannada (kn)</option>
                </select>
                <input value={formDiscipline} onChange={(e) => setFormDiscipline(e.target.value)} placeholder="Degree" className="bg-[#131C31] border border-slate-700 rounded px-3 py-1.5 text-white" />
                <input value={formCgpa} onChange={(e) => setFormCgpa(e.target.value)} placeholder="Percentage" className="bg-[#131C31] border border-slate-700 rounded px-3 py-1.5 text-white" />
                <input value={formWorkExp} onChange={(e) => setFormWorkExp(e.target.value)} placeholder="Work Exp (Months)" className="bg-[#131C31] border border-slate-700 rounded px-3 py-1.5 text-white" />
                <input value={formUtm} onChange={(e) => setFormUtm(e.target.value)} placeholder="UTM Source" className="bg-[#131C31] border border-slate-700 rounded px-3 py-1.5 text-white" />
              </div>
              <textarea value={formInquiry} onChange={(e) => setFormInquiry(e.target.value)} rows={3} required className="w-full bg-[#131C31] border border-slate-700 rounded px-3 py-1.5 text-white" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowIntakeModal(false)} className="px-3 py-1.5 rounded bg-slate-800 text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded bg-violet-600 hover:bg-violet-500 font-semibold text-white">
                  Submit & Execute 9-Tool Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
