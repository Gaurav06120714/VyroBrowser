"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseClient = getSupabaseClient;
exports.isSupabaseReady = isSupabaseReady;
// ─────────────────────────────────────────────────────────────────────────────
// supabase-client.ts — Singleton Supabase client for the main process.
// Uses VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from env.
// Returns null when env vars are not set (offline / local-only mode).
// ─────────────────────────────────────────────────────────────────────────────
const supabase_js_1 = require("@supabase/supabase-js");
let _client = null;
function getSupabaseClient() {
    if (_client)
        return _client;
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    // Support both new publishable key format and legacy anon key
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
        || process.env.VITE_SUPABASE_ANON_KEY
        || process.env.SUPABASE_ANON_KEY
        || '';
    if (!url || !key)
        return null; // offline / not configured
    _client = (0, supabase_js_1.createClient)(url, key, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
        },
    });
    return _client;
}
/** True when Supabase is configured and a user is signed in. */
async function isSupabaseReady() {
    const client = getSupabaseClient();
    if (!client)
        return false;
    const { data } = await client.auth.getSession();
    return !!data.session;
}
