import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { IPC } from '../../shared/ipc-channels';
import { SettingsService } from '../services/settings-service';
import { AppSettings } from '../../shared/types/settings';
import { SettingsGetSchema, SettingsSetSchema } from './validators';
import { setHttpsOnly } from '../https-only';
import { DEFAULT_PROFILE_ID } from '../../shared/constants';

export function registerSettingsIpc(db: Database.Database): void {
  const settingsService = new SettingsService(db);

  // Initialize HTTPS-only mode from the persisted default-profile setting.
  setHttpsOnly(settingsService.get(DEFAULT_PROFILE_ID).httpsOnly);

  ipcMain.handle(IPC.SETTINGS_GET, (_event, args: unknown) => {
    const parsed = SettingsGetSchema.safeParse(args);
    if (!parsed.success) return { error: 'Invalid arguments' };
    return settingsService.get(parsed.data.profileId);
  });

  ipcMain.handle(IPC.SETTINGS_SET, (_event, args: unknown) => {
    const parsed = SettingsSetSchema.safeParse(args);
    if (!parsed.success) return { error: 'Invalid arguments' };
    const { profileId, settings } = parsed.data;
    settingsService.set(profileId, settings as Partial<AppSettings>);
    const next = settings as Partial<AppSettings>;
    if (typeof next.httpsOnly === 'boolean') setHttpsOnly(next.httpsOnly);
    return { ok: true };
  });
}
