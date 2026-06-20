"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachPermissionHandler = attachPermissionHandler;
exports.registerPermissionsIpc = registerPermissionsIpc;
const electron_1 = require("electron");
const uuid_1 = require("uuid");
const ipc_channels_1 = require("../../shared/ipc-channels");
const pendingCallbacks = new Map();
let wmRef = null;
// Route a session's permission requests through the in-app PermissionDialog.
// Applied to the default session and every per-profile partition so no webview
// permission is silently auto-granted.
function attachPermissionHandler(s) {
    s.setPermissionRequestHandler((_webContents, permission, callback, details) => {
        const win = wmRef?.getMain();
        if (!win || win.isDestroyed()) {
            callback(false);
            return;
        }
        const requestId = (0, uuid_1.v4)();
        pendingCallbacks.set(requestId, callback);
        win.webContents.send(ipc_channels_1.IPC.PERMISSION_REQUEST, {
            requestId,
            permission,
            origin: details.requestingUrl,
        });
    });
}
function registerPermissionsIpc(wm) {
    wmRef = wm;
    attachPermissionHandler(electron_1.session.defaultSession);
    electron_1.ipcMain.handle(ipc_channels_1.IPC.PERMISSION_RESPOND, (_event, { requestId, granted }) => {
        const cb = pendingCallbacks.get(requestId);
        if (cb) {
            pendingCallbacks.delete(requestId);
            cb(granted);
        }
        return { ok: true };
    });
}
