"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tabWebContentsMap = void 0;
exports.registerTabsIpc = registerTabsIpc;
const electron_1 = require("electron");
const uuid_1 = require("uuid");
const ipc_channels_1 = require("../../shared/ipc-channels");
const constants_1 = require("../../shared/constants");
exports.tabWebContentsMap = new Map();
function registerTabsIpc(db, wm, crashRecovery) {
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
            lastActiveAt: Date.now(),
            asleep: false,
        };
        return tab;
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_CLOSE, (_event, { tabId }) => {
        exports.tabWebContentsMap.delete(tabId);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_ACTIVATE, (_event, { tabId }) => {
        return { ok: true, tabId };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_REORDER, (_event, { tabIds }) => {
        return { ok: true, tabIds };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_PIN, (_event, { tabId, pinned }) => {
        return { ok: true, tabId, pinned };
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
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_SAVE_SESSION, (_event, { profileId, tabs, activeTabId }) => {
        if (Array.isArray(tabs) && tabs.length > 0) {
            crashRecovery.save(db, profileId, tabs, activeTabId ?? '');
        }
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.TABS_GET_ALL, () => {
        return [];
    });
}
