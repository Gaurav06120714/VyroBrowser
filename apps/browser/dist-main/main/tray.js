"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTray = createTray;
exports.destroyTray = destroyTray;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
let tray = null;
/** Resolve the best tray icon for the current platform and DPI. */
function getTrayIcon() {
    const base = path_1.default.join(__dirname, '../../assets');
    if (process.platform === 'win32') {
        // Windows: use .ico — Windows scales it automatically for all DPIs
        const ico = path_1.default.join(base, 'icon.ico');
        const img = electron_1.nativeImage.createFromPath(ico);
        if (!img.isEmpty())
            return img;
    }
    // Linux / macOS fallback: use the 32px PNG (tray icons are ~22–24px rendered)
    const png32 = path_1.default.join(base, 'icons', '32x32.png');
    const img32 = electron_1.nativeImage.createFromPath(png32);
    if (!img32.isEmpty())
        return img32.resize({ width: 22, height: 22 });
    // Ultimate fallback: resize icon.png
    const fallback = electron_1.nativeImage
        .createFromPath(path_1.default.join(base, 'icon.png'))
        .resize({ width: 22, height: 22 });
    return fallback;
}
function createTray(getWindow) {
    if (process.platform !== 'win32' && process.platform !== 'linux')
        return;
    if (tray)
        return;
    tray = new electron_1.Tray(getTrayIcon());
    tray.setToolTip('Vyro Browser');
    const rebuild = () => {
        const win = getWindow();
        const isVisible = win?.isVisible() ?? false;
        const menu = electron_1.Menu.buildFromTemplate([
            {
                label: isVisible ? 'Hide Vyro' : 'Show Vyro',
                click: () => {
                    const w = getWindow();
                    if (!w)
                        return;
                    if (w.isVisible()) {
                        w.hide();
                    }
                    else {
                        w.show();
                        w.focus();
                    }
                    rebuild();
                },
            },
            { type: 'separator' },
            {
                label: 'New Tab',
                click: () => {
                    const w = getWindow();
                    if (!w)
                        return;
                    w.show();
                    w.focus();
                    w.webContents.send('app:new-tab');
                },
            },
            {
                label: 'New Window',
                click: () => {
                    const w = getWindow();
                    if (w) {
                        w.show();
                        w.focus();
                    }
                },
            },
            { type: 'separator' },
            { label: 'Quit Vyro', click: () => electron_1.app.quit() },
        ]);
        tray.setContextMenu(menu);
    };
    rebuild();
    tray.on('click', () => {
        const w = getWindow();
        if (!w)
            return;
        if (w.isVisible()) {
            w.focus();
        }
        else {
            w.show();
            w.focus();
        }
        rebuild();
    });
    tray.on('double-click', () => {
        const w = getWindow();
        if (!w)
            return;
        w.show();
        w.focus();
    });
}
function destroyTray() {
    tray?.destroy();
    tray = null;
}
