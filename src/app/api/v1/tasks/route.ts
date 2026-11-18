import { NextResponse } from 'next/server';
import { loadDatabaseState, saveDatabaseState } from '@/lib/db/repository';

export async function GET() {
  const state = loadDatabaseState();
  return NextResponse.json({
    success: true,
    data: {
      tasks: state.followup_tasks,
      total: state.followup_tasks.length,
    },
  });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const state = loadDatabaseState();
  const idx = state.followup_tasks.findIndex((t) => t.id === body.task_id);
  if (idx < 0) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } },
      { status: 404 }
    );
  }
  state.followup_tasks[idx] = {
    ...state.followup_tasks[idx],
    status: body.status || 'COMPLETED',
    resolution_notes: body.resolution_notes || 'Resolved by counsellor',
    completed_at: new Date().toISOString(),
  };
  saveDatabaseState(state);
  return NextResponse.json({ success: true, data: state.followup_tasks[idx] });
}
