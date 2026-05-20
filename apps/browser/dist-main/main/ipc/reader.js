"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReaderIpc = registerReaderIpc;
const electron_1 = require("electron");
const ipc_channels_1 = require("../../shared/ipc-channels");
const reader_service_1 = require("../services/reader-service");
const tts_service_1 = require("../services/tts-service");
function registerReaderIpc() {
    const readerService = new reader_service_1.ReaderService();
    electron_1.ipcMain.handle(ipc_channels_1.IPC.READER_EXTRACT, async (_event, { url }) => {
        return readerService.extract(url);
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.READER_TTS_START, (_event, { text, voice }) => {
        (0, tts_service_1.startTTS)(text, voice);
        return { ok: true };
    });
    electron_1.ipcMain.handle(ipc_channels_1.IPC.READER_TTS_STOP, () => {
        (0, tts_service_1.stopTTS)();
        return { ok: true };
    });
}
