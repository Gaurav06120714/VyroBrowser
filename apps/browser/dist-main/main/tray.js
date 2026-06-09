"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTray = createTray;
exports.destroyTray = destroyTray;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let tray = null;

function getTrayIcon() {
    const base = path_1.default.join(__dirname, '../../assets');
    if (process.platform === 'win32') {
        
        try {
            const ico = path_1.default.join(base, 'icon.ico');
            if (fs_1.default.existsSync(ico)) {
                const img = electron_1.nativeImage.createFromPath(ico);
                if (!img.isEmpty())
                    return img;
            }
        }
        catch {
            
        }
    }
    if (process.platform === 'linux') {
        
        for (const size of [256, 48, 32, 16]) {
            try {
                const p = path_1.default.join(base, 'icons', `${size}x${size}.png`);
                if (fs_1.default.existsSync(p)) {
                    const img = electron_1.nativeImage.createFromPath(p);
                    if (!img.isEmpty())
                        return img.resize({ width: 22, height: 22 });
                }
            }
            catch {
                
            }
        }
        
        return electron_1.nativeImage.createEmpty();
    }
    
    try {
        const png32 = path_1.default.join(base, 'icons', '32x32.png');
        if (fs_1.default.existsSync(png32)) {
            const img32 = electron_1.nativeImage.createFromPath(png32);
            if (!img32.isEmpty())
                return img32.resize({ width: 22, height: 22 });
        }
    }
    catch {
        
    }
    
    try {
        const iconPng = path_1.default.join(base, 'icon.png');
        if (fs_1.default.existsSync(iconPng)) {
            return electron_1.nativeImage.createFromPath(iconPng).resize({ width: 22, height: 22 });
        }
    }
    catch {
        
    }
    return electron_1.nativeImage.createEmpty();
}
function createTray(getWindow) {
    if (process.platform !== 'win32' && process.platform !== 'linux')
        return;
    if (tray)
        return;
    let icon;
    try {
        icon = getTrayIcon();
    }
    catch {
        icon = electron_1.nativeImage.createEmpty();
    }
    try {
        tray = new electron_1.Tray(icon);
    }
    catch (err) {
        
        console.warn('Failed to create system tray:', err);
        return;
    }
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
