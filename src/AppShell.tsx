'use client';

import React from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/', label: '1. Command Centre', badge: 'LIVE' },
  { href: '/prospects', label: '2. Prospect Explorer', badge: '' },
  { href: '/prospects/c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b01', label: '3. Prospect 360', badge: '360' },
  { href: '/agent-control', label: '4. AI Agent Control Room', badge: '9 Tools' },
  { href: '/knowledge', label: '5. Knowledge Centre', badge: 'RAG' },
  { href: '/engagement', label: '6. Engagement Studio', badge: '6 Langs' },
  { href: '/counsellor', label: '7. Counsellor Workspace', badge: 'SLA' },
  { href: '/growth', label: '8. Growth Intelligence', badge: 'ROI' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#070B14] text-slate-100">
      <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-[#0D1322] p-4 hidden md:flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 px-2 py-2 border-b border-slate-800/80 pb-4">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center font-bold text-xs text-slate-950">
              SG
            </div>
            <div>
              <div className="font-semibold tracking-tight text-sm">SIGNAL</div>
              <div className="text-[11px] text-slate-400">Autonomous Student Intelligence</div>
            </div>
          </div>
          <nav className="mt-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-[#131C31] transition"
              >
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-3 rounded-lg bg-[#131C31] border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-medium text-slate-200">Guardrail Policy Active</div>
          <div>Min RAG Similarity: 0.78</div>
          <div>External Send: Human Approval Gate</div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
