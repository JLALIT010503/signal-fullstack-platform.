import { createClient } from '@supabase/supabase-js';
import { getSignalEnv } from '../env';

export function getSupabaseServiceClient() {
  const env = getSignalEnv();
  if (!env.supabase.isConfigured) {
    return null;
  }
  return createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
