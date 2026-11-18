import { NextResponse } from 'next/server';
import { loadDatabaseState, saveDatabaseState } from '@/lib/db/repository';

export async function POST(request: Request) {
  const body = await request.json();
  const state = loadDatabaseState();
  if (body.communication_id && body.status) {
    const idx = state.communications.findIndex((c) => c.id === body.communication_id);
    if (idx >= 0) {
      state.communications[idx].status = body.status;
      state.communications[idx].updated_at = new Date().toISOString();
      saveDatabaseState(state);
    }
  }
  return NextResponse.json({ success: true, received: true });
}
