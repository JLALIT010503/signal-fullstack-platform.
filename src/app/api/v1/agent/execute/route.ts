import { NextResponse } from 'next/server';
import { loadDatabaseState, persistProspectAndRun } from '@/lib/db/repository';
import { executeSupervisorAgentRun } from '@/lib/agent/supervisor';

export async function POST(request: Request) {
  const body = await request.json();
  const state = loadDatabaseState();
  const prospect = state.prospects.find((p) => p.id === body.prospect_id);
  if (!prospect) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Prospect not found' } },
      { status: 404 }
    );
  }

  if (body.latest_message) {
    prospect.raw_initial_inquiry = String(body.latest_message);
  }
  if (body.force_language) {
    prospect.preferred_language = body.force_language;
  }

  const agentRunResult = await executeSupervisorAgentRun({
    prospect,
    trigger_type: body.trigger_type || 'MANUAL_COUNSELLOR_TRIGGER',
    knowledgeStore: state.programme_knowledge,
    counsellors: state.counsellor_users,
  });

  const persisted = await persistProspectAndRun({
    prospect,
    agentRunResult,
  });

  return NextResponse.json({
    success: true,
    data: {
      ...persisted,
      agent_execution: agentRunResult,
    },
  });
}
