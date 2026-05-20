"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInjectionsIpc = registerInjectionsIpc;
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
const injection_service_1 = require("../services/injection-service");
const profile_service_1 = require("../services/profile-service");
function registerInjectionsIpc(db) {
    const injectionService = new injection_service_1.InjectionService(db);
    const profileService = new profile_service_1.ProfileService(db);
    electron_1.ipcMain.handle(ipc_channels_1.IPC.INJECTIONS_GET_ALL, () => {
        const profileId = profileService.getActive();
        return injectionService.getAll(profileId);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.INJECTIONS_GET_FOR_ORIGIN, (_event, { origin }) => {
        const profileId = profileService.getActive();
        return injectionService.getForOrigin(origin, profileId);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.INJECTIONS_SAVE, (_event, { origin, css, js, enabled }) => {
        const profileId = profileService.getActive();
        injectionService.save(origin, profileId, css, js, enabled);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.INJECTIONS_DELETE, (_event, { origin }) => {
        const profileId = profileService.getActive();
        injectionService.delete(origin, profileId);
        return { ok: true };
    });
}
