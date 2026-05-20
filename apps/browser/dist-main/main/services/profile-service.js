"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const electron_1 = require("electron");
const uuid_1 = require("uuid");
const constants_1 = require("../../shared/constants");
function rowToProfile(row) {
    return {
        id: row.id,
        name: row.name,
        avatar: row.avatar,
        isDefault: row.is_default === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
class ProfileService {
    db;
    activeFile;
    constructor(db) {
        this.db = db;
        this.activeFile = path_1.default.join(electron_1.app.getPath('userData'), 'active-profile.txt');
    }
    getAll() {
        const rows = this.db
            .prepare('SELECT * FROM profiles ORDER BY is_default DESC, created_at ASC')
            .all();
        return rows.map(rowToProfile);
    }
    getById(id) {
        const row = this.db
            .prepare('SELECT * FROM profiles WHERE id = ?')
            .get(id);
        return row ? rowToProfile(row) : null;
    }
    async ensureDefault() {
        const existing = this.db
            .prepare('SELECT id FROM profiles WHERE id = ?')
            .get(constants_1.DEFAULT_PROFILE_ID);
        if (!existing) {
            this.db
                .prepare('INSERT OR IGNORE INTO profiles (id, name, is_default) VALUES (?, ?, 1)')
                .run(constants_1.DEFAULT_PROFILE_ID, 'Default');
        }
    }
    create(name, avatar) {
        const id = (0, uuid_1.v4)();
        const now = Math.floor(Date.now() / 1000);
        this.db
            .prepare('INSERT INTO profiles (id, name, avatar, is_default, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)')
            .run(id, name, avatar ?? null, now, now);
        return this.getById(id);
    }
    delete(id) {
        if (id === constants_1.DEFAULT_PROFILE_ID)
            throw new Error('Cannot delete the default profile');
        this.db.prepare('DELETE FROM profiles WHERE id = ?').run(id);
    }
    update(id, fields) {
        const now = Math.floor(Date.now() / 1000);
        if (fields.name !== undefined) {
            this.db
                .prepare('UPDATE profiles SET name = ?, updated_at = ? WHERE id = ?')
                .run(fields.name, now, id);
        }
        if (fields.avatar !== undefined) {
            this.db
                .prepare('UPDATE profiles SET avatar = ?, updated_at = ? WHERE id = ?')
                .run(fields.avatar, now, id);
        }
        return this.getById(id);
    }
    getActive() {
        try {
            const content = fs_1.default.readFileSync(this.activeFile, 'utf8').trim();
            if (content && this.getById(content))
                return content;
        }
        catch {
            // file doesn't exist yet
        }
        return constants_1.DEFAULT_PROFILE_ID;
    }
    setActive(id) {
        fs_1.default.writeFileSync(this.activeFile, id, 'utf8');
    }
}
exports.ProfileService = ProfileService;
