"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStartupMigration = runStartupMigration;
exports.registerAppManagementIpc = registerAppManagementIpc;
// ─────────────────────────────────────────────────────────────────────────────
// app-management.ts — Cache cleanup, reset, version info, and migration IPC.
// ─────────────────────────────────────────────────────────────────────────────
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ipc_channels_1 = require("../../shared/ipc-channels");
// ── Helpers ───────────────────────────────────────────────────────────────────
function getDirSizeSync(dirPath) {
    if (!fs_1.default.existsSync(dirPath))
        return 0;
    let total = 0;
    try {
        for (const entry of fs_1.default.readdirSync(dirPath, { withFileTypes: true })) {
            const full = path_1.default.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                total += getDirSizeSync(full);
            }
            else {
                try {
                    total += fs_1.default.statSync(full).size;
                }
                catch { /* skip */ }
            }
        }
    }
    catch { /* skip unreadable dirs */ }
    return total;
}
function rmSafe(dirPath) {
    if (!fs_1.default.existsSync(dirPath))
        return;
    try {
        fs_1.default.rmSync(dirPath, { recursive: true, force: true });
    }
    catch { /* ignore */ }
}
// ── Migration: clean up old app identity remnants ─────────────────────────────
// Called once on startup. Removes old "Electron", "vyro-desktop", "vyro-browser"
// userData folders that earlier builds may have created.
function runStartupMigration() {
    const platform = process.platform;
    const oldNames = ['Electron', 'vyro-desktop', 'vyro-browser', 'VyroBrowser'];
    try {
        if (platform === 'darwin') {
            const base = path_1.default.join(electron_1.app.getPath('home'), 'Library', 'Application Support');
            for (const name of oldNames) {
                const old = path_1.default.join(base, name);
                if (fs_1.default.existsSync(old)) {
                    const vyroData = electron_1.app.getPath('userData'); // ~/Library/Application Support/Vyro
                    _migrateUserData(old, vyroData);
                    rmSafe(old);
                }
            }
        }
        else if (platform === 'win32') {
            const appData = process.env.APPDATA || '';
            const localAppData = process.env.LOCALAPPDATA || '';
            for (const name of oldNames) {
                rmSafe(path_1.default.join(appData, name));
                rmSafe(path_1.default.join(localAppData, name));
            }
        }
        else {
            const base = path_1.default.join(electron_1.app.getPath('home'), '.config');
            for (const name of oldNames) {
                rmSafe(path_1.default.join(base, name));
            }
        }
    }
    catch {
        // Migration errors are non-fatal
    }
}
// Only migrate SQLite DB and window-state — never migrate GPU/code cache
function _migrateUserData(oldDir, newDir) {
    const filesToMigrate = ['vyro.db', 'window-state.json', 'active-profile.txt'];
    for (const file of filesToMigrate) {
        const src = path_1.default.join(oldDir, file);
        const dst = path_1.default.join(newDir, file);
        if (fs_1.default.existsSync(src) && !fs_1.default.existsSync(dst)) {
            try {
                fs_1.default.mkdirSync(path_1.default.dirname(dst), { recursive: true });
                fs_1.default.copyFileSync(src, dst);
            }
            catch { /* skip */ }
        }
    }
}
// ── IPC Handlers ──────────────────────────────────────────────────────────────
function registerAppManagementIpc() {
    // Get app version info
    electron_1.ipcMain.handle(ipc_channels_1.IPC.APP_GET_VERSION, () => ({
        version: electron_1.app.getVersion(),
        name: electron_1.app.getName(),
        appId: 'com.vyro.browser',
        platform: process.platform,
        arch: process.arch,
        electron: process.versions.electron,
        node: process.versions.node,
        chrome: process.versions.chrome,
        userData: electron_1.app.getPath('userData'),
    }));
    // Get cache size (userData total, useful for "Clear Cache" UI)
    electron_1.ipcMain.handle(ipc_channels_1.IPC.APP_GET_CACHE_SIZE, () => {
        const userData = electron_1.app.getPath('userData');
        const cacheDirs = ['Cache', 'Code Cache', 'GPUCache', 'DawnGraphiteCache',
            'DawnWebGPUCache', 'blob_storage', 'Service Worker'];
        let totalBytes = 0;
        for (const dir of cacheDirs) {
            totalBytes += getDirSizeSync(path_1.default.join(userData, dir));
        }
        return { bytes: totalBytes, mb: (totalBytes / 1024 / 1024).toFixed(1) };
    });
    // Clear browser cache (Cache, Code Cache, Service Worker) — keeps user data
    electron_1.ipcMain.handle(ipc_channels_1.IPC.APP_CLEAR_CACHE, async () => {
        try {
            const ses = electron_1.session.defaultSession;
            await ses.clearCache();
            await ses.clearStorageData({
                storages: ['serviceworkers', 'shadercache'],
            });
            // Also wipe disk cache dirs for Electron's internal caches
            const userData = electron_1.app.getPath('userData');
            const wipeDirs = ['Cache', 'Code Cache', 'blob_storage'];
            for (const d of wipeDirs)
                rmSafe(path_1.default.join(userData, d));
            return { ok: true };
        }
        catch (err) {
            return { ok: false, error: err?.message };
        }
    });
    // Clear GPU cache only (fixes rendering glitches on driver updates)
    electron_1.ipcMain.handle(ipc_channels_1.IPC.APP_CLEAR_GPU_CACHE, async () => {
        try {
            const userData = electron_1.app.getPath('userData');
            const gpuDirs = ['GPUCache', 'DawnGraphiteCache', 'DawnWebGPUCache'];
            for (const d of gpuDirs)
                rmSafe(path_1.default.join(userData, d));
            return { ok: true };
        }
        catch (err) {
            return { ok: false, error: err?.message };
        }
    });
    // Full reset — clears ALL session data + cache, keeps only vyro.db
    // The app restarts automatically after reset.
    electron_1.ipcMain.handle(ipc_channels_1.IPC.APP_RESET, async () => {
        try {
            const ses = electron_1.session.defaultSession;
            await ses.clearCache();
            await ses.clearStorageData();
            const userData = electron_1.app.getPath('userData');
            const keepFiles = new Set(['vyro.db', 'vyro.db-shm', 'vyro.db-wal',
                'active-profile.txt', 'window-state.json']);
            const entries = fs_1.default.readdirSync(userData);
            for (const entry of entries) {
                if (!keepFiles.has(entry)) {
                    rmSafe(path_1.default.join(userData, entry));
                }
            }
            // Restart the app
            electron_1.app.relaunch();
            electron_1.app.exit(0);
            return { ok: true };
        }
        catch (err) {
            return { ok: false, error: err?.message };
        }
    });
}
