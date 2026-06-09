import { app, BrowserWindow, Menu, session, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { getDb, closeDb } from './services/db';
import { WindowManager } from './window-manager';
import { registerAllIpc } from './ipc';
import { ProfileService } from './services/profile-service';
import { setupAdblocking } from './adblock/request-filter';
import { getDownloadService } from './ipc/downloads';
import { registerShortcuts, unregisterShortcuts } from './shortcuts';
import { createTray, destroyTray } from './tray';
import { setupAutoUpdater } from './updater';
import { runStartupMigration } from './ipc/app-management';
import { IPC } from '../shared/ipc-channels';

app.name = 'Vyro';

if (process.platform === 'win32') {
  app.setAppUserModelId('com.vyro.browser');
}

if (process.platform === 'win32' && process.env.PORTABLE_EXECUTABLE_DIR) {
  const portableData = path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'VyroData');
  app.setPath('userData', portableData);
  app.setPath('logs', path.join(portableData, 'logs'));
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); process.exit(0); }

let windowManager: WindowManager;

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === '1';
const rendererUrl = isDev ? 'http://localhost:5173' : null;
const rendererFile = isDev
  ? null
  : path.join(app.getAppPath(), 'dist-renderer/index.html');

function createWindow(): BrowserWindow {
  const win = windowManager.createMain();

  if (rendererUrl) {
    win.loadURL(rendererUrl).catch(console.error);
    win.webContents.openDevTools();
  } else {
    win.loadFile(rendererFile!).catch(console.error);
  }

  return win;
}

app.whenReady().then(async () => {
  
  runStartupMigration();

  const db = getDb();

  const profileService = new ProfileService(db);
  await profileService.ensureDefault();

  windowManager = new WindowManager();
  createWindow();

  registerAllIpc(db, windowManager);

  const mainWin = windowManager.getMain();
  if (mainWin) {
    registerShortcuts(mainWin);
  }

  const defaultSession = session.defaultSession;
  setupAdblocking(defaultSession).catch(err => {
    console.error('Failed to initialize adblocker:', err);
  });

  defaultSession.on('will-download', (_event, item) => {
    const downloadService = getDownloadService();
    if (downloadService) {
      const profileId = profileService.getActive();
      downloadService.handleWillDownload(profileId, item);
    }
  });

  if (mainWin) {
    setupAutoUpdater(mainWin);
  }

  createTray(() => windowManager.getMain());

  if (process.platform === 'darwin') {
    const dockMenu = Menu.buildFromTemplate([
      {
        label: 'New Window',
        click: () => createWindow(),
      },
      {
        label: 'New Tab',
        click: () => {
          
          const win = windowManager.getMain() ?? createWindow();
          if (win.isMinimized()) win.restore();
          win.focus();
          win.webContents.send('app:new-tab');
        },
      },
    ]);
    app.dock.setMenu(dockMenu);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      
      windowManager?.focusMain();
    }
  });
});

app.on('second-instance', () => {
  windowManager?.focusMain();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDb();
    app.quit();
  }
});

app.on('before-quit', () => {
  unregisterShortcuts();
  destroyTray();
  closeDb();
});
