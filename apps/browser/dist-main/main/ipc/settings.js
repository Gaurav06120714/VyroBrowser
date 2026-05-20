"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSettingsIpc = registerSettingsIpc;
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
const settings_service_1 = require("../services/settings-service");
function registerSettingsIpc(db) {
    const settingsService = new settings_service_1.SettingsService(db);
    electron_1.ipcMain.handle(ipc_channels_1.IPC.SETTINGS_GET, (_event, { profileId }) => {
        return settingsService.get(profileId);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.SETTINGS_SET, (_event, { profileId, settings }) => {
        settingsService.set(profileId, settings);
        return { ok: true };
    });
}
