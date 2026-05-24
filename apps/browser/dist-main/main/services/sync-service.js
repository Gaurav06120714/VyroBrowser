"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncHistoryAdd = syncHistoryAdd;
exports.syncHistoryDelete = syncHistoryDelete;
exports.syncHistoryClear = syncHistoryClear;
exports.syncBookmarkAdd = syncBookmarkAdd;
exports.syncBookmarkUpdate = syncBookmarkUpdate;
exports.syncBookmarkDelete = syncBookmarkDelete;
exports.syncFolderAdd = syncFolderAdd;
exports.syncFolderDelete = syncFolderDelete;
exports.syncSettingsSet = syncSettingsSet;
exports.syncAIConversationCreate = syncAIConversationCreate;
exports.syncAIConversationDelete = syncAIConversationDelete;
exports.syncAIMessageAdd = syncAIMessageAdd;
// ─────────────────────────────────────────────────────────────────────────────
// sync-service.ts — Push local SQLite data to Supabase after every write.
// Strategy: offline-first. SQLite is always the source of truth locally.
// Supabase is the cloud mirror. Last-write-wins on conflict.
// All methods are fire-and-forget (never throw, never block local ops).
// ─────────────────────────────────────────────────────────────────────────────
const supabase_client_1 = require("./supabase-client");
async function push(table, payload) {
    try {
        const client = (0, supabase_client_1.getSupabaseClient)();
        if (!client)
            return;
        const { data: { session } } = await client.auth.getSession();
        if (!session)
            return;
        await client.from(table).upsert(payload, { onConflict: 'id' });
    }
    catch {
        // sync errors are silent — local data is never affected
    }
}
async function remove(table, id) {
    try {
        const client = (0, supabase_client_1.getSupabaseClient)();
        if (!client)
            return;
        const { data: { session } } = await client.auth.getSession();
        if (!session)
            return;
        await client.from(table).delete().eq('id', id);
    }
    catch { /* silent */ }
}
// ── History ───────────────────────────────────────────────────────────────────
function syncHistoryAdd(entry) {
    push('history', {
        id: String(entry.id),
        profile_id: entry.profile_id,
        url: entry.url,
        title: entry.title,
        favicon: entry.favicon,
        visit_count: entry.visit_count,
        last_visited_at: new Date(entry.last_visited_at * 1000).toISOString(),
    });
}
function syncHistoryDelete(id) { remove('history', String(id)); }
function syncHistoryClear(profileId) {
    try {
        const client = (0, supabase_client_1.getSupabaseClient)();
        if (!client)
            return;
        client.auth.getSession().then(({ data: { session } }) => {
            if (!session)
                return;
            client.from('history').delete().eq('profile_id', profileId).then(() => { });
        });
    }
    catch { /* silent */ }
}
// ── Bookmarks ─────────────────────────────────────────────────────────────────
function syncBookmarkAdd(bm) {
    push('bookmarks', {
        id: String(bm.id),
        profile_id: bm.profile_id,
        folder_id: bm.folder_id ? String(bm.folder_id) : null,
        url: bm.url,
        title: bm.title,
        favicon: bm.favicon,
        sort_index: bm.sort_index,
        created_at: new Date(bm.created_at * 1000).toISOString(),
    });
}
function syncBookmarkUpdate(id, fields) {
    push('bookmarks', { id: String(id), ...fields });
}
function syncBookmarkDelete(id) { remove('bookmarks', String(id)); }
function syncFolderAdd(folder) {
    push('bookmark_folders', {
        id: String(folder.id),
        profile_id: folder.profile_id,
        parent_id: folder.parent_id ? String(folder.parent_id) : null,
        name: folder.name,
        sort_index: folder.sort_index,
        created_at: new Date(folder.created_at * 1000).toISOString(),
    });
}
function syncFolderDelete(id) { remove('bookmark_folders', String(id)); }
// ── Settings ──────────────────────────────────────────────────────────────────
function syncSettingsSet(profileId, key, value) {
    push('settings', { profile_id: profileId, key, value, updated_at: new Date().toISOString() });
}
// ── AI Conversations ──────────────────────────────────────────────────────────
function syncAIConversationCreate(conv) {
    push('ai_conversations', {
        id: conv.id,
        profile_id: conv.profile_id,
        title: conv.title,
        model: conv.model,
        system_prompt: conv.system_prompt,
        created_at: new Date(conv.created_at * 1000).toISOString(),
        updated_at: new Date(conv.updated_at * 1000).toISOString(),
    });
}
function syncAIConversationDelete(id) { remove('ai_conversations', id); }
function syncAIMessageAdd(msg) {
    push('ai_messages', {
        id: msg.id,
        conversation_id: msg.conversation_id,
        role: msg.role,
        content: msg.content,
        created_at: new Date(msg.created_at * 1000).toISOString(),
    });
}
