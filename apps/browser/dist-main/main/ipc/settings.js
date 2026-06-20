"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSettingsIpc = registerSettingsIpc;
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
const settings_service_1 = require("../services/settings-service");
const validators_1 = require("./validators");
const https_only_1 = require("../https-only");
const constants_1 = require("../../shared/constants");
function registerSettingsIpc(db) {
    const settingsService = new settings_service_1.SettingsService(db);
    // Initialize HTTPS-only mode from the persisted default-profile setting.
    (0, https_only_1.setHttpsOnly)(settingsService.get(constants_1.DEFAULT_PROFILE_ID).httpsOnly);
    electron_1.ipcMain.handle(ipc_channels_1.IPC.SETTINGS_GET, (_event, args) => {
        const parsed = validators_1.SettingsGetSchema.safeParse(args);
        if (!parsed.success)
            return { error: 'Invalid arguments' };
        return settingsService.get(parsed.data.profileId);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.SETTINGS_SET, (_event, args) => {
        const parsed = validators_1.SettingsSetSchema.safeParse(args);
        if (!parsed.success)
            return { error: 'Invalid arguments' };
        const { profileId, settings } = parsed.data;
        settingsService.set(profileId, settings);
        const next = settings;
        if (typeof next.httpsOnly === 'boolean')
            (0, https_only_1.setHttpsOnly)(next.httpsOnly);
        return { ok: true };
    });
}
