"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOnboardingIpc = registerOnboardingIpc;

const electron_1 = require("electron");
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const ipc_channels_1 = require("../../shared/ipc-channels");
const validators_1 = require("./validators");
function getOllamaBase() {
    return process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https://') ? https_1.default : http_1.default;
        const req = client.get(url, { timeout: 5000 }, (res) => {
            let raw = '';
            res.on('data', (chunk) => { raw += chunk.toString(); });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(raw));
                }
                catch {
                    reject(new Error(`JSON parse error: ${raw.slice(0, 200)}`));
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    });
}

const activePulls = new Map();

function streamPull(base, model, signal, onLine) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${base}/api/pull`);
        const body = JSON.stringify({ name: model, stream: true });
        const options = {
            method: 'POST',
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };
        const client = url.protocol === 'https:' ? https_1.default : http_1.default;
        const req = client.request(options, (res) => {
            let buffer = '';
            res.on('data', (chunk) => {
                if (signal.aborted) {
                    req.destroy();
                    return;
                }
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                    if (line.trim())
                        onLine(line.trim());
                }
            });
            res.on('end', () => {
                if (buffer.trim())
                    onLine(buffer.trim());
                resolve();
            });
            res.on('error', reject);
        });
        req.on('error', (err) => {
            if (signal.aborted)
                resolve();
            else
                reject(err);
        });
        signal.addEventListener('abort', () => { req.destroy(); resolve(); });
        req.write(body);
        req.end();
    });
}
function registerOnboardingIpc(wm) {
    
    electron_1.ipcMain.handle('shell:open-external', (_event, { url }) => {
        if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
            electron_1.shell.openExternal(url).catch(console.error);
        }
        return { ok: true };
    });
    
    electron_1.ipcMain.handle(ipc_channels_1.IPC.ONBOARDING_CHECK_OLLAMA, async () => {
        const base = getOllamaBase();
        try {
            await fetchJson(`${base}/api/tags`);
            return { running: true, url: base };
        }
        catch {
            return { running: false, url: base };
        }
    });
    
    electron_1.ipcMain.handle(ipc_channels_1.IPC.ONBOARDING_LIST_MODELS, async () => {
        const base = getOllamaBase();
        try {
            const data = await fetchJson(`${base}/api/tags`);
            return (data.models ?? []).map((m) => ({
                name: m.name,
                size: m.size,
                modifiedAt: m.modified_at,
            }));
        }
        catch {
            return [];
        }
    });
    
    electron_1.ipcMain.handle(ipc_channels_1.IPC.ONBOARDING_PULL_MODEL, async (_event, args) => {
        const parsed = validators_1.OnboardingPullModelSchema.safeParse(args);
        if (!parsed.success)
            return { ok: false, error: 'Invalid arguments' };
        const { model } = parsed.data;
        const base = getOllamaBase();
        const win = wm.getMain();
        const controller = new AbortController();
        activePulls.set(model, controller);
        const push = (channel, payload) => {
            if (win && !win.isDestroyed()) {
                win.webContents.send(channel, payload);
            }
        };
        try {
            await streamPull(base, model, controller.signal, (raw) => {
                if (controller.signal.aborted)
                    return;
                try {
                    const line = JSON.parse(raw);
                    if (line.error) {
                        push(ipc_channels_1.IPC.ONBOARDING_PULL_ERROR, { model, message: line.error });
                        return;
                    }
                    const total = line.total ?? 0;
                    const completed = line.completed ?? 0;
                    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                    push(ipc_channels_1.IPC.ONBOARDING_PULL_PROGRESS, {
                        model,
                        status: line.status ?? 'pulling',
                        percent,
                        completed,
                        total,
                    });
                    if (line.status === 'success') {
                        push(ipc_channels_1.IPC.ONBOARDING_PULL_COMPLETE, { model });
                    }
                }
                catch {
                    
                }
            });
            if (!controller.signal.aborted) {
                push(ipc_channels_1.IPC.ONBOARDING_PULL_COMPLETE, { model });
            }
            return { ok: true };
        }
        catch (err) {
            push(ipc_channels_1.IPC.ONBOARDING_PULL_ERROR, { model, message: err.message });
            return { ok: false, error: err.message };
        }
        finally {
            activePulls.delete(model);
        }
    });
    
    electron_1.ipcMain.handle(ipc_channels_1.IPC.ONBOARDING_CANCEL_PULL, (_event, args) => {
        const parsed = validators_1.OnboardingCancelPullSchema.safeParse(args);
        if (!parsed.success)
            return { ok: false, error: 'Invalid arguments' };
        const { model } = parsed.data;
        const controller = activePulls.get(model);
        if (controller) {
            controller.abort();
            activePulls.delete(model);
        }
        return { ok: true };
    });
}
