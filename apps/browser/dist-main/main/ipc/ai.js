"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAIIpc = registerAIIpc;
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
const ai_service_1 = require("../services/ai-service");
const settings_service_1 = require("../services/settings-service");
const profile_service_1 = require("../services/profile-service");
const validators_1 = require("./validators");
function registerAIIpc(db, wm) {
    const profileService = new profile_service_1.ProfileService(db);
    const settingsService = new settings_service_1.SettingsService(db);
    const getOllamaUrl = () => {
        const profileId = profileService.getActive();
        const settings = settingsService.get(profileId);
        return settings.ollamaUrl || 'http://localhost:11434';
    };
    const aiService = new ai_service_1.AIService(db, getOllamaUrl);
    electron_1.ipcMain.handle(ipc_channels_1.IPC.AI_MODELS_LIST, async () => {
        return aiService.listModels();
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.AI_CONVERSATION_CREATE, (_event, { model, systemPrompt }) => {
        const profileId = profileService.getActive();
        return aiService.createConversation(profileId, model, systemPrompt);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.AI_CONVERSATION_GET_ALL, () => {
        const profileId = profileService.getActive();
        return aiService.getConversations(profileId);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.AI_CONVERSATION_DELETE, (_event, { id }) => {
        aiService.deleteConversation(id);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.AI_MESSAGES_GET, (_event, { conversationId }) => {
        return aiService.getMessages(conversationId);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.AI_SEND, async (_event, args) => {
        const parsed = validators_1.AiSendSchema.safeParse(args);
        if (!parsed.success)
            return { error: 'Invalid arguments' };
        const { conversationId, content, model } = parsed.data;
        const win = wm.getMain();
        try {
            await aiService.sendMessage(conversationId, content, model, (delta, done) => {
                if (win && !win.isDestroyed()) {
                    win.webContents.send(ipc_channels_1.IPC.AI_CHUNK, { conversationId, delta, done });
                }
            });
            return { ok: true };
        }
        catch (err) {
            if (win && !win.isDestroyed()) {
                win.webContents.send(ipc_channels_1.IPC.AI_ERROR, { conversationId, message: err.message });
            }
            return { ok: false, error: err.message };
        }
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.AI_SUMMARIZE_PAGE, async (_event, { conversationId, pageText, model }) => {
        const win = wm.getMain();
        const summaryPrompt = `Please summarize the following web page content concisely:\n\n${pageText.slice(0, 8000)}`;
        try {
            await aiService.sendMessage(conversationId, summaryPrompt, model, (delta, done) => {
                if (win && !win.isDestroyed()) {
                    win.webContents.send(ipc_channels_1.IPC.AI_CHUNK, { conversationId, delta, done });
                }
            });
            return { ok: true };
        }
        catch (err) {
            if (win && !win.isDestroyed()) {
                win.webContents.send(ipc_channels_1.IPC.AI_ERROR, { conversationId, message: err.message });
            }
            return { ok: false, error: err.message };
        }
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.AI_ABORT, (_event, { conversationId }) => {
        aiService.abort(conversationId);
        return { ok: true };
    });
}
