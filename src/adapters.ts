import crypto from 'crypto';
import { getSignalEnv } from '../env';
import type { ChannelType, MessageDeliveryStatus } from '../../types/signal';

export interface IntegrationStatusReport {
  service: 'openai' | 'supabase' | 'n8n' | 'whatsapp' | 'resend' | 'firecrawl' | 'posthog' | 'sentry';
  configured: boolean;
  mode: 'LIVE_CONNECTED' | 'SAFE_TEST_MODE_NO_CREDENTIALS';
  requiredEnvVars: string[];
  details: string;
}

export function getAllIntegrationStatuses(): IntegrationStatusReport[] {
  const env = getSignalEnv();
  return [
    {
      service: 'openai',
      configured: env.openai.isConfigured,
      mode: env.openai.isConfigured ? 'LIVE_CONNECTED' : 'SAFE_TEST_MODE_NO_CREDENTIALS',
      requiredEnvVars: ['OPENAI_API_KEY', 'OPENAI_SUPERVISOR_MODEL'],
      details: env.openai.isConfigured
        ? `Connected to OpenAI (${env.openai.supervisorModel})`
        : 'Using deterministic explainable scoring & grounded template engine (set OPENAI_API_KEY for live LLM calls)',
    },
    {
      service: 'supabase',
      configured: env.supabase.isConfigured,
      mode: env.supabase.isConfigured ? 'LIVE_CONNECTED' : 'SAFE_TEST_MODE_NO_CREDENTIALS',
      requiredEnvVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
      details: env.supabase.isConfigured
        ? `Connected to Supabase (${env.supabase.url})`
        : 'Using persistent file-backed ACID repository at data/signal-runtime-db.json (set SUPABASE_* env vars for cloud Postgres)',
    },
    {
      service: 'n8n',
      configured: env.n8n.isConfigured,
      mode: env.n8n.isConfigured ? 'LIVE_CONNECTED' : 'SAFE_TEST_MODE_NO_CREDENTIALS',
      requiredEnvVars: ['N8N_WEBHOOK_BASE_URL', 'N8N_SIGNING_SECRET'],
      details: env.n8n.isConfigured
        ? `Webhook dispatch active (${env.n8n.webhookBaseUrl})`
        : 'Local automation fallback active; 7 workflow events logged to automation_events table',
    },
    {
      service: 'whatsapp',
      configured: env.whatsapp.isConfigured,
      mode: env.whatsapp.isConfigured ? 'LIVE_CONNECTED' : 'SAFE_TEST_MODE_NO_CREDENTIALS',
      requiredEnvVars: ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_APP_SECRET'],
      details: env.whatsapp.isConfigured
        ? `Meta Graph API v21.0 ready (Phone ID: ${env.whatsapp.phoneNumberId})`
        : 'Safe test mode: approved messages transition to MESSAGE_APPROVED (not falsely marked MESSAGE_DELIVERED without Meta credentials)',
    },
    {
      service: 'resend',
      configured: env.resend.isConfigured,
      mode: env.resend.isConfigured ? 'LIVE_CONNECTED' : 'SAFE_TEST_MODE_NO_CREDENTIALS',
      requiredEnvVars: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
      details: env.resend.isConfigured
        ? `Resend transactional email active (${env.resend.fromEmail})`
        : 'Safe test mode: approved emails transition to MESSAGE_APPROVED pending RESEND_API_KEY',
    },
    {
      service: 'firecrawl',
      configured: env.firecrawl.isConfigured,
      mode: env.firecrawl.isConfigured ? 'LIVE_CONNECTED' : 'SAFE_TEST_MODE_NO_CREDENTIALS',
      requiredEnvVars: ['FIRECRAWL_API_KEY'],
      details: env.firecrawl.isConfigured
        ? 'Firecrawl public webpage extraction active'
        : 'Manual & structured markdown ingestion active (set FIRECRAWL_API_KEY for live URL scraping)',
    },
    {
      service: 'posthog',
      configured: env.posthog.isConfigured,
      mode: env.posthog.isConfigured ? 'LIVE_CONNECTED' : 'SAFE_TEST_MODE_NO_CREDENTIALS',
      requiredEnvVars: ['NEXT_PUBLIC_POSTHOG_KEY', 'NEXT_PUBLIC_POSTHOG_HOST'],
      details: env.posthog.isConfigured
        ? 'PostHog product analytics telemetry active'
        : 'Analytics events persisted locally in conversion_events & audit_logs',
    },
    {
      service: 'sentry',
      configured: env.sentry.isConfigured,
      mode: env.sentry.isConfigured ? 'LIVE_CONNECTED' : 'SAFE_TEST_MODE_NO_CREDENTIALS',
      requiredEnvVars: ['SENTRY_DSN'],
      details: env.sentry.isConfigured
        ? 'Sentry exception monitoring active'
        : 'Structured error boundary & server audit_logs exception capture active',
    },
  ];
}

