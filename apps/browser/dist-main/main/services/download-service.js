"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadService = void 0;
const electron_1 = require("electron");
const uuid_1 = require("uuid");
class DownloadService {
    db;
    activeDownloads = new Map();
    notifyProgress = null;
    notifyComplete = null;
    constructor(db) {
        this.db = db;
    }
    setProgressCallback(cb) { this.notifyProgress = cb; }
    setCompleteCallback(cb) { this.notifyComplete = cb; }
    handleWillDownload(profileId, item) {
        const id = (0, uuid_1.v4)();
        const filename = item.getFilename();
        const url = item.getURL();
        const totalBytes = item.getTotalBytes();
        this.db.prepare('INSERT INTO downloads (id, profile_id, url, filename, total_bytes) VALUES (?, ?, ?, ?, ?)').run(id, profileId, url, filename, totalBytes);
        this.activeDownloads.set(id, item);
        let lastTime = Date.now();
        let lastReceived = 0;
        item.on('updated', (_event, state) => {
            const received = item.getReceivedBytes();
            const now = Date.now();
            const elapsed = (now - lastTime) / 1000;
            const speed = elapsed > 0 ? (received - lastReceived) / elapsed : 0;
            lastTime = now;
            lastReceived = received;
            const dlState = state === 'progressing'
                ? (item.isPaused() ? 'paused' : 'in_progress')
                : 'interrupted';
            this.db.prepare('UPDATE downloads SET received_bytes = ?, state = ? WHERE id = ?').run(received, dlState, id);
            this.notifyProgress?.(id, received, item.getTotalBytes(), dlState, speed);
        });
        item.once('done', (_event, state) => {
            this.activeDownloads.delete(id);
            const savePath = item.getSavePath();
            const dlState = state === 'completed' ? 'completed'
                : state === 'cancelled' ? 'cancelled'
                    : 'interrupted';
            this.db.prepare('UPDATE downloads SET state = ?, save_path = ?, completed_at = unixepoch(), received_bytes = total_bytes WHERE id = ?').run(dlState, savePath, id);
            if (state === 'completed')
                this.notifyComplete?.(id, savePath);
        });
    }
    getAll(profileId) {
        return this.db.prepare('SELECT * FROM downloads WHERE profile_id = ? ORDER BY started_at DESC').all(profileId).map(this.toDownload);
    }
    pause(id) { this.activeDownloads.get(id)?.pause(); }
    resume(id) { this.activeDownloads.get(id)?.resume(); }
    cancel(id) { this.activeDownloads.get(id)?.cancel(); }
    open(id) {
        const row = this.db.prepare('SELECT save_path FROM downloads WHERE id = ?').get(id);
        if (row?.save_path)
            electron_1.shell.openPath(row.save_path);
    }
    reveal(id) {
        const row = this.db.prepare('SELECT save_path FROM downloads WHERE id = ?').get(id);
        if (row?.save_path)
            electron_1.shell.showItemInFolder(row.save_path);
    }
    deleteRecord(id) {
        this.db.prepare('DELETE FROM downloads WHERE id = ?').run(id);
    }
    clearCompleted(profileId) {
        this.db.prepare("DELETE FROM downloads WHERE profile_id = ? AND state IN ('completed', 'cancelled', 'interrupted')").run(profileId);
    }
    toDownload(row) {
        return {
            id: row.id,
            profileId: row.profile_id,
            url: row.url,
            filename: row.filename,
            savePath: row.save_path,
            mimeType: row.mime_type,
            totalBytes: row.total_bytes,
            receivedBytes: row.received_bytes,
            state: row.state,
            startedAt: row.started_at,
            completedAt: row.completed_at,
        };
    }
}
exports.DownloadService = DownloadService;
