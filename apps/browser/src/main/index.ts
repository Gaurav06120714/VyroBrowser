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

// Use a clean, real Chrome user-agent (drops the Electron/Vyro tokens and tracks
// the actual bundled Chromium version) for site compatibility.
{
  const chromeVersion = process.versions.chrome;
  const platformToken =
    process.platform === 'win32'
      ? 'Windows NT 10.0; Win64; x64'
      : process.platform === 'darwin'
        ? 'Macintosh; Intel Mac OS X 10_15_7'
        : 'X11; Linux x86_64';
  app.userAgentFallback = `Mozilla/5.0 (${platformToken}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}

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

  // Harden every embedded <webview> guest and route its popups into Vyro tabs.
  app.on('web-contents-created', (_e, contents) => {
    // Enforce a safe webPreferences baseline regardless of renderer attributes.
    contents.on('will-attach-webview', (_evt, webPreferences) => {
      webPreferences.nodeIntegration = false;
      (webPreferences as { nodeIntegrationInSubFrames?: boolean }).nodeIntegrationInSubFrames = false;
      webPreferences.contextIsolation = true;
    });

    if (contents.getType() !== 'webview') return;

    // window.open / target=_blank from a page opens a new Vyro tab.
    contents.setWindowOpenHandler(({ url }) => {
      const main = windowManager.getMain();
      if (main && !main.isDestroyed()) {
        main.webContents.send(IPC.WEBVIEW_NEW_WINDOW, { url });
      }
      return { action: 'deny' };
    });

    // Block navigation to non-web protocols (file://, custom schemes, etc.).
    contents.on('will-navigate', (event, url) => {
      if (!/^(https?|about|data|blob):/i.test(url)) event.preventDefault();
    });
  });

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
