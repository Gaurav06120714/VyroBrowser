"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerKeywordsIpc = registerKeywordsIpc;
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
function registerKeywordsIpc(keywordService) {
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_RESOLVE, (_e, { input, searchEngine }) => {
        return keywordService.resolve(input, searchEngine);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_SUGGEST, (_e, { input, max }) => {
        return keywordService.suggest(input, max ?? 8);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_GET_ALL, () => {
        return keywordService.getAll();
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_SAVE_CUSTOM, (_e, data) => {
        return keywordService.saveCustom(data);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_DELETE_CUSTOM, (_e, { keyword }) => {
        keywordService.deleteCustom(keyword);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_TOGGLE, (_e, { keyword, enabled, isBuiltin }) => {
        if (isBuiltin) {
            keywordService.toggleBuiltin(keyword, enabled);
        }
        else {
            const { custom } = keywordService.getAll();
            const existing = custom.find(c => c.keyword === keyword);
            if (existing) {
                keywordService.saveCustom({ ...existing, enabled });
            }
        }
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_EXPORT, () => {
        return keywordService.exportJson();
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_IMPORT, (_e, { json }) => {
        return keywordService.importJson(json);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_TRACK_USE, (_e, { keyword }) => {
        keywordService.trackUse(keyword);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_GET_USAGE, () => {
        return keywordService.getUsage();
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.KEYWORDS_RESET, () => {
        keywordService.resetBuiltinOverrides();
        return { ok: true };
    });
}
