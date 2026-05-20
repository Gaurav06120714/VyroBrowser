"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFindIpc = registerFindIpc;
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
function registerFindIpc() {
    electron_1.ipcMain.handle(ipc_channels_1.IPC.FIND_START, (_event, { tabId, text, forward }) => {
        // Find the webContents associated with the webview for this tab
        // The webview renders in a guest WebContents; we search by the tabId
        // stored in the webContents URL or via a known ID map
        const allWebContents = electron_1.webContents.getAllWebContents();
        const target = allWebContents.find(wc => {
            try {
                const url = wc.getURL();
                return url && !url.startsWith('devtools://') && wc.id.toString() === tabId;
            }
            catch {
                return false;
            }
        });
        if (target) {
            target.findInPage(text, { findNext: false, forward: forward !== false });
            return { ok: true };
        }
        return { ok: false };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.FIND_STOP, (_event, { tabId }) => {
        const allWebContents = electron_1.webContents.getAllWebContents();
        const target = allWebContents.find(wc => {
            try {
                return wc.id.toString() === tabId;
            }
            catch {
                return false;
            }
        });
        if (target) {
            target.stopFindInPage('clearSelection');
        }
        return { ok: true };
    });
}
