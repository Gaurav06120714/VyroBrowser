"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const uuid_1 = require("uuid");
const http_1 = __importDefault(require("http"));
class AIService {
    db;
    getOllamaUrl;
    abortControllers = new Map();
    constructor(db, getOllamaUrl) {
        this.db = db;
        this.getOllamaUrl = getOllamaUrl;
    }
    async listModels() {
        return new Promise((resolve) => {
            try {
                const rawUrl = this.getOllamaUrl();
                const url = new URL(rawUrl);
                const req = http_1.default.get({
                    hostname: url.hostname,
                    port: parseInt(url.port) || 11434,
                    path: '/api/tags',
                }, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk.toString(); });
                    res.on('end', () => {
                        try {
                            const parsed = JSON.parse(data);
                            resolve((parsed.models ?? []).map(m => ({
                                name: m.name,
                                size: m.size,
                                modifiedAt: m.modified_at,
                            })));
                        }
                        catch {
                            resolve([]);
                        }
                    });
                });
                req.on('error', () => resolve([]));
                req.end();
            }
            catch {
                resolve([]);
            }
        });
    }
    createConversation(profileId, model, systemPrompt) {
        const id = (0, uuid_1.v4)();
        const now = Math.floor(Date.now() / 1000);
        this.db.prepare('INSERT INTO ai_conversations (id, profile_id, title, model, system_prompt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, profileId, 'New Chat', model, systemPrompt ?? null, now, now);
        return { id, profileId, title: 'New Chat', model, systemPrompt: systemPrompt ?? null, createdAt: now, updatedAt: now };
    }
    getConversations(profileId) {
        return this.db.prepare('SELECT * FROM ai_conversations WHERE profile_id = ? ORDER BY updated_at DESC').all(profileId).map(r => ({
            id: r.id,
            profileId: r.profile_id,
            title: r.title,
            model: r.model,
            systemPrompt: r.system_prompt,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
        }));
    }
    deleteConversation(id) {
        this.db.prepare('DELETE FROM ai_conversations WHERE id = ?').run(id);
    }
    getMessages(conversationId) {
        return this.db.prepare('SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId).map(r => ({
            id: r.id,
            conversationId: r.conversation_id,
            role: r.role,
            content: r.content,
            tokenCount: r.token_count,
            createdAt: r.created_at,
        }));
    }
    async sendMessage(conversationId, userContent, model, onChunk) {
        const msgId = (0, uuid_1.v4)();
        const now = Math.floor(Date.now() / 1000);
        this.db.prepare('INSERT INTO ai_messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)').run(msgId, conversationId, 'user', userContent, now);
        const messages = this.getMessages(conversationId);
        const conv = this.db.prepare('SELECT * FROM ai_conversations WHERE id = ?').get(conversationId);
        const payload = JSON.stringify({
            model,
            messages: [
                ...(conv?.system_prompt ? [{ role: 'system', content: conv.system_prompt }] : []),
                ...messages.map(m => ({ role: m.role, content: m.content })),
            ],
            stream: true,
        });
        return new Promise((resolve, reject) => {
            let assistantContent = '';
            try {
                const ollamaUrl = new URL(this.getOllamaUrl());
                const req = http_1.default.request({
                    hostname: ollamaUrl.hostname,
                    port: parseInt(ollamaUrl.port) || 11434,
                    path: '/api/chat',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(payload),
                    },
                }, (res) => {
                    res.on('data', (chunk) => {
                        const lines = chunk.toString().split('\n').filter(Boolean);
                        for (const line of lines) {
                            try {
                                const obj = JSON.parse(line);
                                if (obj.message?.content) {
                                    assistantContent += obj.message.content;
                                    onChunk(obj.message.content, false);
                                }
                                if (obj.done) {
                                    const aId = (0, uuid_1.v4)();
                                    this.db.prepare('INSERT INTO ai_messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)').run(aId, conversationId, 'assistant', assistantContent, Math.floor(Date.now() / 1000));
                                    if (conv?.title === 'New Chat') {
                                        const title = userContent.slice(0, 50);
                                        this.db.prepare('UPDATE ai_conversations SET title = ?, updated_at = unixepoch() WHERE id = ?')
                                            .run(title, conversationId);
                                    }
                                    this.abortControllers.delete(conversationId); // cleanup on success
                                    onChunk('', true);
                                    resolve();
                                }
                            }
                            catch { /* ignore malformed JSON */ }
                        }
                    });
                    res.on('error', (err) => {
                        this.abortControllers.delete(conversationId); // cleanup on error
                        reject(err);
                    });
                    res.on('end', () => {
                        this.abortControllers.delete(conversationId); // cleanup on end
                        if (assistantContent && !assistantContent.endsWith('\n')) {
                            resolve();
                        }
                    });
                });
                req.on('error', (err) => {
                    this.abortControllers.delete(conversationId); // cleanup on request error
                    reject(err);
                });
                const abort = () => { req.destroy(); };
                this.abortControllers.set(conversationId, abort);
                req.write(payload);
                req.end();
            }
            catch (err) {
                this.abortControllers.delete(conversationId); // cleanup on sync error
                reject(err);
            }
        });
    }
    abort(conversationId) {
        this.abortControllers.get(conversationId)?.();
        this.abortControllers.delete(conversationId);
    }
    abortAll() {
        for (const abort of this.abortControllers.values()) {
            try {
                abort();
            }
            catch { /* ignore */ }
        }
        this.abortControllers.clear();
    }
}
exports.AIService = AIService;
