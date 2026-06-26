"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const uuid_1 = require("uuid");
const http_1 = __importDefault(require("http"));
const sync_service_1 = require("./sync-service");
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
        const conv = { id, profileId, title: 'New Chat', model, systemPrompt: systemPrompt ?? null, createdAt: now, updatedAt: now };
        (0, sync_service_1.syncAIConversationCreate)({ id, profile_id: profileId, title: 'New Chat', model, system_prompt: systemPrompt ?? null, created_at: now, updated_at: now });
        return conv;
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
        (0, sync_service_1.syncAIConversationDelete)(id);
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
        // Resolve a usable model: if the requested one isn't installed (or none was
        // given), fall back to the first installed model. Surface a clear error when
        // Ollama is unreachable or has no models — the most common "not working" cases.
        const installed = await this.listModels();
        if (installed.length === 0) {
            throw new Error('No Ollama models found. Make sure Ollama is running, then run: ollama pull llama3.2');
        }
        const names = installed.map(m => m.name);
        if (!model || !names.includes(model)) {
            // Allow a base-name match (e.g. "llama3.2" matches "llama3.2:latest").
            model = names.find(n => n === model || n.split(':')[0] === (model || '').split(':')[0]) ?? names[0];
        }
        const msgId = (0, uuid_1.v4)();
        const now = Math.floor(Date.now() / 1000);
        this.db.prepare('INSERT INTO ai_messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)').run(msgId, conversationId, 'user', userContent, now);
        (0, sync_service_1.syncAIMessageAdd)({ id: msgId, conversation_id: conversationId, role: 'user', content: userContent, created_at: now });
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
                    let buffer = '';
                    let finished = false;
                    const finalize = () => {
                        if (finished)
                            return;
                        finished = true;
                        const aId = (0, uuid_1.v4)();
                        const aNow = Math.floor(Date.now() / 1000);
                        this.db.prepare('INSERT INTO ai_messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)').run(aId, conversationId, 'assistant', assistantContent, aNow);
                        (0, sync_service_1.syncAIMessageAdd)({ id: aId, conversation_id: conversationId, role: 'assistant', content: assistantContent, created_at: aNow });
                        if (conv?.title === 'New Chat') {
                            const title = userContent.slice(0, 50);
                            this.db.prepare('UPDATE ai_conversations SET title = ?, updated_at = unixepoch() WHERE id = ?')
                                .run(title, conversationId);
                        }
                        this.abortControllers.delete(conversationId);
                        onChunk('', true);
                        resolve();
                    };
                    // Ollama returns NDJSON; HTTP chunks don't align to line boundaries,
                    // so buffer and only parse complete lines (keep the trailing partial).
                    const processLine = (line) => {
                        const trimmed = line.trim();
                        if (!trimmed)
                            return;
                        let obj;
                        try {
                            obj = JSON.parse(trimmed);
                        }
                        catch {
                            return; // incomplete/invalid line — ignore
                        }
                        if (obj.error) {
                            this.abortControllers.delete(conversationId);
                            if (!finished) {
                                finished = true;
                                reject(new Error(obj.error));
                            }
                            req.destroy();
                            return;
                        }
                        if (obj.message?.content) {
                            assistantContent += obj.message.content;
                            onChunk(obj.message.content, false);
                        }
                        if (obj.done)
                            finalize();
                    };
                    res.on('data', (chunk) => {
                        buffer += chunk.toString();
                        let idx;
                        while ((idx = buffer.indexOf('\n')) !== -1) {
                            const line = buffer.slice(0, idx);
                            buffer = buffer.slice(idx + 1);
                            processLine(line);
                        }
                    });
                    res.on('error', (err) => {
                        this.abortControllers.delete(conversationId);
                        if (!finished) {
                            finished = true;
                            reject(err);
                        }
                    });
                    res.on('end', () => {
                        if (buffer.trim())
                            processLine(buffer);
                        this.abortControllers.delete(conversationId);
                        if (!finished)
                            finalize();
                    });
                });
                req.on('error', (err) => {
                    this.abortControllers.delete(conversationId);
                    reject(err);
                });
                const abort = () => { req.destroy(); };
                this.abortControllers.set(conversationId, abort);
                req.write(payload);
                req.end();
            }
            catch (err) {
                this.abortControllers.delete(conversationId);
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
            catch { }
        }
        this.abortControllers.clear();
    }
}
exports.AIService = AIService;
