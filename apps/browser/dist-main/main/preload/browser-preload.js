"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
const allowedInvoke = new Set([...ipc_channels_1.INVOKE_ALLOWLIST, 'shell:open-external']);
const allowedPush = new Set(ipc_channels_1.PUSH_ALLOWLIST);
electron_1.contextBridge.exposeInMainWorld('vyro', {
    invoke: (channel, ...args) => {
        if (!allowedInvoke.has(channel))
            throw new Error(`IPC invoke blocked: ${channel}`);
        return electron_1.ipcRenderer.invoke(channel, ...args);
    },
    on: (channel, listener) => {
        if (!allowedPush.has(channel))
            throw new Error(`IPC on blocked: ${channel}`);
        const wrapped = (_, ...args) => listener(...args);
        electron_1.ipcRenderer.on(channel, wrapped);
        return () => electron_1.ipcRenderer.removeListener(channel, wrapped);
    },
    off: (channel) => {
        electron_1.ipcRenderer.removeAllListeners(channel);
    },
    platform: process.platform,
});
