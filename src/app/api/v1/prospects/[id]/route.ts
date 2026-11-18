import { NextResponse } from 'next/server';
import { loadDatabaseState, saveDatabaseState } from '@/lib/db/repository';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const state = loadDatabaseState();
  const prospect = state.prospects.find((p) => p.id === id);
  if (!prospect) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: `Prospect ${id} not found.` } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      prospect,
      assessments: state.lead_assessments.filter((a) => a.prospect_id === id),
      communications: state.communications.filter((c) => c.prospect_id === id),
      followup_tasks: state.followup_tasks.filter((t) => t.prospect_id === id),
      agent_runs: state.agent_runs.filter((r) => r.prospect_id === id),
      agent_tool_calls: state.agent_tool_calls.filter((tc) => tc.prospect_id === id),
      conversion_events: state.conversion_events.filter((ce) => ce.prospect_id === id),
    },
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const updates = await request.json();
  const state = loadDatabaseState();
  const idx = state.prospects.findIndex((p) => p.id === id);
  if (idx < 0) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: `Prospect ${id} not found.` } },
      { status: 404 }
    );
  }

  state.prospects[idx] = {
    ...state.prospects[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  saveDatabaseState(state);
  return NextResponse.json({ success: true, data: state.prospects[idx] });
}
