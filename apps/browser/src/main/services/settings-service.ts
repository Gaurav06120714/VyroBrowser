import Database from 'better-sqlite3';
import { AppSettings, DEFAULT_SETTINGS } from '../../shared/types/settings';

export class SettingsService {
  constructor(private db: Database.Database) {}

  get(profileId: string): AppSettings {
    const rows = this.db
      .prepare('SELECT key, value FROM settings WHERE profile_id = ?')
      .all(profileId) as { key: string; value: string }[];

    const overrides: Partial<Record<string, unknown>> = {};
    for (const row of rows) {
      try {
        overrides[row.key] = JSON.parse(row.value);
      } catch {
        overrides[row.key] = row.value;
      }
    }

    return { ...DEFAULT_SETTINGS, ...(overrides as Partial<AppSettings>) };
  }

  set(profileId: string, partial: Partial<AppSettings>): void {
    const upsert = this.db.prepare(`
      INSERT INTO settings (profile_id, key, value)
      VALUES (?, ?, ?)
      ON CONFLICT (profile_id, key) DO UPDATE SET value = excluded.value
    `);

    const setMany = this.db.transaction((entries: [string, unknown][]) => {
      for (const [key, value] of entries) {
        upsert.run(profileId, key, JSON.stringify(value));
      }
    });

    setMany(Object.entries(partial));
  }
}
