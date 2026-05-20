import { spawn, ChildProcess } from 'child_process';

let ttsProcess: ChildProcess | null = null;

export function startTTS(text: string, voice?: string): void {
  stopTTS();
  // Truncate very long texts to avoid OS limits
  const safeText = text.slice(0, 10000);
  const args = voice ? ['-v', voice, safeText] : [safeText];
  ttsProcess = spawn('say', args);
  ttsProcess.on('error', (err) => {
    console.error('TTS error:', err);
    ttsProcess = null;
  });
  ttsProcess.on('exit', () => {
    ttsProcess = null;
  });
}

export function stopTTS(): void {
  if (ttsProcess) {
    ttsProcess.kill('SIGTERM');
    ttsProcess = null;
  }
}
