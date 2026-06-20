"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const app_management_1 = require("./ipc/app-management");
const ipc_channels_1 = require("../shared/ipc-channels");
electron_1.app.name = 'Vyro';
// Use a clean, real Chrome user-agent (drops the Electron/Vyro tokens and tracks
// the actual bundled Chromium version) for site compatibility.
{
    const chromeVersion = process.versions.chrome;
    const platformToken = process.platform === 'win32'
        ? 'Windows NT 10.0; Win64; x64'
        : process.platform === 'darwin'
            ? 'Macintosh; Intel Mac OS X 10_15_7'
            : 'X11; Linux x86_64';
    electron_1.app.userAgentFallback = `Mozilla/5.0 (${platformToken}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}
if (process.platform === 'win32') {
    electron_1.app.setAppUserModelId('com.vyro.browser');
}
if (process.platform === 'win32' && process.env.PORTABLE_EXECUTABLE_DIR) {
    const portableData = path_1.default.join(process.env.PORTABLE_EXECUTABLE_DIR, 'VyroData');
    electron_1.app.setPath('userData', portableData);
    electron_1.app.setPath('logs', path_1.default.join(portableData, 'logs'));
}
const gotLock = electron_1.app.requestSingleInstanceLock();
if (!gotLock) {
    electron_1.app.quit();
    process.exit(0);
}
let windowManager;
const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === '1';
const rendererUrl = isDev ? 'http://localhost:5173' : null;
const rendererFile = isDev
    ? null
    : path_1.default.join(electron_1.app.getAppPath(), 'dist-renderer/index.html');
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
electron_1.app.whenReady().then(async () => {
    (0, app_management_1.runStartupMigration)();
    const db = (0, db_1.getDb)();
    const profileService = new profile_service_1.ProfileService(db);
    await profileService.ensureDefault();
    windowManager = new window_manager_1.WindowManager();
    createWindow();
    (0, ipc_1.registerAllIpc)(db, windowManager);
    // Harden every embedded <webview> guest and route its popups into Vyro tabs.
    electron_1.app.on('web-contents-created', (_e, contents) => {
        // Enforce a safe webPreferences baseline regardless of renderer attributes.
        contents.on('will-attach-webview', (_evt, webPreferences) => {
            webPreferences.nodeIntegration = false;
            webPreferences.nodeIntegrationInSubFrames = false;
            webPreferences.contextIsolation = true;
        });
        if (contents.getType() !== 'webview')
            return;
        // window.open / target=_blank from a page opens a new Vyro tab.
        contents.setWindowOpenHandler(({ url }) => {
            const main = windowManager.getMain();
            if (main && !main.isDestroyed()) {
                main.webContents.send(ipc_channels_1.IPC.WEBVIEW_NEW_WINDOW, { url });
            }
            return { action: 'deny' };
        });
        // Block navigation to non-web protocols (file://, custom schemes, etc.).
        contents.on('will-navigate', (event, url) => {
            if (!/^(https?|about|data|blob):/i.test(url))
                event.preventDefault();
        });
    });
    const mainWin = windowManager.getMain();
    if (mainWin) {
        (0, shortcuts_1.registerShortcuts)(mainWin);
    }
    const defaultSession = electron_1.session.defaultSession;
    (0, request_filter_1.setupAdblocking)(defaultSession).catch(err => {
        console.error('Failed to initialize adblocker:', err);
    });
    defaultSession.on('will-download', (_event, item) => {
        const downloadService = (0, downloads_1.getDownloadService)();
        if (downloadService) {
            const profileId = profileService.getActive();
            downloadService.handleWillDownload(profileId, item);
        }
    });
    if (mainWin) {
        (0, updater_1.setupAutoUpdater)(mainWin);
    }
    (0, tray_1.createTray)(() => windowManager.getMain());
    if (process.platform === 'darwin') {
        const dockMenu = electron_1.Menu.buildFromTemplate([
            {
                label: 'New Window',
                click: () => createWindow(),
            },
            {
                label: 'New Tab',
                click: () => {
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
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
        else {
            windowManager?.focusMain();
        }
    });
});
electron_1.app.on('second-instance', () => {
    windowManager?.focusMain();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        (0, db_1.closeDb)();
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', () => {
    (0, shortcuts_1.unregisterShortcuts)();
    (0, tray_1.destroyTray)();
    (0, db_1.closeDb)();
});
