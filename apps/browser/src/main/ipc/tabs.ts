import { ipcMain, webContents } from 'electron';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { IPC } from '../../shared/ipc-channels';
import { Tab, TabSnapshot } from '../../shared/types/tab';
import { WindowManager } from '../window-manager';
import { DEFAULT_PROFILE_ID, NEW_TAB_URL } from '../../shared/constants';
import { CrashRecoveryService } from '../services/crash-recovery';

// tabId → webContentsId mapping (populated when renderer registers a webview)
export const tabWebContentsMap = new Map<string, number>();

// In-memory tab list (truth is in renderer; main just tracks for nav routing)
const tabRegistry = new Map<string, Tab>();

// Track active tab for session saves
let activeTabIdCache = '';

function toSnapshot(tab: Tab): TabSnapshot {
  return {
    id: tab.id,
    url: tab.url,
    title: tab.title,
    isPinned: tab.isPinned,
    groupId: tab.groupId,
    profileId: tab.profileId,
  };
}

function saveSession(db: Database.Database, crashRecovery: CrashRecoveryService, profileId: string): void {
  const tabs = Array.from(tabRegistry.values())
    .filter(t => t.profileId === profileId)
    .map(toSnapshot);
  if (tabs.length === 0) return;
  crashRecovery.save(db, profileId, tabs, activeTabIdCache);
}

export function registerTabsIpc(db: Database.Database, wm: WindowManager, crashRecovery: CrashRecoveryService): void {
  // Internal: renderer registers webview webContentsId once dom-ready fires
  ipcMain.handle('webview:register', (_event, { tabId, webContentsId }: { tabId: string; webContentsId: number }) => {
    tabWebContentsMap.set(tabId, webContentsId);
    return { ok: true };
  });

  ipcMain.handle(IPC.TABS_CREATE, (_event, args?: Partial<Tab>) => {
    const tab: Tab = {
      id: uuidv4(),
      url: args?.url ?? NEW_TAB_URL,
      title: args?.title ?? 'New Tab',
      favicon: null,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      isPinned: args?.isPinned ?? false,
      groupId: args?.groupId ?? null,
      splitId: args?.splitId ?? null,
      profileId: args?.profileId ?? DEFAULT_PROFILE_ID,
      scrollY: 0,
      createdAt: Date.now(),
    };
    tabRegistry.set(tab.id, tab);
    saveSession(db, crashRecovery, tab.profileId);
    return tab;
  });

  ipcMain.handle(IPC.TABS_CLOSE, (_event, { tabId }: { tabId: string }) => {
    const tab = tabRegistry.get(tabId);
    const profileId = tab?.profileId ?? DEFAULT_PROFILE_ID;
    tabWebContentsMap.delete(tabId);
    tabRegistry.delete(tabId);
    saveSession(db, crashRecovery, profileId);
    return { ok: true };
  });

  ipcMain.handle(IPC.TABS_ACTIVATE, (_event, { tabId }: { tabId: string }) => {
    activeTabIdCache = tabId;
    const tab = tabRegistry.get(tabId);
    if (tab) saveSession(db, crashRecovery, tab.profileId);
    return { ok: true, tabId };
  });

  ipcMain.handle(IPC.TABS_REORDER, (_event, { tabIds }: { tabIds: string[] }) => {
    // Renderer handles reorder visually; main acknowledges
    return { ok: true, tabIds };
  });

  ipcMain.handle(IPC.TABS_PIN, (_event, { tabId, pinned }: { tabId: string; pinned: boolean }) => {
    const tab = tabRegistry.get(tabId);
    if (tab) {
      tab.isPinned = pinned;
      tabRegistry.set(tabId, tab);
    }
    return { ok: true };
  });

  ipcMain.handle(IPC.TABS_GROUP_CREATE, (_event, args: { name: string; color: string; tabIds: string[] }) => {
    const groupId = uuidv4();
    return { id: groupId, ...args, collapsed: false };
  });

  ipcMain.handle(IPC.TABS_GROUP_UPDATE, (_event, args: { id: string; name?: string; color?: string; collapsed?: boolean }) => {
    return { ok: true, ...args };
  });

  ipcMain.handle(IPC.TABS_GROUP_DELETE, (_event, { groupId }: { groupId: string }) => {
    return { ok: true, groupId };
  });

  ipcMain.handle(IPC.TABS_RESTORE_SESSION, (_event, { profileId }: { profileId: string }) => {
    return crashRecovery.restore(db, profileId);
  });

  ipcMain.handle(IPC.TABS_SPLIT_TOGGLE, (_event, { tabId }: { tabId: string }) => {
    return { ok: true, tabId };
  });

  ipcMain.handle(IPC.TABS_GET_ALL, () => {
    return Array.from(tabRegistry.values());
  });

  // Push navigation events from webview webContents to the renderer window
  // webContents events are wired up in navigation.ts after webview:register
}
