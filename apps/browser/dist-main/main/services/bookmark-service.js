"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarkService = void 0;
const sync_service_1 = require("./sync-service");
class BookmarkService {
    db;
    constructor(db) {
        this.db = db;
    }
    getTree(profileId) {
        const folders = this.db.prepare('SELECT * FROM bookmark_folders WHERE profile_id = ? ORDER BY sort_index').all(profileId);
        const bookmarks = this.db.prepare('SELECT * FROM bookmarks WHERE profile_id = ? ORDER BY sort_index').all(profileId);
        const folderMap = new Map();
        const roots = [];
        for (const f of folders) {
            folderMap.set(f.id, {
                id: f.id,
                profileId: f.profile_id,
                parentId: f.parent_id,
                name: f.name,
                sortIndex: f.sort_index,
                createdAt: f.created_at,
                children: [],
                bookmarks: [],
            });
        }
        for (const b of bookmarks) {
            const folderId = b.folder_id;
            const bm = {
                id: b.id,
                profileId: b.profile_id,
                folderId,
                url: b.url,
                title: b.title,
                favicon: b.favicon,
                sortIndex: b.sort_index,
                createdAt: b.created_at,
            };
            if (folderId !== null) {
                const folder = folderMap.get(folderId);
                if (folder)
                    folder.bookmarks.push(bm);
            }
        }
        for (const folder of folderMap.values()) {
            if (folder.parentId === null) {
                roots.push(folder);
            }
            else {
                const parent = folderMap.get(folder.parentId);
                if (parent)
                    parent.children.push(folder);
            }
        }
        return roots;
    }
    add(profileId, url, title, folderId, favicon) {
        const maxRow = this.db.prepare('SELECT MAX(sort_index) as m FROM bookmarks WHERE profile_id = ? AND folder_id IS ?').get(profileId, folderId ?? null);
        const maxIdx = maxRow.m ?? -1;
        const info = this.db.prepare('INSERT INTO bookmarks (profile_id, folder_id, url, title, favicon, sort_index) VALUES (?, ?, ?, ?, ?, ?)').run(profileId, folderId ?? null, url, title, favicon ?? null, maxIdx + 1);
        const bm = {
            id: info.lastInsertRowid,
            profileId,
            folderId: folderId ?? null,
            url,
            title,
            favicon: favicon ?? null,
            sortIndex: maxIdx + 1,
            createdAt: Math.floor(Date.now() / 1000),
        };
        (0, sync_service_1.syncBookmarkAdd)({
            id: bm.id, profile_id: bm.profileId, folder_id: bm.folderId,
            url: bm.url, title: bm.title, favicon: bm.favicon,
            sort_index: bm.sortIndex, created_at: bm.createdAt,
        });
        return bm;
    }
    update(id, fields) {
        const sets = [];
        const vals = [];
        if (fields.title !== undefined) {
            sets.push('title = ?');
            vals.push(fields.title);
        }
        if (fields.url !== undefined) {
            sets.push('url = ?');
            vals.push(fields.url);
        }
        if ('folderId' in fields) {
            sets.push('folder_id = ?');
            vals.push(fields.folderId);
        }
        if (sets.length) {
            vals.push(id);
            this.db.prepare(`UPDATE bookmarks SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
            (0, sync_service_1.syncBookmarkUpdate)(id, {
                ...(fields.title !== undefined && { title: fields.title }),
                ...(fields.url !== undefined && { url: fields.url }),
                ...('folderId' in fields && { folder_id: fields.folderId }),
            });
        }
    }
    delete(id) {
        this.db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
        (0, sync_service_1.syncBookmarkDelete)(id);
    }
    createFolder(profileId, name, parentId) {
        const maxRow = this.db.prepare('SELECT MAX(sort_index) as m FROM bookmark_folders WHERE profile_id = ? AND parent_id IS ?').get(profileId, parentId ?? null);
        const maxIdx = maxRow.m ?? -1;
        const info = this.db.prepare('INSERT INTO bookmark_folders (profile_id, parent_id, name, sort_index) VALUES (?, ?, ?, ?)').run(profileId, parentId ?? null, name, maxIdx + 1);
        const folder = {
            id: info.lastInsertRowid,
            profileId,
            parentId: parentId ?? null,
            name,
            sortIndex: maxIdx + 1,
            createdAt: Math.floor(Date.now() / 1000),
            children: [],
            bookmarks: [],
        };
        (0, sync_service_1.syncFolderAdd)({
            id: folder.id, profile_id: folder.profileId, parent_id: folder.parentId,
            name: folder.name, sort_index: folder.sortIndex, created_at: folder.createdAt,
        });
        return folder;
    }
    deleteFolder(id) {
        this.db.prepare('DELETE FROM bookmark_folders WHERE id = ?').run(id);
        (0, sync_service_1.syncFolderDelete)(id);
    }
    reorder(id, newIndex, folderId) {
        this.db.prepare('UPDATE bookmarks SET sort_index = ?, folder_id = ? WHERE id = ?').run(newIndex, folderId, id);
    }
    exportNetscape(profileId) {
        const tree = this.getTree(profileId);
        const lines = [
            '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
            '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
            '<TITLE>Bookmarks</TITLE>',
            '<H1>Bookmarks</H1>',
            '<DL><p>',
        ];
        const serializeFolder = (folder, depth) => {
            const indent = '    '.repeat(depth);
            lines.push(`${indent}<DT><H3>${folder.name}</H3>`);
            lines.push(`${indent}<DL><p>`);
            for (const bm of folder.bookmarks) {
                lines.push(`${indent}    <DT><A HREF="${bm.url}">${bm.title}</A>`);
            }
            for (const child of folder.children)
                serializeFolder(child, depth + 1);
            lines.push(`${indent}</DL><p>`);
        };
        for (const folder of tree)
            serializeFolder(folder, 1);
        lines.push('</DL><p>');
        return lines.join('\n');
    }
    importNetscape(profileId, html) {
        let count = 0;
        const linkRe = /<A\s+HREF="([^"]+)"[^>]*>([^<]+)<\/A>/gi;
        let match;
        while ((match = linkRe.exec(html)) !== null) {
            this.add(profileId, match[1], match[2]);
            count++;
        }
        return count;
    }
}
exports.BookmarkService = BookmarkService;
