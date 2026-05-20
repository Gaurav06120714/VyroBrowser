"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNavigationIpc = registerNavigationIpc;
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
const tabs_1 = require("./tabs");
function registerNavigationIpc(wm) {
    function getWc(tabId) {
        const wcId = tabs_1.tabWebContentsMap.get(tabId);
        if (!wcId)
            return null;
        return electron_1.webContents.fromId(wcId) ?? null;
    }
    electron_1.ipcMain.handle(ipc_channels_1.IPC.NAV_LOAD_URL, (_event, { tabId, url }) => {
        const wc = getWc(tabId);
        if (wc && !wc.isDestroyed()) {
            wc.loadURL(url).catch(() => { });
        }
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.NAV_GO_BACK, (_event, { tabId }) => {
        const wc = getWc(tabId);
        if (wc && !wc.isDestroyed() && wc.canGoBack())
            wc.goBack();
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.NAV_GO_FORWARD, (_event, { tabId }) => {
        const wc = getWc(tabId);
        if (wc && !wc.isDestroyed() && wc.canGoForward())
            wc.goForward();
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.NAV_RELOAD, (_event, { tabId, ignoreCache }) => {
        const wc = getWc(tabId);
        if (wc && !wc.isDestroyed()) {
            if (ignoreCache) {
                wc.reloadIgnoringCache();
            }
            else {
                wc.reload();
            }
        }
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.NAV_STOP, (_event, { tabId }) => {
        const wc = getWc(tabId);
        if (wc && !wc.isDestroyed())
            wc.stop();
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.NAV_ZOOM, (_event, { tabId, factor }) => {
        const wc = getWc(tabId);
        if (wc && !wc.isDestroyed())
            wc.setZoomFactor(factor);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.NAV_DEVTOOLS, (_event, { tabId }) => {
        const wc = getWc(tabId);
        if (wc && !wc.isDestroyed()) {
            if (wc.isDevToolsOpened()) {
                wc.closeDevTools();
            }
            else {
                wc.openDevTools({ mode: 'detach' });
            }
        }
        return { ok: true };
    });
}
