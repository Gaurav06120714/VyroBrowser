"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTTSSupported = isTTSSupported;
exports.startTTS = startTTS;
exports.stopTTS = stopTTS;
const child_process_1 = require("child_process");
const process_1 = require("process");
let ttsProcess = null;
function commandExists(cmd) {
    try {
        (0, child_process_1.execSync)(`which ${cmd}`, { stdio: 'ignore' });
        return true;
    }
    catch {
        return false;
    }
}
function isTTSSupported() {
    if (process_1.platform === 'darwin')
        return true;
    if (process_1.platform === 'win32')
        return true; // PowerShell always available on Windows
    if (process_1.platform === 'linux')
        return commandExists('espeak') || commandExists('festival');
    return false;
}
function startTTS(text, voice) {
    stopTTS();
    const safeText = text.slice(0, 10000);
    if (process_1.platform === 'darwin') {
        const args = voice ? ['-v', voice, safeText] : [safeText];
        ttsProcess = (0, child_process_1.spawn)('say', args);
        ttsProcess.on('error', () => { ttsProcess = null; });
        ttsProcess.on('exit', () => { ttsProcess = null; });
        return { ok: true };
    }
    if (process_1.platform === 'win32') {
        // Use PowerShell Speech Synthesis
        const escaped = safeText.replace(/'/g, "''");
        const ps = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; ${voice ? `$s.SelectVoice('${voice}');` : ''} $s.Speak('${escaped}')`;
        ttsProcess = (0, child_process_1.spawn)('powershell.exe', ['-NoProfile', '-Command', ps]);
        ttsProcess.on('error', () => { ttsProcess = null; });
        ttsProcess.on('exit', () => { ttsProcess = null; });
        return { ok: true };
    }
    if (process_1.platform === 'linux') {
        if (commandExists('espeak')) {
            const args = voice ? ['-v', voice, safeText] : [safeText];
            ttsProcess = (0, child_process_1.spawn)('espeak', args);
            ttsProcess.on('error', () => { ttsProcess = null; });
            ttsProcess.on('exit', () => { ttsProcess = null; });
            return { ok: true };
        }
        if (commandExists('festival')) {
            ttsProcess = (0, child_process_1.spawn)('festival', ['--tts']);
            ttsProcess.stdin?.write(safeText);
            ttsProcess.stdin?.end();
            ttsProcess.on('error', () => { ttsProcess = null; });
            ttsProcess.on('exit', () => { ttsProcess = null; });
            return { ok: true };
        }
        return { ok: false, error: 'No TTS engine found. Install espeak or festival.' };
    }
    return { ok: false, error: `TTS not supported on platform: ${process_1.platform}` };
}
function stopTTS() {
    if (ttsProcess) {
        ttsProcess.kill('SIGTERM');
        ttsProcess = null;
    }
}
