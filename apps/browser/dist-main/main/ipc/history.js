"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHistoryIpc = registerHistoryIpc;
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
const history_service_1 = require("../services/history-service");
const profile_service_1 = require("../services/profile-service");
function registerHistoryIpc(db) {
    const historyService = new history_service_1.HistoryService(db);
    const profileService = new profile_service_1.ProfileService(db);
    electron_1.ipcMain.handle(ipc_channels_1.IPC.HISTORY_SEARCH, (_event, { query, limit, offset }) => {
        const profileId = profileService.getActive();
        return historyService.search(profileId, query ?? '', limit, offset);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.HISTORY_ADD, (_event, { url, title, favicon }) => {
        const profileId = profileService.getActive();
        historyService.add(profileId, url, title, favicon);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.HISTORY_DELETE, (_event, { id }) => {
        historyService.delete(id);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.HISTORY_CLEAR_RANGE, (_event, { from, to }) => {
        const profileId = profileService.getActive();
        historyService.clearRange(profileId, from, to);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.HISTORY_CLEAR_ALL, () => {
        const profileId = profileService.getActive();
        historyService.clearAll(profileId);
        return { ok: true };
    });
}
