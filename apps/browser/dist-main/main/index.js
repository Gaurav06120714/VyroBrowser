"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const db_1 = require("./services/db");
const window_manager_1 = require("./window-manager");
const ipc_1 = require("./ipc");
const profile_service_1 = require("./services/profile-service");
const request_filter_1 = require("./adblock/request-filter");
const downloads_1 = require("./ipc/downloads");
const shortcuts_1 = require("./shortcuts");
const tray_1 = require("./tray");
const updater_1 = require("./updater");
electron_1.app.name = 'Vyro';
// ── Single instance lock ───────────────────────────────────────────────────
const gotLock = electron_1.app.requestSingleInstanceLock();
if (!gotLock) {
    electron_1.app.quit();
    process.exit(0);
}
let windowManager;
// Determine renderer URL once (used both on first launch and on re-activation)
const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === '1';
const rendererUrl = isDev ? 'http://localhost:5173' : null;
const rendererFile = isDev
    ? null
    : path_1.default.join(electron_1.app.getAppPath(), 'dist-renderer/index.html');
/** Create a browser window AND load the renderer into it. */
function createWindow() {
    const win = windowManager.createMain();
    if (rendererUrl) {
        win.loadURL(rendererUrl).catch(console.error);
        win.webContents.openDevTools();
    }
    else {
        win.loadFile(rendererFile).catch(console.error);
    }
    return win;
}
// ── App ready ─────────────────────────────────────────────────────────────
electron_1.app.whenReady().then(async () => {
    // Init SQLite DB + migrations
    const db = (0, db_1.getDb)();
    // Ensure default profile row exists
    const profileService = new profile_service_1.ProfileService(db);
    await profileService.ensureDefault();
    // Create WindowManager and open the first window
    windowManager = new window_manager_1.WindowManager();
    createWindow();
    // Register all IPC handlers
    (0, ipc_1.registerAllIpc)(db, windowManager);
    // Register global keyboard shortcuts
    const mainWin = windowManager.getMain();
    if (mainWin) {
        (0, shortcuts_1.registerShortcuts)(mainWin);
    }
    // Ad-blocking on the default session
    const defaultSession = electron_1.session.defaultSession;
    (0, request_filter_1.setupAdblocking)(defaultSession).catch(err => {
        console.error('Failed to initialize adblocker:', err);
    });
    // Wire download service into session's will-download event
    defaultSession.on('will-download', (_event, item) => {
        const downloadService = (0, downloads_1.getDownloadService)();
        if (downloadService) {
            const profileId = profileService.getActive();
            downloadService.handleWillDownload(profileId, item);
        }
    });
    // ── Auto-updater (production only) ──────────────────────────────────────
    if (mainWin) {
        (0, updater_1.setupAutoUpdater)(mainWin);
    }
    // ── System tray (Windows / Linux) ────────────────────────────────────────
    (0, tray_1.createTray)(() => windowManager.getMain());
    // ── macOS Dock menu ──────────────────────────────────────────────────────
    // Right-clicking the Dock icon shows these options (Chrome/Brave style).
    if (process.platform === 'darwin') {
        const dockMenu = electron_1.Menu.buildFromTemplate([
            {
                label: 'New Window',
                click: () => createWindow(),
            },
            {
                label: 'New Tab',
                click: () => {
                    // Focus existing window and ask renderer to open a new tab
                    const win = windowManager.getMain() ?? createWindow();
                    if (win.isMinimized())
                        win.restore();
                    win.focus();
                    win.webContents.send('app:new-tab');
                },
            },
        ]);
        electron_1.app.dock.setMenu(dockMenu);
    }
    // ── macOS: re-activate when user clicks Dock icon ─────────────────────
    // This fires when the app is in the Dock but has no open windows.
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
        else {
            // Bring the existing window to the front
            windowManager?.focusMain();
        }
    });
});
// ── Second instance ──────────────────────────────────────────────────────────
// User launched a second copy of the app — focus the existing window instead.
electron_1.app.on('second-instance', () => {
    windowManager?.focusMain();
});
// ── window-all-closed ────────────────────────────────────────────────────────
// On macOS: keep the app alive in the Dock (standard behaviour — like Chrome).
// Do NOT close the DB here; the activate handler may need it to reopen a window.
// On other platforms: quit normally.
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        (0, db_1.closeDb)();
        electron_1.app.quit();
    }
});
// ── before-quit ──────────────────────────────────────────────────────────────
// This fires right before the process exits on all platforms.
// Safe place to close the DB connection cleanly.
electron_1.app.on('before-quit', () => {
    (0, shortcuts_1.unregisterShortcuts)();
    (0, tray_1.destroyTray)();
    (0, db_1.closeDb)();
});
