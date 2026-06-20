import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../../shared/supabase-config';

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;

  // Env vars win (dev override); otherwise fall back to the bundled config so
  // sync works in packaged builds where no .env is loaded into process.env.
  const url  = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || SUPABASE_URL;

  const key  = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    || process.env.VITE_SUPABASE_ANON_KEY
    || process.env.SUPABASE_ANON_KEY
    || SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  // Electron's main process (Node 20) has no global WebSocket, which the
  // Supabase realtime client requires at construction. Polyfill it from `ws`
  // so creating the client doesn't throw. Sync uses auth + REST, not realtime.
  if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      (globalThis as { WebSocket?: unknown }).WebSocket = require('ws');
    } catch {
      /* ws unavailable — realtime stays disabled, auth/REST still work */
    }
  }

  try {
    _client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  } catch {
    // Never let a sync/init failure crash the browser — disable sync instead.
    return null;
  }

  return _client;
}

export async function isSupabaseReady(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { data } = await client.auth.getSession();
  return !!data.session;
}
