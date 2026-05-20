import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { ReaderService } from '../services/reader-service';
import { startTTS, stopTTS } from '../services/tts-service';

export function registerReaderIpc(): void {
  const readerService = new ReaderService();

  ipcMain.handle(IPC.READER_EXTRACT, async (_event, { url }: { url: string }) => {
    return readerService.extract(url);
  });

  ipcMain.handle(IPC.READER_TTS_START, (_event, { text, voice }: { text: string; voice?: string }) => {
    startTTS(text, voice);
    return { ok: true };
  });

  ipcMain.handle(IPC.READER_TTS_STOP, () => {
    stopTTS();
    return { ok: true };
  });
}
