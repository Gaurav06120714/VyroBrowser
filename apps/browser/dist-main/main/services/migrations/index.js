"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const _001_init_1 = require("./001_init");
const _002_history_1 = require("./002_history");
const _003_bookmarks_1 = require("./003_bookmarks");
const _004_downloads_1 = require("./004_downloads");
const _005_ai_1 = require("./005_ai");
const _006_injections_1 = require("./006_injections");
const _007_adblock_1 = require("./007_adblock");
const MIGRATIONS = [
    { version: 1, run: _001_init_1.migration001 },
    { version: 2, run: _002_history_1.migration002 },
    { version: 3, run: _003_bookmarks_1.migration003 },
    { version: 4, run: _004_downloads_1.migration004 },
    { version: 5, run: _005_ai_1.migration005 },
    { version: 6, run: _006_injections_1.migration006 },
    { version: 7, run: _007_adblock_1.migration007 },
];
function runMigrations(db) {
    db.exec(`CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);
    const applied = new Set(db.prepare('SELECT version FROM schema_version').all().map((r) => r.version));
    for (const m of MIGRATIONS) {
        if (!applied.has(m.version)) {
            db.transaction(() => {
                m.run(db);
                db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(m.version);
            })();
        }
    }
}
