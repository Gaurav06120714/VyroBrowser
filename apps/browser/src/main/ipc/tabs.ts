import { ipcMain, webContents } from 'electron';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { IPC } from '../../shared/ipc-channels';
import { Tab, TabSnapshot } from '../../shared/types/tab';
import { WindowManager } from '../window-manager';
import { DEFAULT_PROFILE_ID, NEW_TAB_URL } from '../../shared/constants';
import { CrashRecoveryService } from '../services/crash-recovery';

export const tabWebContentsMap = new Map<string, number>();

export function registerTabsIpc(db: Database.Database, wm: WindowManager, crashRecovery: CrashRecoveryService): void {
  
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
    return tab;
  });

  ipcMain.handle(IPC.TABS_CLOSE, (_event, { tabId }: { tabId: string }) => {
    tabWebContentsMap.delete(tabId);
    return { ok: true };
  });

  ipcMain.handle(IPC.TABS_ACTIVATE, (_event, { tabId }: { tabId: string }) => {
    return { ok: true, tabId };
  });

  ipcMain.handle(IPC.TABS_REORDER, (_event, { tabIds }: { tabIds: string[] }) => {
    return { ok: true, tabIds };
  });

  ipcMain.handle(IPC.TABS_PIN, (_event, { tabId, pinned }: { tabId: string; pinned: boolean }) => {
    return { ok: true, tabId, pinned };
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

  ipcMain.handle(IPC.TABS_SAVE_SESSION, (
    _event,
    { profileId, tabs, activeTabId }: { profileId: string; tabs: TabSnapshot[]; activeTabId: string }
  ) => {
    if (Array.isArray(tabs) && tabs.length > 0) {
      crashRecovery.save(db, profileId, tabs, activeTabId ?? '');
    }
    return { ok: true };
  });

  ipcMain.handle(IPC.TABS_GET_ALL, () => {
    return [];
  });
}
