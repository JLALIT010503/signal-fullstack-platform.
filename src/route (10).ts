import { NextResponse } from 'next/server';
import { getSignalEnv } from '@/lib/env';
import { loadDatabaseState, saveDatabaseState } from '@/lib/db/repository';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  const env = getSignalEnv();

  if (mode === 'subscribe' && token === env.whatsapp.verifyToken) {
    return new Response(challenge || 'OK', { status: 200 });
  }
  return NextResponse.json({ error: 'Invalid verify_token' }, { status: 403 });
}

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
