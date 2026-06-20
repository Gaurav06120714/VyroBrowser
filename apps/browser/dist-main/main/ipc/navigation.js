"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNavigationIpc = registerNavigationIpc;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const ipc_channels_1 = require("../../shared/ipc-channels");
const tabs_1 = require("./tabs");
const validators_1 = require("./validators");
function registerNavigationIpc(wm) {
    function getWc(tabId) {
        const wcId = tabs_1.tabWebContentsMap.get(tabId);
        if (!wcId)
            return null;
        return electron_1.webContents.fromId(wcId) ?? null;
    }
    electron_1.ipcMain.handle(ipc_channels_1.IPC.NAV_LOAD_URL, (_event, args) => {
        const parsed = validators_1.NavLoadUrlSchema.safeParse(args);
        if (!parsed.success)
            return { error: 'Invalid arguments' };
        const { tabId, url } = parsed.data;
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
    electron_1.ipcMain.handle(ipc_channels_1.IPC.PAGE_PRINT, (_event, { tabId }) => {
        const wc = getWc(tabId);
        if (wc && !wc.isDestroyed())
            wc.print();
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.PAGE_SAVE, async (_event, { tabId }) => {
        const wc = getWc(tabId);
        if (!wc || wc.isDestroyed())
            return { ok: false };
        const main = wm.getMain();
        const suggested = (() => {
            try {
                return new URL(wc.getURL()).hostname || 'page';
            }
            catch {
                return 'page';
            }
        })();
        const result = main
            ? await electron_1.dialog.showSaveDialog(main, {
                defaultPath: path_1.default.join(electron_1.app.getPath('downloads'), `${suggested}.html`),
            })
            : await electron_1.dialog.showSaveDialog({
                defaultPath: path_1.default.join(electron_1.app.getPath('downloads'), `${suggested}.html`),
            });
        if (result.canceled || !result.filePath)
            return { ok: false };
        try {
            await wc.savePage(result.filePath, 'HTMLComplete');
            return { ok: true };
        }
        catch {
            return { ok: false };
        }
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.PAGE_DOWNLOAD_URL, (_event, { tabId, url }) => {
        const wc = getWc(tabId);
        if (wc && !wc.isDestroyed() && url)
            wc.downloadURL(url);
        return { ok: true };
    });
}
