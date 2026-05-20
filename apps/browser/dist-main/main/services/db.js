"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.closeDb = closeDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const migrations_1 = require("./migrations");
let _db = null;
function getDb() {
    if (!_db) {
        const dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'vyro.db');
        _db = new better_sqlite3_1.default(dbPath);
        _db.pragma('journal_mode = WAL');
        _db.pragma('foreign_keys = ON');
        (0, migrations_1.runMigrations)(_db);
    }
    return _db;
}
function closeDb() {
    if (_db) {
        _db.close();
        _db = null;
    }
}
