import { createBrowserClient } from '@supabase/ssr';
import { getSignalEnv } from '../env';

export function getSupabaseBrowserClient() {
  const env = getSignalEnv();
  if (!env.supabase.isConfigured) {
    return null;
  }
  return createBrowserClient(env.supabase.url, env.supabase.anonKey);
}
