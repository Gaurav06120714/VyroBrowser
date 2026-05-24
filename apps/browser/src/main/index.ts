// ─────────────────────────────────────────────────────────────────────────────
// main/index.ts — Electron main process entry point.
//
// Startup sequence:
//   1. Request single-instance lock (quit if another instance is running).
//   2. app.whenReady() — init SQLite DB, ensure default profile exists.
//   3. Create the main BrowserWindow via WindowManager.
//   4. Register all IPC handlers (tabs, nav, history, bookmarks, AI, …).
//   5. Set up ad-blocking request filter on the default session.
//   6. Wire the download service to session will-download events.
//   7. Set up the macOS Dock menu.
//   8. Load renderer: Vite dev server in development, dist-renderer/ in prod.
//
// macOS lifecycle:
//   • window-all-closed — keep the app alive in the Dock (standard mac behaviour).
//     DB stays open so IPC handlers remain functional.
//   • activate — user clicks the Dock icon or opens from Finder; if no window
//     exists, create + load one so the app never appears "dead".
//   • before-quit — close the DB cleanly right before the process exits.
// ─────────────────────────────────────────────────────────────────────────────
import { app, BrowserWindow, Menu, session } from 'electron';
import path from 'path';
import { getDb, closeDb } from './services/db';
import { WindowManager } from './window-manager';
import { registerAllIpc } from './ipc';
import { ProfileService } from './services/profile-service';
import { setupAdblocking } from './adblock/request-filter';
import { getDownloadService } from './ipc/downloads';
import { registerShortcuts, unregisterShortcuts } from './shortcuts';
import { createTray, destroyTray } from './tray';

app.name = 'Vyro';

// ── Single instance lock ───────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); process.exit(0); }

let windowManager: WindowManager;

// Determine renderer URL once (used both on first launch and on re-activation)
const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === '1';
const rendererUrl = isDev ? 'http://localhost:5173' : null;
const rendererFile = isDev
  ? null
  : path.join(__dirname, '../../dist-renderer/index.html');

/** Create a browser window AND load the renderer into it. */
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

// ── App ready ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Init SQLite DB + migrations
  const db = getDb();

  // Ensure default profile row exists
  const profileService = new ProfileService(db);
  await profileService.ensureDefault();

  // Create WindowManager and open the first window
  windowManager = new WindowManager();
  createWindow();

  // Register all IPC handlers
  registerAllIpc(db, windowManager);

  // Register global keyboard shortcuts
  const mainWin = windowManager.getMain();
  if (mainWin) {
    registerShortcuts(mainWin);
  }

  // Ad-blocking on the default session
  const defaultSession = session.defaultSession;
  setupAdblocking(defaultSession).catch(err => {
    console.error('Failed to initialize adblocker:', err);
  });

  // Wire download service into session's will-download event
  defaultSession.on('will-download', (_event, item) => {
    const downloadService = getDownloadService();
    if (downloadService) {
      const profileId = profileService.getActive();
      downloadService.handleWillDownload(profileId, item);
    }
  });

  // ── System tray (Windows / Linux) ────────────────────────────────────────
  createTray(() => windowManager.getMain());

  // ── macOS Dock menu ──────────────────────────────────────────────────────
  // Right-clicking the Dock icon shows these options (Chrome/Brave style).
  if (process.platform === 'darwin') {
    const dockMenu = Menu.buildFromTemplate([
      {
        label: 'New Window',
        click: () => createWindow(),
      },
      {
        label: 'New Tab',
        click: () => {
          // Focus existing window and ask renderer to open a new tab
          const win = windowManager.getMain() ?? createWindow();
          if (win.isMinimized()) win.restore();
          win.focus();
          win.webContents.send('app:new-tab');
        },
      },
    ]);
    app.dock.setMenu(dockMenu);
  }

  // ── macOS: re-activate when user clicks Dock icon ─────────────────────
  // This fires when the app is in the Dock but has no open windows.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      // Bring the existing window to the front
      windowManager?.focusMain();
    }
  });
});

// ── Second instance ──────────────────────────────────────────────────────────
// User launched a second copy of the app — focus the existing window instead.
app.on('second-instance', () => {
  windowManager?.focusMain();
});

// ── window-all-closed ────────────────────────────────────────────────────────
// On macOS: keep the app alive in the Dock (standard behaviour — like Chrome).
// Do NOT close the DB here; the activate handler may need it to reopen a window.
// On other platforms: quit normally.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDb();
    app.quit();
  }
});

// ── before-quit ──────────────────────────────────────────────────────────────
// This fires right before the process exits on all platforms.
// Safe place to close the DB connection cleanly.
app.on('before-quit', () => {
  unregisterShortcuts();
  destroyTray();
  closeDb();
});
