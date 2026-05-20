"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const settings_1 = require("../../shared/types/settings");
class SettingsService {
    db;
    constructor(db) {
        this.db = db;
    }
    get(profileId) {
        const rows = this.db
            .prepare('SELECT key, value FROM settings WHERE profile_id = ?')
            .all(profileId);
        const overrides = {};
        for (const row of rows) {
            try {
                overrides[row.key] = JSON.parse(row.value);
            }
            catch {
                overrides[row.key] = row.value;
            }
        }
        return { ...settings_1.DEFAULT_SETTINGS, ...overrides };
    }
    set(profileId, partial) {
        const upsert = this.db.prepare(`
      INSERT INTO settings (profile_id, key, value)
      VALUES (?, ?, ?)
      ON CONFLICT (profile_id, key) DO UPDATE SET value = excluded.value
    `);
        const setMany = this.db.transaction((entries) => {
            for (const [key, value] of entries) {
                upsert.run(profileId, key, JSON.stringify(value));
            }
        });
        setMany(Object.entries(partial));
    }
}
exports.SettingsService = SettingsService;
