"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdblockIpc = registerAdblockIpc;
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
const request_filter_1 = require("../adblock/request-filter");
const settings_service_1 = require("../services/settings-service");
function registerAdblockIpc(db) {
    const settingsService = new settings_service_1.SettingsService(db);
    (0, request_filter_1.loadSiteRulesFromDb)(settingsService);
    electron_1.ipcMain.handle(ipc_channels_1.IPC.ADBLOCK_GET_STATS, () => {
        return (0, request_filter_1.getStats)();
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.ADBLOCK_SITE_TOGGLE, (_event, { origin, enabled }) => {
        (0, request_filter_1.setSiteOverride)(origin, enabled, settingsService);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.ADBLOCK_GET_SITE_RULES, () => {
        return (0, request_filter_1.getAllSiteOverrides)();
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.ADBLOCK_RELOAD_LISTS, async () => {
        const defaultSess = electron_1.session.defaultSession;
        await (0, request_filter_1.reloadBlocklists)(defaultSess);
        for (const s of electron_1.session.getAllSessions?.() ?? []) {
            if (s !== defaultSess) {
                try {
                    await (0, request_filter_1.reloadBlocklists)(s);
                }
                catch { }
            }
        }
        return { ok: true };
    });
}
