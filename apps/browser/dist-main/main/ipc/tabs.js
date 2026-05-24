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
// Track active tab for session saves
let activeTabIdCache = '';
function toSnapshot(tab) {
    return {
        id: tab.id,
        url: tab.url,
        title: tab.title,
        isPinned: tab.isPinned,
        groupId: tab.groupId,
        profileId: tab.profileId,
    };
}
function saveSession(db, crashRecovery, profileId) {
    const tabs = Array.from(tabRegistry.values())
        .filter(t => t.profileId === profileId)
        .map(toSnapshot);
    if (tabs.length === 0)
        return;
    crashRecovery.save(db, profileId, tabs, activeTabIdCache);
}
function registerTabsIpc(db, wm, crashRecovery) {
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
        saveSession(db, crashRecovery, tab.profileId);
        return tab;
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_CLOSE, (_event, { tabId }) => {
        const tab = tabRegistry.get(tabId);
        const profileId = tab?.profileId ?? constants_1.DEFAULT_PROFILE_ID;
        exports.tabWebContentsMap.delete(tabId);
        tabRegistry.delete(tabId);
        saveSession(db, crashRecovery, profileId);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_ACTIVATE, (_event, { tabId }) => {
        activeTabIdCache = tabId;
        const tab = tabRegistry.get(tabId);
        if (tab)
            saveSession(db, crashRecovery, tab.profileId);
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
        return crashRecovery.restore(db, profileId);
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
