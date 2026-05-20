import Database from 'better-sqlite3';
import { HistoryEntry } from '../../shared/types/history';

export class HistoryService {
  constructor(private db: Database.Database) {}

  add(profileId: string, url: string, title: string, favicon?: string): void {
    const existing = this.db.prepare(
      'SELECT id FROM history WHERE profile_id = ? AND url = ?'
    ).get(profileId, url) as { id: number } | undefined;

    if (existing) {
      this.db.prepare(
        'UPDATE history SET visit_count = visit_count + 1, last_visited_at = unixepoch(), title = ?, favicon = ? WHERE id = ?'
      ).run(title, favicon ?? null, existing.id);
    } else {
      this.db.prepare(
        'INSERT INTO history (profile_id, url, title, favicon) VALUES (?, ?, ?, ?)'
      ).run(profileId, url, title, favicon ?? null);
    }
  }

  search(profileId: string, query: string, limit = 50, offset = 0): HistoryEntry[] {
    if (!query.trim()) {
      return (this.db.prepare(
        'SELECT * FROM history WHERE profile_id = ? ORDER BY last_visited_at DESC LIMIT ? OFFSET ?'
      ).all(profileId, limit, offset) as Record<string, unknown>[]).map(this.toEntry);
    }
    try {
      return (this.db.prepare(
        `SELECT h.* FROM history h
         JOIN history_fts fts ON fts.rowid = h.id
         WHERE h.profile_id = ? AND history_fts MATCH ?
         ORDER BY h.last_visited_at DESC LIMIT ? OFFSET ?`
      ).all(profileId, query + '*', limit, offset) as Record<string, unknown>[]).map(this.toEntry);
    } catch {
      // Fallback to LIKE if FTS not available
      return (this.db.prepare(
        'SELECT * FROM history WHERE profile_id = ? AND (title LIKE ? OR url LIKE ?) ORDER BY last_visited_at DESC LIMIT ? OFFSET ?'
      ).all(profileId, `%${query}%`, `%${query}%`, limit, offset) as Record<string, unknown>[]).map(this.toEntry);
    }
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM history WHERE id = ?').run(id);
  }

  clearRange(profileId: string, from: number, to: number): void {
    this.db.prepare(
      'DELETE FROM history WHERE profile_id = ? AND last_visited_at BETWEEN ? AND ?'
    ).run(profileId, from, to);
  }

  clearAll(profileId: string): void {
    this.db.prepare('DELETE FROM history WHERE profile_id = ?').run(profileId);
  }

  private toEntry(row: Record<string, unknown>): HistoryEntry {
    return {
      id: row.id as number,
      profileId: row.profile_id as string,
      url: row.url as string,
      title: row.title as string,
      favicon: row.favicon as string | null,
      visitCount: row.visit_count as number,
      lastVisitedAt: row.last_visited_at as number,
    };
  }
}
