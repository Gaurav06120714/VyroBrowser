"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowManager = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const electron_2 = require("electron");
const STATE_FILE = () => path_1.default.join(electron_2.app.getPath('userData'), 'window-state.json');
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
        // ignore
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
class WindowManager {
    mainWindow = null;
    createMain() {
        const saved = loadBounds();
        const bounds = saved ? ensureVisible(saved) : { x: undefined, y: undefined, width: 1280, height: 800 };
        const win = new electron_1.BrowserWindow({
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            minWidth: 800,
            minHeight: 600,
            titleBarStyle: 'hiddenInset',
            trafficLightPosition: { x: 14, y: 12 },
            backgroundColor: '#0f0f10',
            show: false,
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: false,
                webviewTag: true,
                preload: path_1.default.join(__dirname, 'preload/browser-preload.js'),
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
        win.webContents.setWindowOpenHandler(({ url }) => {
            // Block native new windows; let the renderer handle them via IPC
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
