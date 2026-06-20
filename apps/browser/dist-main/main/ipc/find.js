"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFindIpc = registerFindIpc;
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
const tabs_1 = require("./tabs");
function registerFindIpc() {
    electron_1.ipcMain.handle(ipc_channels_1.IPC.FIND_START, (_event, { tabId, text, forward }) => {
        const wcId = tabs_1.tabWebContentsMap.get(tabId);
        if (!wcId)
            return { ok: false };
        const target = electron_1.webContents.fromId(wcId);
        if (!target || target.isDestroyed())
            return { ok: false };
        target.once('found-in-page', (_e, result) => {
            for (const win of electron_1.BrowserWindow.getAllWindows()) {
                if (!win.isDestroyed()) {
                    win.webContents.send(ipc_channels_1.IPC.FIND_RESULT, {
                        tabId,
                        activeMatchOrdinal: result.activeMatchOrdinal,
                        matches: result.matches,
                    });
                }
            }
        });
        target.findInPage(text, { findNext: false, forward: forward !== false });
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.FIND_STOP, (_event, { tabId }) => {
        const wcId = tabs_1.tabWebContentsMap.get(tabId);
        if (!wcId)
            return { ok: true };
        const target = electron_1.webContents.fromId(wcId);
        if (target && !target.isDestroyed()) {
            target.stopFindInPage('clearSelection');
        }
        return { ok: true };
    });
}
