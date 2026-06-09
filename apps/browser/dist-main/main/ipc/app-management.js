"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStartupMigration = runStartupMigration;
exports.registerAppManagementIpc = registerAppManagementIpc;

const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ipc_channels_1 = require("../../shared/ipc-channels");

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
                catch {  }
            }
        }
    }
    catch {  }
    return total;
}
function rmSafe(dirPath) {
    if (!fs_1.default.existsSync(dirPath))
        return;
    try {
        fs_1.default.rmSync(dirPath, { recursive: true, force: true });
    }
    catch {  }
}

function runStartupMigration() {
    const platform = process.platform;
    const oldNames = ['Electron', 'vyro-desktop', 'vyro-browser', 'VyroBrowser'];
    try {
        if (platform === 'darwin') {
            const base = path_1.default.join(electron_1.app.getPath('home'), 'Library', 'Application Support');
            for (const name of oldNames) {
                const old = path_1.default.join(base, name);
                if (fs_1.default.existsSync(old)) {
                    const vyroData = electron_1.app.getPath('userData'); 
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
        
    }
}

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
            catch {  }
        }
    }
}

function registerAppManagementIpc() {
    
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
    
    electron_1.ipcMain.handle(ipc_channels_1.IPC.APP_CLEAR_CACHE, async () => {
        try {
            const ses = electron_1.session.defaultSession;
            await ses.clearCache();
            await ses.clearStorageData({
                storages: ['serviceworkers', 'shadercache'],
            });
            
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
            
            electron_1.app.relaunch();
            electron_1.app.exit(0);
            return { ok: true };
        }
        catch (err) {
            return { ok: false, error: err?.message };
        }
    });
}