// ----------------------------------------------------------------------------
// n8n Automation Webhook Adapter (All 7 required lifecycle workflows)
// ----------------------------------------------------------------------------
export type N8nWorkflowEvent =
  | 'NEW_PROSPECT_RECEIVED'
  | 'AI_QUALIFICATION_COMPLETED'
  | 'FOLLOWUP_TASK_CREATED'
  | 'COUNSELLOR_ESCALATION'
  | 'MESSAGE_APPROVED'
  | 'RESPONSE_RECEIVED'
  | 'CONVERSION_EVENT_RECORDED';

export interface AutomationExecutionResult {
  workflow_event: N8nWorkflowEvent;
  dispatched_external: boolean;
  local_fallback_executed: boolean;
  signature_hmac: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export async function triggerN8nWorkflow(
  event: N8nWorkflowEvent,
  payload: Record<string, unknown>
): Promise<AutomationExecutionResult> {
  const env = getSignalEnv();
  const timestamp = new Date().toISOString();
  const bodyString = JSON.stringify({ event, timestamp, payload });
  const signature = crypto
    .createHmac('sha256', env.n8n.signingSecret)
    .update(bodyString)
    .digest('hex');

  if (env.n8n.isConfigured) {
    try {
      const response = await fetch(`${env.n8n.webhookBaseUrl}/${event.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signal-Signature': `sha256=${signature}`,
          'X-Signal-Timestamp': timestamp,
        },
        body: bodyString,
      });
      if (response.ok) {
        return {
          workflow_event: event,
          dispatched_external: true,
          local_fallback_executed: false,
          signature_hmac: signature,
          payload,
          timestamp,
        };
      }
    } catch {
      // Fall through to local automation fallback
    }
  }

  return {
    workflow_event: event,
    dispatched_external: false,
    local_fallback_executed: true,
    signature_hmac: signature,
    payload,
    timestamp,
  };
}

// ----------------------------------------------------------------------------
// External Messaging Dispatch Adapter (WhatsApp Cloud API & Resend)
// NEVER simulates fake external delivery when credentials are missing!
// ----------------------------------------------------------------------------
export interface DispatchMessageResult {
  channel: ChannelType;
  resulting_status: MessageDeliveryStatus;
  external_provider_id: string | null;
  is_live_provider_dispatch: boolean;
  diagnostic_note: string;
}

export async function dispatchApprovedCommunication(params: {
  channel: ChannelType;
  recipientPhoneE164: string;
  recipientEmail: string;
  subject: string | null;
  bodyLocalized: string;
  consentWhatsapp: boolean;
  consentEmail: boolean;
}): Promise<DispatchMessageResult> {
  const env = getSignalEnv();

  if (params.channel === 'WHATSAPP') {
    if (!params.consentWhatsapp) {
      return {
        channel: 'WHATSAPP',
        resulting_status: 'BLOCKED_NO_CONSENT',
        external_provider_id: null,
        is_live_provider_dispatch: false,
        diagnostic_note: 'Blocked: Prospect has not consented to WhatsApp outreach (consent_whatsapp = false).',
      };
    }

    if (!env.whatsapp.isConfigured) {
      return {
        channel: 'WHATSAPP',
        resulting_status: 'MESSAGE_APPROVED',
        external_provider_id: null,
        is_live_provider_dispatch: false,
        diagnostic_note:
          'Human approval recorded (status: MESSAGE_APPROVED). External WhatsApp Cloud API credentials are not configured; message is queued in safe test mode and NOT falsely marked delivered.',
      };
    }

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${env.whatsapp.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.whatsapp.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: params.recipientPhoneE164.replace('+', ''),
          type: 'text',
          text: { body: params.bodyLocalized },
        }),
      }
    );

    if (!res.ok) {
      return {
        channel: 'WHATSAPP',
        resulting_status: 'FAILED',
        external_provider_id: null,
        is_live_provider_dispatch: true,
        diagnostic_note: `WhatsApp Cloud API returned HTTP ${res.status}`,
      };
    }

    const data = (await res.json()) as { messages?: Array<{ id: string }> };
    return {
      channel: 'WHATSAPP',
      resulting_status: 'MESSAGE_SUBMITTED',
      external_provider_id: data.messages?.[0]?.id || 'wamid.submitted',
      is_live_provider_dispatch: true,
      diagnostic_note: 'Submitted to Meta WhatsApp Cloud API; awaiting webhook delivery receipt.',
    };
  }

  if (params.channel === 'EMAIL') {
    if (!params.consentEmail) {
      return {
        channel: 'EMAIL',
        resulting_status: 'BLOCKED_NO_CONSENT',
        external_provider_id: null,
        is_live_provider_dispatch: false,
        diagnostic_note: 'Blocked: Prospect has not consented to Email outreach (consent_email = false).',
      };
    }

    if (!env.resend.isConfigured) {
      return {
        channel: 'EMAIL',
        resulting_status: 'MESSAGE_APPROVED',
        external_provider_id: null,
        is_live_provider_dispatch: false,
        diagnostic_note:
          'Human approval recorded (status: MESSAGE_APPROVED). Resend API key is not configured; email is queued in safe test mode and NOT falsely marked delivered.',
      };
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.resend.fromEmail,
        to: [params.recipientEmail],
        subject: params.subject || 'Admissions Guidance — Programme Information',
        text: params.bodyLocalized,
      }),
    });

    if (!res.ok) {
      return {
        channel: 'EMAIL',
        resulting_status: 'FAILED',
        external_provider_id: null,
        is_live_provider_dispatch: true,
        diagnostic_note: `Resend API returned HTTP ${res.status}`,
      };
    }

    const data = (await res.json()) as { id?: string };
    return {
      channel: 'EMAIL',
      resulting_status: 'MESSAGE_SUBMITTED',
      external_provider_id: data.id || 'resend.submitted',
      is_live_provider_dispatch: true,
      diagnostic_note: 'Submitted to Resend API; awaiting delivery webhook.',
    };
  }

  return {
    channel: params.channel,
    resulting_status: 'MESSAGE_APPROVED',
    external_provider_id: null,
    is_live_provider_dispatch: false,
    diagnostic_note: 'Approved for manual counsellor execution.',
  };
}

// ----------------------------------------------------------------------------
// Firecrawl Public Webpage Ingestion Adapter
// ----------------------------------------------------------------------------
export async function ingestWebpageViaFirecrawl(url: string): Promise<{
  mode: 'FIRECRAWL_LIVE' | 'MANUAL_FALLBACK_REQUIRED';
  markdown: string | null;
  title: string | null;
  checksum_sha256: string | null;
  diagnostic: string;
}> {
  const env = getSignalEnv();
  if (!env.firecrawl.isConfigured) {
    return {
      mode: 'MANUAL_FALLBACK_REQUIRED',
      markdown: null,
      title: null,
      checksum_sha256: null,
      diagnostic:
        'FIRECRAWL_API_KEY is not configured. Use the manual source content field to ingest verified institutional programme text directly.',
    };
  }

  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.firecrawl.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, formats: ['markdown'] }),
  });

  if (!res.ok) {
    return {
      mode: 'MANUAL_FALLBACK_REQUIRED',
      markdown: null,
      title: null,
      checksum_sha256: null,
      diagnostic: `Firecrawl API returned HTTP ${res.status}`,
    };
  }

  const json = (await res.json()) as {
    data?: { markdown?: string; metadata?: { title?: string } };
  };
  const md = json.data?.markdown || '';
  const checksum = crypto.createHash('sha256').update(md).digest('hex');
  return {
    mode: 'FIRECRAWL_LIVE',
    markdown: md,
    title: json.data?.metadata?.title || url,
    checksum_sha256: checksum,
    diagnostic: 'Scraped public webpage via Firecrawl v1.',
  };
}
