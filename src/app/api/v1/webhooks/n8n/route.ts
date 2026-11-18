import { NextResponse } from 'next/server';
import { loadDatabaseState, saveDatabaseState } from '@/lib/db/repository';
import { triggerN8nWorkflow } from '@/lib/integrations/adapters';

export async function POST(request: Request) {
  const body = await request.json();
  const state = loadDatabaseState();

  if (body.event === 'RESPONSE_RECEIVED' && body.prospect_id) {
    // Cancel pending automated drip tasks when prospect responds
    state.followup_tasks = state.followup_tasks.map((t) =>
      t.prospect_id === body.prospect_id && t.status === 'PENDING'
        ? { ...t, status: 'CANCELLED_ON_REPLY', updated_at: new Date().toISOString() }
        : t
    );
    state.communications = state.communications.map((c) =>
      c.prospect_id === body.prospect_id
        ? { ...c, status: 'RESPONSE_RECEIVED', updated_at: new Date().toISOString() }
        : c
    );
    saveDatabaseState(state);
    const result = await triggerN8nWorkflow('RESPONSE_RECEIVED', body);
    return NextResponse.json({ success: true, data: result });
  }

  return NextResponse.json({ success: true, data: { received: true, payload: body } });
}
