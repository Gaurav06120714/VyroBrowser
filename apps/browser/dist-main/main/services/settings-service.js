"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const settings_1 = require("../../shared/types/settings");
const sync_service_1 = require("./sync-service");
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
                const serialized = JSON.stringify(value);
                upsert.run(profileId, key, serialized);
                (0, sync_service_1.syncSettingsSet)(profileId, key, serialized);
            }
        });
        setMany(Object.entries(partial));
    }
    setRaw(profileId, key, value) {
        const serialized = JSON.stringify(value);
        this.db.prepare(`
      INSERT INTO settings (profile_id, key, value)
      VALUES (?, ?, ?)
      ON CONFLICT (profile_id, key) DO UPDATE SET value = excluded.value
    `).run(profileId, key, serialized);
        (0, sync_service_1.syncSettingsSet)(profileId, key, serialized);
    }
    getAllByPrefix(profileId, prefix) {
        const rows = this.db
            .prepare('SELECT key, value FROM settings WHERE profile_id = ? AND key LIKE ?')
            .all(profileId, `${prefix}%`);
        const result = {};
        for (const row of rows) {
            try {
                result[row.key] = JSON.parse(row.value);
            }
            catch {
                result[row.key] = row.value;
            }
        }
        return result;
    }
}
exports.SettingsService = SettingsService;
