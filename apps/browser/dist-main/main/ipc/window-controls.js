"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWindowControlsIpc = registerWindowControlsIpc;
// ─────────────────────────────────────────────────────────────────────────────
// window-controls.ts — Minimize / Maximize / Close IPC for Windows custom titlebar.
// Also pushes window:maximized / window:restored events to renderer.
// ─────────────────────────────────────────────────────────────────────────────
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
function registerWindowControlsIpc(wm) {
    electron_1.ipcMain.handle(ipc_channels_1.IPC.WINDOW_MINIMIZE, () => {
        wm.getMain()?.minimize();
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.WINDOW_MAXIMIZE, () => {
        const win = wm.getMain();
        if (!win)
            return;
        if (win.isMaximized()) {
            win.unmaximize();
        }
        else {
            win.maximize();
        }
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.WINDOW_CLOSE, () => {
        wm.getMain()?.close();
    });
    // Push maximized/restored state changes to the renderer
    function wireEvents(win) {
        win.on('maximize', () => {
            win.webContents.send(ipc_channels_1.IPC.WINDOW_MAXIMIZED);
        });
        win.on('unmaximize', () => {
            win.webContents.send(ipc_channels_1.IPC.WINDOW_RESTORED);
        });
        win.on('restore', () => {
            win.webContents.send(ipc_channels_1.IPC.WINDOW_RESTORED);
        });
    }
    // Wire to the current main window; re-wire if a new one is ever created.
    const existing = wm.getMain();
    if (existing)
        wireEvents(existing);
}
