import { NextResponse } from 'next/server';
import { loadDatabaseState, saveDatabaseState } from '@/lib/db/repository';
import { dispatchApprovedCommunication, triggerN8nWorkflow } from '@/lib/integrations/adapters';

export async function POST(request: Request) {
  const body = await request.json();
  const state = loadDatabaseState();
  const commIdx = state.communications.findIndex((c) => c.id === body.communication_id);
  if (commIdx < 0) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Communication draft not found' } },
      { status: 404 }
    );
  }

  const comm = state.communications[commIdx];
  const prospect = state.prospects.find((p) => p.id === comm.prospect_id);
  if (!prospect) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Prospect not found' } },
      { status: 404 }
    );
  }

  if (body.updated_body_localized) {
    comm.body_localized = String(body.updated_body_localized);
  }

  comm.approved_by = body.approved_by || 'a1111111-1111-4111-8111-111111111101';

  const dispatchResult = await dispatchApprovedCommunication({
    channel: comm.channel,
    recipientPhoneE164: prospect.phone_e164,
    recipientEmail: prospect.email,
    subject: comm.subject,
    bodyLocalized: comm.body_localized,
    consentWhatsapp: prospect.consent_whatsapp,
    consentEmail: prospect.consent_email,
  });

  comm.status = dispatchResult.resulting_status;
  comm.external_provider_id = dispatchResult.external_provider_id;
  comm.diagnostic_note = dispatchResult.diagnostic_note;
  comm.updated_at = new Date().toISOString();

  await triggerN8nWorkflow('MESSAGE_APPROVED', {
    communication_id: comm.id,
    prospect_id: prospect.id,
    resulting_status: comm.status,
  });

  saveDatabaseState(state);

  return NextResponse.json({
    success: true,
    data: {
      communication: comm,
      dispatch: dispatchResult,
    },
  });
}
