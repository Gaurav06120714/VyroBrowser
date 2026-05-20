"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryService = void 0;
class HistoryService {
    db;
    constructor(db) {
        this.db = db;
    }
    add(profileId, url, title, favicon) {
        const existing = this.db.prepare('SELECT id FROM history WHERE profile_id = ? AND url = ?').get(profileId, url);
        if (existing) {
            this.db.prepare('UPDATE history SET visit_count = visit_count + 1, last_visited_at = unixepoch(), title = ?, favicon = ? WHERE id = ?').run(title, favicon ?? null, existing.id);
        }
        else {
            this.db.prepare('INSERT INTO history (profile_id, url, title, favicon) VALUES (?, ?, ?, ?)').run(profileId, url, title, favicon ?? null);
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
            // Fallback to LIKE if FTS not available
            return this.db.prepare('SELECT * FROM history WHERE profile_id = ? AND (title LIKE ? OR url LIKE ?) ORDER BY last_visited_at DESC LIMIT ? OFFSET ?').all(profileId, `%${query}%`, `%${query}%`, limit, offset).map(this.toEntry);
        }
    }
    delete(id) {
        this.db.prepare('DELETE FROM history WHERE id = ?').run(id);
    }
    clearRange(profileId, from, to) {
        this.db.prepare('DELETE FROM history WHERE profile_id = ? AND last_visited_at BETWEEN ? AND ?').run(profileId, from, to);
    }
    clearAll(profileId) {
        this.db.prepare('DELETE FROM history WHERE profile_id = ?').run(profileId);
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
