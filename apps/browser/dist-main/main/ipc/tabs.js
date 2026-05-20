"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tabWebContentsMap = void 0;
exports.registerTabsIpc = registerTabsIpc;
const electron_1 = require("electron");
const uuid_1 = require("uuid");
const ipc_channels_1 = require("../../shared/ipc-channels");
const constants_1 = require("../../shared/constants");
// tabId → webContentsId mapping (populated when renderer registers a webview)
exports.tabWebContentsMap = new Map();
// In-memory tab list (truth is in renderer; main just tracks for nav routing)
const tabRegistry = new Map();
function registerTabsIpc(_db, wm) {
    // Internal: renderer registers webview webContentsId once dom-ready fires
    electron_1.ipcMain.handle('webview:register', (_event, { tabId, webContentsId }) => {
        exports.tabWebContentsMap.set(tabId, webContentsId);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_CREATE, (_event, args) => {
        const tab = {
            id: (0, uuid_1.v4)(),
            url: args?.url ?? constants_1.NEW_TAB_URL,
            title: args?.title ?? 'New Tab',
            favicon: null,
            isLoading: false,
            canGoBack: false,
            canGoForward: false,
            isPinned: args?.isPinned ?? false,
            groupId: args?.groupId ?? null,
            splitId: args?.splitId ?? null,
            profileId: args?.profileId ?? constants_1.DEFAULT_PROFILE_ID,
            scrollY: 0,
            createdAt: Date.now(),
        };
        tabRegistry.set(tab.id, tab);
        return tab;
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_CLOSE, (_event, { tabId }) => {
        exports.tabWebContentsMap.delete(tabId);
        tabRegistry.delete(tabId);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_ACTIVATE, (_event, { tabId }) => {
        // Renderer manages active tab state; main just acknowledges
        return { ok: true, tabId };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_REORDER, (_event, { tabIds }) => {
        // Renderer handles reorder visually; main acknowledges
        return { ok: true, tabIds };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_PIN, (_event, { tabId, pinned }) => {
        const tab = tabRegistry.get(tabId);
        if (tab) {
            tab.isPinned = pinned;
            tabRegistry.set(tabId, tab);
        }
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_GROUP_CREATE, (_event, args) => {
        const groupId = (0, uuid_1.v4)();
        return { id: groupId, ...args, collapsed: false };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_GROUP_UPDATE, (_event, args) => {
        return { ok: true, ...args };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_GROUP_DELETE, (_event, { groupId }) => {
        return { ok: true, groupId };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_RESTORE_SESSION, (_event, { profileId }) => {
        // Session restore logic is in crash-recovery service; renderer calls this
        // and main returns saved session state (handled via crash recovery)
        return null;
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_SPLIT_TOGGLE, (_event, { tabId }) => {
        return { ok: true, tabId };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_GET_ALL, () => {
        return Array.from(tabRegistry.values());
    });
    // Push navigation events from webview webContents to the renderer window
    // webContents events are wired up in navigation.ts after webview:register
}
