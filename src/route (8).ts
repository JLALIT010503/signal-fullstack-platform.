import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { loadDatabaseState, saveDatabaseState } from '@/lib/db/repository';
import { record_conversion_event } from '@/lib/agent/tools';
import { triggerN8nWorkflow } from '@/lib/integrations/adapters';

export async function POST(request: Request) {
  const body = await request.json();
  const state = loadDatabaseState();
  const pIdx = state.prospects.findIndex((p) => p.id === body.prospect_id);
  if (pIdx < 0) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Prospect not found' } },
      { status: 404 }
    );
  }

  const prospect = state.prospects[pIdx];
  const eventRecord = record_conversion_event({
    prospect_id: prospect.id,
    event_type: body.event_type || 'APPLICATION_STARTED',
    revenue_value_inr: Number(body.revenue_value_inr || 0),
    attribution_source: prospect.utm_source,
    attribution_campaign: prospect.utm_campaign,
    resolved_barriers: body.resolved_barriers || [],
    notes: body.notes,
  });

  if (body.event_type === 'APPLICATION_STARTED') prospect.lifecycle_stage = 'APPLICATION_STARTED';
  if (body.event_type === 'OFFER_ISSUED') prospect.lifecycle_stage = 'OFFER_ISSUED';
  if (body.event_type === 'ENROLLED') prospect.lifecycle_stage = 'ENROLLED';
  prospect.updated_at = new Date().toISOString();

  const savedEvent = {
    id: crypto.randomUUID(),
    is_synthetic: prospect.is_synthetic,
    ...eventRecord,
  };
  state.conversion_events.unshift(savedEvent);
  saveDatabaseState(state);

  await triggerN8nWorkflow('CONVERSION_EVENT_RECORDED', savedEvent);

  return NextResponse.json({
    success: true,
    data: {
      conversion_event: savedEvent,
      prospect,
    },
  }, { status: 201 });
}
