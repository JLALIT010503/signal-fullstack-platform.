import { NextResponse } from 'next/server';
import { loadDatabaseState } from '@/lib/db/repository';

export async function GET() {
  const state = loadDatabaseState();
  const enrichedRuns = state.agent_runs.map((run) => ({
    ...run,
    tool_calls: state.agent_tool_calls.filter((tc) => tc.agent_run_id === run.id),
  }));
  return NextResponse.json({
    success: true,
    data: {
      runs: enrichedRuns,
      total: enrichedRuns.length,
    },
  });
}
