export interface SignalEnvConfig {
  nodeEnv: string;
  appUrl: string;
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    isConfigured: boolean;
  };
  openai: {
    apiKey: string;
    supervisorModel: string;
    fastModel: string;
    embeddingModel: string;
    isConfigured: boolean;
  };
  whatsapp: {
    phoneNumberId: string;
    accessToken: string;
    verifyToken: string;
    appSecret: string;
    isConfigured: boolean;
  };
  resend: {
    apiKey: string;
    fromEmail: string;
    webhookSecret: string;
    isConfigured: boolean;
  };
  n8n: {
    webhookBaseUrl: string;
    signingSecret: string;
    isConfigured: boolean;
  };
  firecrawl: {
    apiKey: string;
    isConfigured: boolean;
  };
  posthog: {
    key: string;
    host: string;
    isConfigured: boolean;
  };
  sentry: {
    dsn: string;
    isConfigured: boolean;
  };
  guardrails: {
    minRagSimilarity: number;
    minAutoSendConfidence: number;
    outboundCooldownHours: number;
  };
}

function isRealSecret(val: string | undefined): boolean {
  if (!val || val.trim() === '') return false;
  const placeholders = ['your-', 'example', '123456789', 'EAAGm0PX4ZCps', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'];
  return !placeholders.some((p) => val.includes(p));
}

export function getSignalEnv(): SignalEnvConfig {
  const env = typeof process !== 'undefined' && process.env ? process.env : ({} as Record<string, string | undefined>);
  return {
    nodeEnv: env.NODE_ENV || 'development',
    appUrl: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    supabase: {
      url: env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
      isConfigured: isRealSecret(env.NEXT_PUBLIC_SUPABASE_URL) && isRealSecret(env.SUPABASE_SERVICE_ROLE_KEY),
    },
    openai: {
      apiKey: env.OPENAI_API_KEY || '',
      supervisorModel: env.OPENAI_SUPERVISOR_MODEL || 'gpt-4o-2024-08-06',
      fastModel: env.OPENAI_FAST_CLASSIFIER_MODEL || 'gpt-4o-mini',
      embeddingModel: env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      isConfigured: isRealSecret(env.OPENAI_API_KEY),
    },
    whatsapp: {
      phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID || '',
      accessToken: env.WHATSAPP_ACCESS_TOKEN || '',
      verifyToken: env.WHATSAPP_VERIFY_TOKEN || 'signal_whatsapp_webhook_verify_token_2026',
      appSecret: env.WHATSAPP_APP_SECRET || '',
      isConfigured: isRealSecret(env.WHATSAPP_PHONE_NUMBER_ID) && isRealSecret(env.WHATSAPP_ACCESS_TOKEN),
    },
    resend: {
      apiKey: env.RESEND_API_KEY || '',
      fromEmail: env.RESEND_FROM_EMAIL || 'Admissions Guidance <admissions@signal-institute.edu>',
      webhookSecret: env.RESEND_WEBHOOK_SECRET || '',
      isConfigured: isRealSecret(env.RESEND_API_KEY),
    },
    n8n: {
      webhookBaseUrl: env.N8N_WEBHOOK_BASE_URL || '',
      signingSecret: env.N8N_SIGNING_SECRET || 'sig_hmac_n8n_shared_secret_9f8e7d6c5b4a',
      isConfigured: isRealSecret(env.N8N_WEBHOOK_BASE_URL),
    },
    firecrawl: {
      apiKey: env.FIRECRAWL_API_KEY || '',
      isConfigured: isRealSecret(env.FIRECRAWL_API_KEY),
    },
    posthog: {
      key: env.NEXT_PUBLIC_POSTHOG_KEY || '',
      host: env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      isConfigured: isRealSecret(env.NEXT_PUBLIC_POSTHOG_KEY),
    },
    sentry: {
      dsn: env.SENTRY_DSN || '',
      isConfigured: isRealSecret(env.SENTRY_DSN),
    },
    guardrails: {
      minRagSimilarity: parseFloat(env.SIGNAL_MIN_RAG_SIMILARITY || '0.78'),
      minAutoSendConfidence: parseFloat(env.SIGNAL_MIN_AUTO_SEND_CONFIDENCE || '0.82'),
      outboundCooldownHours: parseInt(env.SIGNAL_OUTBOUND_COOLDOWN_HOURS || '18', 10),
    },
  };
}
