'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8 max-w-xl mx-auto my-12 rounded-xl bg-[#0D1322] border border-rose-500/40 text-slate-100">
      <h2 className="text-lg font-semibold text-rose-400">Operational Runtime Exception Captured</h2>
      <p className="text-sm text-slate-300 mt-2">{error.message}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white"
      >
        Retry Operational View
      </button>
    </div>
  );
}
