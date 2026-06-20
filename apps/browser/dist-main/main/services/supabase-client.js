"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseClient = getSupabaseClient;
exports.isSupabaseReady = isSupabaseReady;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase_config_1 = require("../../shared/supabase-config");
let _client = null;
function getSupabaseClient() {
    if (_client)
        return _client;
    // Env vars win (dev override); otherwise fall back to the bundled config so
    // sync works in packaged builds where no .env is loaded into process.env.
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || supabase_config_1.SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
        || process.env.VITE_SUPABASE_ANON_KEY
        || process.env.SUPABASE_ANON_KEY
        || supabase_config_1.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key)
        return null;
    // Electron's main process (Node 20) has no global WebSocket, which the
    // Supabase realtime client requires at construction. Polyfill it from `ws`
    // so creating the client doesn't throw. Sync uses auth + REST, not realtime.
    if (typeof globalThis.WebSocket === 'undefined') {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            globalThis.WebSocket = require('ws');
        }
        catch {
            /* ws unavailable — realtime stays disabled, auth/REST still work */
        }
    }
    try {
        _client = (0, supabase_js_1.createClient)(url, key, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false,
            },
        });
    }
    catch {
        // Never let a sync/init failure crash the browser — disable sync instead.
        return null;
    }
    return _client;
}
async function isSupabaseReady() {
    const client = getSupabaseClient();
    if (!client)
        return false;
    const { data } = await client.auth.getSession();
    return !!data.session;
}
