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
    /** Write an arbitrary key/value (used for adblock site rules and similar). */
    setRaw(profileId, key, value) {
        this.db.prepare(`
      INSERT INTO settings (profile_id, key, value)
      VALUES (?, ?, ?)
      ON CONFLICT (profile_id, key) DO UPDATE SET value = excluded.value
    `).run(profileId, key, JSON.stringify(value));
    }
    /** Return all keys that start with the given prefix, as key→parsed-value map. */
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
