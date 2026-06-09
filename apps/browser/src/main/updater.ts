import { BrowserWindow, ipcMain } from 'electron';
import { IPC } from '../shared/ipc-channels';

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === '1';
  if (isDev) return;

  let updaterModule: Record<string, unknown>;
  try {
    updaterModule = require('electron-updater') as Record<string, unknown>;
  } catch {
    
    return;
  }

  const autoUpdater = updaterModule.autoUpdater as any;
  if (!autoUpdater) return;

  autoUpdater.logger = null;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  const push = (channel: string, payload: Record<string, unknown> = {}) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, payload);
    }
  };

  autoUpdater.on('update-available', (info: { version: string; releaseNotes?: string }) => {
    push(IPC.UPDATE_AVAILABLE, {
      version: info.version,
      releaseNotes: info.releaseNotes ?? null,
    });
  });

  autoUpdater.on('update-downloaded', () => {
    push(IPC.UPDATE_READY);
  });

  autoUpdater.on('error', (_err: Error) => {
    
  });

  ipcMain.handle(IPC.UPDATE_INSTALL, () => {
    try {
      autoUpdater.quitAndInstall();
    } catch {
      
    }
  });

  try {
    autoUpdater.checkForUpdates();
  } catch {
    
  }
}
