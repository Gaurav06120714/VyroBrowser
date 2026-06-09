"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeywordService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../../shared/keyword-engine/database");
const matcher_1 = require("../../shared/keyword-engine/matcher");
class KeywordService {
    db;
    constructor(db) {
        this.db = db;
        this.ensureTable();
    }
    ensureTable() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS custom_keywords (
        id          TEXT PRIMARY KEY,
        keyword     TEXT NOT NULL UNIQUE,
        aliases     TEXT NOT NULL DEFAULT '[]',
        url         TEXT NOT NULL,
        search_url  TEXT NOT NULL DEFAULT '',
        name        TEXT NOT NULL,
        favicon     TEXT NOT NULL DEFAULT '',
        category    TEXT NOT NULL DEFAULT 'other',
        enabled     INTEGER NOT NULL DEFAULT 1,
        created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
      );
      CREATE TABLE IF NOT EXISTS keyword_overrides (
        keyword     TEXT PRIMARY KEY,
        enabled     INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS keyword_usage (
        keyword   TEXT PRIMARY KEY,
        count     INTEGER NOT NULL DEFAULT 0,
        last_used INTEGER NOT NULL DEFAULT 0
      );
    `);
    }
    
    getAll() {
        const custom = this.db.prepare('SELECT * FROM custom_keywords ORDER BY keyword').all()
            .map(this.rowToCustom);
        
        const overrides = new Map(this.db.prepare('SELECT * FROM keyword_overrides').all()
            .map((r) => [r.keyword, Boolean(r.enabled)]));
        const builtin = database_1.BUILTIN_KEYWORDS.map(e => ({
            ...e,
            enabled: overrides.has(e.keyword) ? overrides.get(e.keyword) : e.enabled,
        }));
        return { builtin, custom };
    }
    saveCustom(data) {
        const id = data.id ?? (0, uuid_1.v4)();
        const now = Math.floor(Date.now() / 1000);
        this.db.prepare(`
      INSERT INTO custom_keywords (id, keyword, aliases, url, search_url, name, favicon, category, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(keyword) DO UPDATE SET
        aliases = excluded.aliases, url = excluded.url,
        search_url = excluded.search_url, name = excluded.name,
        favicon = excluded.favicon, category = excluded.category,
        enabled = excluded.enabled, updated_at = excluded.updated_at
    `).run(id, data.keyword.toLowerCase().trim(), JSON.stringify(data.aliases.map(a => a.toLowerCase().trim())), data.url, data.searchUrl || data.url, data.name, data.favicon, data.category, data.enabled ? 1 : 0, now, now);
        (0, database_1.invalidateIndex)();
        return this.rowToCustom(this.db.prepare('SELECT * FROM custom_keywords WHERE keyword = ?').get(data.keyword));
    }
    deleteCustom(keyword) {
        this.db.prepare('DELETE FROM custom_keywords WHERE keyword = ?').run(keyword.toLowerCase().trim());
        (0, database_1.invalidateIndex)();
    }
    toggleBuiltin(keyword, enabled) {
        this.db.prepare(`
      INSERT INTO keyword_overrides (keyword, enabled) VALUES (?, ?)
      ON CONFLICT(keyword) DO UPDATE SET enabled = excluded.enabled
    `).run(keyword.toLowerCase().trim(), enabled ? 1 : 0);
        (0, database_1.invalidateIndex)();
    }
    
    trackUse(keyword) {
        const now = Math.floor(Date.now() / 1000);
        this.db.prepare(`
      INSERT INTO keyword_usage (keyword, count, last_used) VALUES (?, 1, ?)
      ON CONFLICT(keyword) DO UPDATE SET count = count + 1, last_used = excluded.last_used
    `).run(keyword.toLowerCase().trim(), now);
    }
    getUsage() {
        return this.db.prepare('SELECT keyword, count, last_used FROM keyword_usage ORDER BY count DESC').all()
            .map(r => ({ keyword: r.keyword, count: r.count, lastUsed: r.last_used }));
    }
    resetBuiltinOverrides() {
        this.db.prepare('DELETE FROM keyword_overrides').run();
        (0, database_1.invalidateIndex)();
    }
    
    resolve(input, searchEngine) {
        const extras = this.getExtras();
        return (0, matcher_1.resolve)(input, extras, searchEngine);
    }
    suggest(input, maxResults = 8) {
        const extras = this.getExtras();
        const usageMap = new Map(this.getUsage().map(u => [u.keyword, u.count]));
        return (0, matcher_1.suggest)(input, extras, maxResults, usageMap);
    }
    
    exportJson() {
        const { custom } = this.getAll();
        return JSON.stringify(custom, null, 2);
    }
    importJson(json) {
        const data = JSON.parse(json);
        if (!Array.isArray(data))
            throw new Error('Invalid format');
        let count = 0;
        for (const item of data) {
            if (!item.keyword || !item.url)
                continue;
            this.saveCustom({
                id: item.id,
                keyword: item.keyword,
                aliases: item.aliases ?? [],
                url: item.url,
                searchUrl: item.searchUrl ?? item.url,
                name: item.name ?? item.keyword,
                favicon: item.favicon ?? '',
                category: item.category ?? 'other',
                enabled: item.enabled ?? true,
            });
            count++;
        }
        return count;
    }
    
    getExtras() {
        const { custom } = this.getAll();
        return custom.map(c => ({
            keyword: c.keyword,
            aliases: c.aliases,
            url: c.url,
            searchUrl: c.searchUrl || c.url,
            name: c.name,
            favicon: c.favicon,
            category: c.category,
            builtin: false,
            enabled: c.enabled,
            region: 'global',
        }));
    }
    rowToCustom(row) {
        return {
            id: row.id,
            keyword: row.keyword,
            aliases: JSON.parse(row.aliases ?? '[]'),
            url: row.url,
            searchUrl: row.search_url,
            name: row.name,
            favicon: row.favicon,
            category: row.category,
            enabled: Boolean(row.enabled),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.KeywordService = KeywordService;
