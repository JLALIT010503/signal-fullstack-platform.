import React from 'react';
import { loadDatabaseState } from '@/lib/db/repository';
import { getAllIntegrationStatuses } from '@/lib/integrations/adapters';

export const dynamic = 'force-dynamic';

export default async function ScreenPage() {
  const state = loadDatabaseState();
  const integrations = getAllIntegrationStatuses();
  const syntheticCount = state.prospects.filter((p) => p.is_synthetic).length;
  const liveCount = state.prospects.filter((p) => !p.is_synthetic).length;

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Prospect 360 Intelligence Profile</h1>
          <p className="text-xs text-slate-400 mt-1">Explainable 4-axis qualification breakdown, detected conversion barriers, verified RAG citations, and conversion milestone recorder.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Synthetic Demo Records: {syntheticCount}
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Live Execution Records: {liveCount}
          </span>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800">
          <div className="text-xs text-slate-400">Total Prospects</div>
          <div className="text-2xl font-bold text-white mt-1">{state.prospects.length}</div>
        </div>
        <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800">
          <div className="text-xs text-slate-400">High-Intent (HOT) Leads</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">
            {state.prospects.filter((p) => p.current_tier === 'HOT').length}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800">
          <div className="text-xs text-slate-400">Pending Follow-Up Tasks</div>
          <div className="text-2xl font-bold text-violet-400 mt-1">
            {state.followup_tasks.filter((t) => t.status === 'PENDING').length}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-[#0D1322] border border-slate-800">
          <div className="text-xs text-slate-400">Verified Knowledge Chunks</div>
          <div className="text-2xl font-bold text-teal-400 mt-1">{state.programme_knowledge.length}</div>
        </div>
      </section>

      <section className="rounded-lg bg-[#0D1322] border border-slate-800 p-4">
        <h2 className="text-sm font-semibold text-white mb-3">Active Prospects & Qualification Status</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2 pr-4">Data Origin</th>
                <th className="py-2 pr-4">Prospect</th>
                <th className="py-2 pr-4">Programme</th>
                <th className="py-2 pr-4">Language</th>
                <th className="py-2 pr-4">Score / Tier</th>
                <th className="py-2 pr-4">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {state.prospects.map((p) => (
                <tr key={p.id} className="hover:bg-[#131C31]/60">
                  <td className="py-2.5 pr-4">
                    <span className={p.is_synthetic ? 'text-amber-300' : 'text-emerald-300 font-medium'}>
                      {p.is_synthetic ? 'SYNTHETIC_DEMO' : 'LIVE_EXECUTION'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 font-medium text-white">
                    {p.first_name} {p.last_name} ({p.city})
                  </td>
                  <td className="py-2.5 pr-4 text-slate-300">{p.target_programme_code}</td>
                  <td className="py-2.5 pr-4 uppercase text-slate-300">{p.preferred_language}</td>
                  <td className="py-2.5 pr-4">
                    <span className="font-mono font-semibold text-teal-300">{p.current_composite_score}/100</span> ({p.current_tier})
                  </td>
                  <td className="py-2.5 pr-4 text-slate-300">{p.lifecycle_stage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg bg-[#0D1322] border border-slate-800 p-4">
        <h2 className="text-sm font-semibold text-white mb-3">Connected External Service Adapters ({integrations.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {integrations.map((intg) => (
            <div key={intg.service} className="p-3 rounded bg-[#131C31] border border-slate-800">
              <div className="flex items-center justify-between font-semibold uppercase text-slate-200">
                <span>{intg.service}</span>
                <span className={intg.configured ? 'text-emerald-400' : 'text-amber-400'}>
                  {intg.configured ? 'LIVE' : 'SAFE TEST MODE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{intg.details}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
