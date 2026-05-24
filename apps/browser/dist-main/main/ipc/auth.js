"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthIpc = registerAuthIpc;
// ─────────────────────────────────────────────────────────────────────────────
// auth.ts — Supabase auth IPC handlers.
// Handles sign-in, sign-up, sign-out, session retrieval.
// Pushes AUTH_STATE_CHANGED to renderer when session changes.
// ─────────────────────────────────────────────────────────────────────────────
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
const supabase_client_1 = require("../services/supabase-client");
function registerAuthIpc(wm) {
    const client = (0, supabase_client_1.getSupabaseClient)();
    // Push auth state changes to renderer
    if (client) {
        client.auth.onAuthStateChange((event, session) => {
            const win = wm.getMain();
            if (win && !win.isDestroyed()) {
                win.webContents.send(ipc_channels_1.IPC.AUTH_STATE_CHANGED, {
                    event,
                    user: session?.user ?? null,
                    accessToken: session?.access_token ?? null,
                });
            }
        });
    }
    // Sign in with email + password
    electron_1.ipcMain.handle(ipc_channels_1.IPC.AUTH_SIGN_IN, async (_e, email, password) => {
        if (!client)
            return { ok: false, error: 'Supabase not configured' };
        try {
            const { data, error } = await client.auth.signInWithPassword({ email, password });
            if (error)
                return { ok: false, error: error.message };
            return { ok: true, user: data.user, accessToken: data.session?.access_token };
        }
        catch (err) {
            return { ok: false, error: err?.message ?? 'Sign in failed' };
        }
    });
    // Sign up with email + password
    electron_1.ipcMain.handle(ipc_channels_1.IPC.AUTH_SIGN_UP, async (_e, email, password) => {
        if (!client)
            return { ok: false, error: 'Supabase not configured' };
        try {
            const { data, error } = await client.auth.signUp({ email, password });
            if (error)
                return { ok: false, error: error.message };
            return { ok: true, user: data.user, needsConfirmation: !data.session };
        }
        catch (err) {
            return { ok: false, error: err?.message ?? 'Sign up failed' };
        }
    });
    // Sign out
    electron_1.ipcMain.handle(ipc_channels_1.IPC.AUTH_SIGN_OUT, async () => {
        if (!client)
            return { ok: false, error: 'Supabase not configured' };
        try {
            const { error } = await client.auth.signOut();
            if (error)
                return { ok: false, error: error.message };
            return { ok: true };
        }
        catch (err) {
            return { ok: false, error: err?.message ?? 'Sign out failed' };
        }
    });
    // Get current session
    electron_1.ipcMain.handle(ipc_channels_1.IPC.AUTH_GET_SESSION, async () => {
        if (!client)
            return { ok: true, user: null, configured: false };
        try {
            const { data, error } = await client.auth.getSession();
            if (error)
                return { ok: false, error: error.message };
            return {
                ok: true,
                configured: true,
                user: data.session?.user ?? null,
                accessToken: data.session?.access_token ?? null,
            };
        }
        catch (err) {
            return { ok: false, error: err?.message };
        }
    });
}
