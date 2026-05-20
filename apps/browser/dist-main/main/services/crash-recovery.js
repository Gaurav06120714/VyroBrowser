"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrashRecoveryService = void 0;
class CrashRecoveryService {
    save(db, profileId, tabs, activeTabId) {
        const state = {
            tabs,
            activeTabId,
            profileId,
            savedAt: Math.floor(Date.now() / 1000),
        };
        db.prepare(`
      INSERT INTO session_state (profile_id, state_json, saved_at)
      VALUES (?, ?, unixepoch())
      ON CONFLICT (profile_id) DO UPDATE SET state_json = excluded.state_json, saved_at = excluded.saved_at
    `).run(profileId, JSON.stringify(state));
    }
    restore(db, profileId) {
        const row = db
            .prepare('SELECT state_json FROM session_state WHERE profile_id = ?')
            .get(profileId);
        if (!row)
            return null;
        try {
            return JSON.parse(row.state_json);
        }
        catch {
            return null;
        }
    }
    clear(db, profileId) {
        db.prepare('DELETE FROM session_state WHERE profile_id = ?').run(profileId);
    }
}
exports.CrashRecoveryService = CrashRecoveryService;
