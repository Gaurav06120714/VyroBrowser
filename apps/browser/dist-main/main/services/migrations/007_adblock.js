"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migration007 = migration007;
function migration007(db) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS adblock_site_rules (
      origin TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (origin, profile_id),
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS session_state (
      profile_id TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      saved_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
  `);
}
