"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTTS = startTTS;
exports.stopTTS = stopTTS;
const child_process_1 = require("child_process");
let ttsProcess = null;
function startTTS(text, voice) {
    stopTTS();
    // Truncate very long texts to avoid OS limits
    const safeText = text.slice(0, 10000);
    const args = voice ? ['-v', voice, safeText] : [safeText];
    ttsProcess = (0, child_process_1.spawn)('say', args);
    ttsProcess.on('error', (err) => {
        console.error('TTS error:', err);
        ttsProcess = null;
    });
    ttsProcess.on('exit', () => {
        ttsProcess = null;
    });
}
function stopTTS() {
    if (ttsProcess) {
        ttsProcess.kill('SIGTERM');
        ttsProcess = null;
    }
}
