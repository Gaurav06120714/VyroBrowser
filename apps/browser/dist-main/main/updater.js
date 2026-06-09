"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAutoUpdater = setupAutoUpdater;

const electron_1 = require("electron");
const ipc_channels_1 = require("../shared/ipc-channels");
function setupAutoUpdater(mainWindow) {
    const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === '1';
    if (isDev)
        return;
    
    let updaterModule;
    try {
        updaterModule = require('electron-updater');
    }
    catch {
        
        return;
    }
    
    const autoUpdater = updaterModule.autoUpdater;
    if (!autoUpdater)
        return;
    
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
        
    });
    
    electron_1.ipcMain.handle(ipc_channels_1.IPC.UPDATE_INSTALL, () => {
        try {
            autoUpdater.quitAndInstall();
        }
        catch {
            
        }
    });
    
    try {
        autoUpdater.checkForUpdates();
    }
    catch {
        
    }
}
