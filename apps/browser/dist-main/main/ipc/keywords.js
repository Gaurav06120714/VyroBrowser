"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerKeywordsIpc = registerKeywordsIpc;
// ─────────────────────────────────────────────────────────────────────────────
// IPC — Keywords handlers
// ─────────────────────────────────────────────────────────────────────────────
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
function registerKeywordsIpc(keywordService) {
    // Resolve a raw input string → { type, url, entry, query }
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_RESOLVE, (_e, { input, searchEngine }) => {
        return keywordService.resolve(input, searchEngine);
    });
    // Suggest dropdown items for a raw input string
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_SUGGEST, (_e, { input, max }) => {
        return keywordService.suggest(input, max ?? 8);
    });
    // Get all keywords (builtin list + custom list)
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_GET_ALL, () => {
        return keywordService.getAll();
    });
    // Save / update a custom keyword
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_SAVE_CUSTOM, (_e, data) => {
        return keywordService.saveCustom(data);
    });
    // Delete a custom keyword
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_DELETE_CUSTOM, (_e, { keyword }) => {
        keywordService.deleteCustom(keyword);
        return { ok: true };
    });
    // Enable / disable a keyword (builtin or custom)
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_TOGGLE, (_e, { keyword, enabled, isBuiltin }) => {
        if (isBuiltin) {
            keywordService.toggleBuiltin(keyword, enabled);
        }
        else {
            // For custom, save-custom with toggled state
            const { custom } = keywordService.getAll();
            const existing = custom.find(c => c.keyword === keyword);
            if (existing) {
                keywordService.saveCustom({ ...existing, enabled });
            }
        }
        return { ok: true };
    });
    // Export all custom keywords to JSON string
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_EXPORT, () => {
        return keywordService.exportJson();
    });
    // Import from JSON string, return count
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_IMPORT, (_e, { json }) => {
        return keywordService.importJson(json);
    });
    // Track usage — increment count for a keyword
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_TRACK_USE, (_e, { keyword }) => {
        keywordService.trackUse(keyword);
        return { ok: true };
    });
    // Get all usage counts
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_GET_USAGE, () => {
        return keywordService.getUsage();
    });
    // Reset all built-in overrides (re-enable all defaults)
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_RESET, () => {
        keywordService.resetBuiltinOverrides();
        return { ok: true };
    });
}
