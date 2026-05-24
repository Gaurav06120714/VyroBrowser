"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerShortcuts = registerShortcuts;
exports.unregisterShortcuts = unregisterShortcuts;
// ─────────────────────────────────────────────────────────────────────────────
// shortcuts.ts — Global keyboard shortcut registration.
//
// Uses Cmd on macOS and Ctrl on Windows/Linux for all shortcuts.
// Pushes shortcut:action events to the renderer so the existing
// handleShortcutAction() logic in App.tsx processes them.
// ─────────────────────────────────────────────────────────────────────────────
const electron_1 = require("electron");
const ipc_channels_1 = require("../shared/ipc-channels");
const mod = process.platform === 'darwin' ? 'Cmd' : 'Ctrl';
const SHORTCUTS = [
    { accelerator: `${mod}+T`, action: 'new-tab' },
    { accelerator: `${mod}+W`, action: 'close-tab' },
    { accelerator: `${mod}+R`, action: 'reload' },
    { accelerator: `${mod}+Shift+R`, action: 'hard-reload' },
    { accelerator: `${mod}+[`, action: 'go-back' },
    { accelerator: `${mod}+]`, action: 'go-forward' },
    { accelerator: `${mod}+F`, action: 'find' },
    { accelerator: `${mod}+Alt+I`, action: 'devtools' },
    { accelerator: `${mod}+L`, action: 'focus-address-bar' },
    { accelerator: `${mod}+K`, action: 'command-palette' },
    { accelerator: `${mod}+Shift+Left`, action: 'go-back' },
    { accelerator: `${mod}+Shift+Right`, action: 'go-forward' },
    // Tab switching
    { accelerator: `${mod}+Tab`, action: 'next-tab' },
    { accelerator: `${mod}+Shift+Tab`, action: 'prev-tab' },
];
let registered = false;
function registerShortcuts(window) {
    if (registered)
        return;
    registered = true;
    for (const { accelerator, action } of SHORTCUTS) {
        try {
            electron_1.globalShortcut.register(accelerator, () => {
                if (!window.isDestroyed()) {
                    window.webContents.send(ipc_channels_1.IPC.SHORTCUT_ACTION, action);
                }
            });
        }
        catch {
            // Some accelerators may conflict with OS-level shortcuts — skip silently
            console.warn(`[shortcuts] Could not register: ${accelerator}`);
        }
    }
}
function unregisterShortcuts() {
    electron_1.globalShortcut.unregisterAll();
    registered = false;
}
