"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDownloadService = getDownloadService;
exports.registerDownloadsIpc = registerDownloadsIpc;
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
const download_service_1 = require("../services/download-service");
const profile_service_1 = require("../services/profile-service");
let downloadService;
function getDownloadService() {
    return downloadService;
}
function registerDownloadsIpc(db, wm) {
    const profileService = new profile_service_1.ProfileService(db);
    downloadService = new download_service_1.DownloadService(db);
    // Wire progress/complete callbacks to push events to renderer
    downloadService.setProgressCallback((id, received, total, state, speed) => {
        const win = wm.getMain();
        if (win && !win.isDestroyed()) {
            win.webContents.send(ipc_channels_1.IPC.DOWNLOADS_PROGRESS, { id, received, total, state, speed });
        }
    });
    downloadService.setCompleteCallback((id, savePath) => {
        const win = wm.getMain();
        if (win && !win.isDestroyed()) {
            win.webContents.send(ipc_channels_1.IPC.DOWNLOADS_COMPLETE, { id, savePath });
        }
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.DOWNLOADS_GET_ALL, () => {
        const profileId = profileService.getActive();
        return downloadService.getAll(profileId);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.DOWNLOADS_PAUSE, (_event, { id }) => {
        downloadService.pause(id);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.DOWNLOADS_RESUME, (_event, { id }) => {
        downloadService.resume(id);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.DOWNLOADS_CANCEL, (_event, { id }) => {
        downloadService.cancel(id);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.DOWNLOADS_OPEN, (_event, { id }) => {
        downloadService.open(id);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.DOWNLOADS_REVEAL, (_event, { id }) => {
        downloadService.reveal(id);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.DOWNLOADS_DELETE_RECORD, (_event, { id }) => {
        downloadService.deleteRecord(id);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.DOWNLOADS_CLEAR_COMPLETED, () => {
        const profileId = profileService.getActive();
        downloadService.clearCompleted(profileId);
        return { ok: true };
    });
}
