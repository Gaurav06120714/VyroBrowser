"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryService = void 0;
const sync_service_1 = require("./sync-service");
class HistoryService {
    db;
    constructor(db) {
        this.db = db;
    }
    add(profileId, url, title, favicon) {
        const existing = this.db.prepare('SELECT id FROM history WHERE profile_id = ? AND url = ?').get(profileId, url);
        if (existing) {
            this.db.prepare('UPDATE history SET visit_count = visit_count + 1, last_visited_at = unixepoch(), title = ?, favicon = ? WHERE id = ?').run(title, favicon ?? null, existing.id);
            const updated = this.db.prepare('SELECT * FROM history WHERE id = ?').get(existing.id);
            (0, sync_service_1.syncHistoryAdd)({
                id: updated.id, profile_id: updated.profile_id,
                url: updated.url, title: updated.title,
                favicon: updated.favicon, visit_count: updated.visit_count,
                last_visited_at: updated.last_visited_at,
            });
        }
        else {
            const info = this.db.prepare('INSERT INTO history (profile_id, url, title, favicon) VALUES (?, ?, ?, ?)').run(profileId, url, title, favicon ?? null);
            (0, sync_service_1.syncHistoryAdd)({
                id: info.lastInsertRowid, profile_id: profileId,
                url, title, favicon: favicon ?? null, visit_count: 1,
                last_visited_at: Math.floor(Date.now() / 1000),
            });
        }
    }
    search(profileId, query, limit = 50, offset = 0) {
        if (!query.trim()) {
            return this.db.prepare('SELECT * FROM history WHERE profile_id = ? ORDER BY last_visited_at DESC LIMIT ? OFFSET ?').all(profileId, limit, offset).map(this.toEntry);
        }
        try {
            return this.db.prepare(`SELECT h.* FROM history h
         JOIN history_fts fts ON fts.rowid = h.id
         WHERE h.profile_id = ? AND history_fts MATCH ?
         ORDER BY h.last_visited_at DESC LIMIT ? OFFSET ?`).all(profileId, query + '*', limit, offset).map(this.toEntry);
        }
        catch {
            return this.db.prepare('SELECT * FROM history WHERE profile_id = ? AND (title LIKE ? OR url LIKE ?) ORDER BY last_visited_at DESC LIMIT ? OFFSET ?').all(profileId, `%${query}%`, `%${query}%`, limit, offset).map(this.toEntry);
        }
    }
    delete(id) {
        this.db.prepare('DELETE FROM history WHERE id = ?').run(id);
        (0, sync_service_1.syncHistoryDelete)(id);
    }
    clearRange(profileId, from, to) {
        this.db.prepare('DELETE FROM history WHERE profile_id = ? AND last_visited_at BETWEEN ? AND ?').run(profileId, from, to);
        (0, sync_service_1.syncHistoryClear)(profileId);
    }
    clearAll(profileId) {
        this.db.prepare('DELETE FROM history WHERE profile_id = ?').run(profileId);
        (0, sync_service_1.syncHistoryClear)(profileId);
    }
    toEntry(row) {
        return {
            id: row.id,
            profileId: row.profile_id,
            url: row.url,
            title: row.title,
            favicon: row.favicon,
            visitCount: row.visit_count,
            lastVisitedAt: row.last_visited_at,
        };
    }
}
exports.HistoryService = HistoryService;
