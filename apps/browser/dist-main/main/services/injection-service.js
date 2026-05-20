"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InjectionService = void 0;
class InjectionService {
    db;
    constructor(db) {
        this.db = db;
    }
    getAll(profileId) {
        return this.db.prepare('SELECT * FROM site_injections WHERE profile_id = ? ORDER BY created_at DESC').all(profileId).map(this.toInjection);
    }
    getForOrigin(origin, profileId) {
        const row = this.db.prepare('SELECT * FROM site_injections WHERE origin = ? AND profile_id = ?').get(origin, profileId);
        return row ? this.toInjection(row) : null;
    }
    save(origin, profileId, css, js, enabled) {
        const now = Math.floor(Date.now() / 1000);
        this.db.prepare(`
      INSERT INTO site_injections (origin, profile_id, css, js, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(origin, profile_id) DO UPDATE SET
        css = excluded.css, js = excluded.js,
        enabled = excluded.enabled, updated_at = excluded.updated_at
    `).run(origin, profileId, css, js, enabled ? 1 : 0, now, now);
    }
    delete(origin, profileId) {
        this.db.prepare('DELETE FROM site_injections WHERE origin = ? AND profile_id = ?')
            .run(origin, profileId);
    }
    async applyToWebContents(webContents, origin, profileId) {
        const injection = this.getForOrigin(origin, profileId);
        if (!injection || !injection.enabled)
            return;
        if (injection.css.trim())
            await webContents.insertCSS(injection.css);
        if (injection.js.trim()) {
            await webContents.executeJavaScript(`(function(){\n${injection.js}\n})()`);
        }
    }
    toInjection(row) {
        return {
            origin: row.origin,
            profileId: row.profile_id,
            css: row.css,
            js: row.js,
            enabled: Boolean(row.enabled),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.InjectionService = InjectionService;
