import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { IPC } from '../../shared/ipc-channels';
import { HistoryService } from '../services/history-service';
import { ProfileService } from '../services/profile-service';

export function registerHistoryIpc(db: Database.Database): void {
  const historyService = new HistoryService(db);
  const profileService = new ProfileService(db);

  ipcMain.handle(IPC.HISTORY_SEARCH, (_event, { query, limit, offset }: { query: string; limit?: number; offset?: number }) => {
    const profileId = profileService.getActive();
    return historyService.search(profileId, query ?? '', limit, offset);
  });

  ipcMain.handle(IPC.HISTORY_ADD, (_event, { url, title, favicon }: { url: string; title: string; favicon?: string }) => {
    const profileId = profileService.getActive();
    historyService.add(profileId, url, title, favicon);
    return { ok: true };
  });

  ipcMain.handle(IPC.HISTORY_DELETE, (_event, { id }: { id: number }) => {
    historyService.delete(id);
    return { ok: true };
  });

  ipcMain.handle(IPC.HISTORY_CLEAR_RANGE, (_event, { from, to }: { from: number; to: number }) => {
    const profileId = profileService.getActive();
    historyService.clearRange(profileId, from, to);
    return { ok: true };
  });

  ipcMain.handle(IPC.HISTORY_CLEAR_ALL, () => {
    const profileId = profileService.getActive();
    historyService.clearAll(profileId);
    return { ok: true };
  });
}
