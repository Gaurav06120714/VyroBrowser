import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;

  const url  = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  
  const key  = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    || process.env.VITE_SUPABASE_ANON_KEY
    || process.env.SUPABASE_ANON_KEY
    || '';

  if (!url || !key) return null; 

  _client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  return _client;
}

export async function isSupabaseReady(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { data } = await client.auth.getSession();
  return !!data.session;
}
