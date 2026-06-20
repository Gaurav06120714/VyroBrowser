"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowManager = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const STATE_FILE = () => path_1.default.join(electron_1.app.getPath('userData'), 'window-state.json');
function loadBounds() {
    try {
        const raw = fs_1.default.readFileSync(STATE_FILE(), 'utf8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function saveBounds(win) {
    try {
        const bounds = win.getBounds();
        fs_1.default.writeFileSync(STATE_FILE(), JSON.stringify(bounds), 'utf8');
    }
    catch {
    }
}
function ensureVisible(bounds) {
    const displays = electron_1.screen.getAllDisplays();
    const visible = displays.some(d => {
        const { x, y, width, height } = d.workArea;
        return (bounds.x < x + width &&
            bounds.x + bounds.width > x &&
            bounds.y < y + height &&
            bounds.y + bounds.height > y);
    });
    if (!visible) {
        const primary = electron_1.screen.getPrimaryDisplay().workArea;
        return {
            x: primary.x + 100,
            y: primary.y + 100,
            width: Math.min(bounds.width, primary.width - 200),
            height: Math.min(bounds.height, primary.height - 200),
        };
    }
    return bounds;
}
function getPlatformWindowOptions() {
    const platform = process.platform;
    if (platform === 'darwin') {
        return {
            titleBarStyle: 'hiddenInset',
            trafficLightPosition: { x: 16, y: 14 },
            vibrancy: 'under-window',
            visualEffectState: 'followWindow',
            backgroundColor: '#00000000',
            transparent: true,
        };
    }
    if (platform === 'win32') {
        return {
            titleBarStyle: 'hidden',
            backgroundColor: '#1a1a2e',
            transparent: false,
        };
    }
    return {
        frame: true,
        backgroundColor: '#1a1a2e',
        transparent: false,
    };
}
class WindowManager {
    mainWindow = null;
    createMain() {
        const saved = loadBounds();
        const bounds = saved ? ensureVisible(saved) : { x: undefined, y: undefined, width: 1280, height: 800 };
        const platformOptions = getPlatformWindowOptions();
        const win = new electron_1.BrowserWindow({
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            minWidth: 800,
            minHeight: 600,
            ...platformOptions,
            show: false,
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: false,
                webviewTag: true,
                preload: path_1.default.join(electron_1.app.getAppPath(), 'dist-main/main/preload/browser-preload.js'),
            },
        });
        win.once('ready-to-show', () => {
            win.show();
        });
        win.on('close', () => {
            saveBounds(win);
        });
        win.on('closed', () => {
            this.mainWindow = null;
        });
        const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === '1';
        const devCsp = "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* blob: data:; " +
            "connect-src 'self' http://localhost:* ws://localhost:*; " +
            "img-src 'self' data: https: http:; " +
            "font-src 'self' data:;";
        const prodCsp = "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' data:; " +
            "connect-src 'self'; " +
            "worker-src blob:;";
        const cspValue = isDev ? devCsp : prodCsp;
        electron_1.session.defaultSession.webRequest.onHeadersReceived({ urls: ['http://localhost:5173/*', 'file://*/*'] }, (details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [cspValue],
                },
            });
        });
        win.webContents.setWindowOpenHandler(({ url }) => {
            win.webContents.send('webview:new-window', { url });
            return { action: 'deny' };
        });
        this.mainWindow = win;
        return win;
    }
    getMain() {
        return this.mainWindow;
    }
    focusMain() {
        if (this.mainWindow) {
            if (this.mainWindow.isMinimized())
                this.mainWindow.restore();
            this.mainWindow.focus();
        }
    }
}
exports.WindowManager = WindowManager;
