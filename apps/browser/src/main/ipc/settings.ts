import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { IPC } from '../../shared/ipc-channels';
import { SettingsService } from '../services/settings-service';
import { AppSettings } from '../../shared/types/settings';

export function registerSettingsIpc(db: Database.Database): void {
  const settingsService = new SettingsService(db);

  ipcMain.handle(IPC.SETTINGS_GET, (_event, { profileId }: { profileId: string }) => {
    return settingsService.get(profileId);
  });

  ipcMain.handle(IPC.SETTINGS_SET, (_event, { profileId, settings }: { profileId: string; settings: Partial<AppSettings> }) => {
    settingsService.set(profileId, settings);
    return { ok: true };
  });
}
