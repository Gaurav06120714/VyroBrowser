"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAutoUpdater = setupAutoUpdater;
// ─────────────────────────────────────────────────────────────────────────────
// updater.ts — electron-updater integration for GitHub Releases.
//
// Only runs in production. In dev mode this is a no-op.
// Push events sent to renderer:
//   UPDATE_AVAILABLE  — { version, releaseNotes }
//   UPDATE_READY      — {} (download complete, ready to install)
//
// Renderer invokes UPDATE_INSTALL to trigger quitAndInstall().
// ─────────────────────────────────────────────────────────────────────────────
const electron_1 = require("electron");
const ipc_channels_1 = require("../shared/ipc-channels");
function setupAutoUpdater(mainWindow) {
    const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === '1';
    if (isDev)
        return;
    // Lazy-require so that missing electron-updater in dev doesn't crash.
    // We use require() with unknown type to avoid compile-time dependency.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    let updaterModule;
    try {
        updaterModule = require('electron-updater');
    }
    catch {
        // electron-updater not installed — skip silently
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const autoUpdater = updaterModule.autoUpdater;
    if (!autoUpdater)
        return;
    // Suppress verbose logging in production
    autoUpdater.logger = null;
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    const push = (channel, payload = {}) => {
        if (!mainWindow.isDestroyed()) {
            mainWindow.webContents.send(channel, payload);
        }
    };
    autoUpdater.on('update-available', (info) => {
        push(ipc_channels_1.IPC.UPDATE_AVAILABLE, {
            version: info.version,
            releaseNotes: info.releaseNotes ?? null,
        });
    });
    autoUpdater.on('update-downloaded', () => {
        push(ipc_channels_1.IPC.UPDATE_READY);
    });
    autoUpdater.on('error', (_err) => {
        // Silent — update errors should not crash or disturb the user
    });
    // Register the install handler once globally
    electron_1.ipcMain.handle(ipc_channels_1.IPC.UPDATE_INSTALL, () => {
        try {
            autoUpdater.quitAndInstall();
        }
        catch {
            // ignore
        }
    });
    // Kick off the update check
    try {
        autoUpdater.checkForUpdates();
    }
    catch {
        // silent
    }
}
