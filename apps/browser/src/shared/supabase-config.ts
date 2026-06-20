// Supabase connection config for the opt-in sync feature.
//
// The URL and *publishable* key are safe to ship in the client — Supabase
// publishable/anon keys are designed to be public and are protected by
// Row-Level Security policies on the database. NEVER put a `sb_secret_`
// (service_role) key here.
//
// Env vars (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY) override these
// when present (e.g. for a different project in dev).

export const SUPABASE_URL = 'https://mhrcspokroabbicicqef.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XexrvOeSxeK7rJGrTHBqZQ_oOa2w8ap';
