"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPermissionsIpc = registerPermissionsIpc;
const electron_1 = require("electron");
const uuid_1 = require("uuid");
const ipc_channels_1 = require("../../shared/ipc-channels");
const pendingCallbacks = new Map();
function registerPermissionsIpc(wm) {
    const defaultSession = electron_1.session.defaultSession;
    defaultSession.setPermissionRequestHandler((_webContents, permission, callback, details) => {
        const requestId = (0, uuid_1.v4)();
        pendingCallbacks.set(requestId, callback);
        const win = wm.getMain();
        if (win) {
            win.webContents.send(ipc_channels_1.IPC.PERMISSION_REQUEST, {
                requestId,
                permission,
                origin: details.requestingUrl,
            });
        }
        else {
            pendingCallbacks.delete(requestId);
            callback(false);
        }
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.PERMISSION_RESPOND, (_event, { requestId, granted }) => {
        const cb = pendingCallbacks.get(requestId);
        if (cb) {
            pendingCallbacks.delete(requestId);
            cb(granted);
        }
        return { ok: true };
    });
}
