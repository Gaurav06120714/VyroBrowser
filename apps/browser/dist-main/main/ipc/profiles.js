"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProfilesIpc = registerProfilesIpc;
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
const profile_service_1 = require("../services/profile-service");
const validators_1 = require("./validators");
function registerProfilesIpc(db, wm) {
    const profileService = new profile_service_1.ProfileService(db);
    electron_1.ipcMain.handle(ipc_channels_1.IPC.PROFILES_GET_ALL, () => {
        return profileService.getAll();
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.PROFILES_CREATE, (_event, { name, avatar }) => {
        return profileService.create(name, avatar);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.PROFILES_DELETE, (_event, { id }) => {
        profileService.delete(id);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.PROFILES_UPDATE, (_event, { id, name, avatar }) => {
        return profileService.update(id, { name, avatar });
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.PROFILES_SWITCH, (_event, args) => {
        const parsed = validators_1.ProfileSwitchSchema.safeParse(args);
        if (!parsed.success)
            return { error: 'Invalid arguments' };
        profileService.setActive(parsed.data.id);
        
        const win = wm.getMain();
        if (win) {
            win.reload();
        }
        return { ok: true };
    });
}
