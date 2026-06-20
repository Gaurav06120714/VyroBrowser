import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { KeywordService } from '../services/keyword-service';

export function registerKeywordsIpc(keywordService: KeywordService): void {

  ipcMain.handle(IPC.KEYWORDS_RESOLVE, (_e, { input, searchEngine }: { input: string; searchEngine?: string }) => {
    return keywordService.resolve(input, searchEngine);
  });

  ipcMain.handle(IPC.KEYWORDS_SUGGEST, (_e, { input, max }: { input: string; max?: number }) => {
    return keywordService.suggest(input, max ?? 8);
  });

  ipcMain.handle(IPC.KEYWORDS_GET_ALL, () => {
    return keywordService.getAll();
  });

  ipcMain.handle(IPC.KEYWORDS_SAVE_CUSTOM, (_e, data: Parameters<KeywordService['saveCustom']>[0]) => {
    return keywordService.saveCustom(data);
  });

  ipcMain.handle(IPC.KEYWORDS_DELETE_CUSTOM, (_e, { keyword }: { keyword: string }) => {
    keywordService.deleteCustom(keyword);
    return { ok: true };
  });

  ipcMain.handle(IPC.KEYWORDS_TOGGLE, (_e, { keyword, enabled, isBuiltin }: { keyword: string; enabled: boolean; isBuiltin: boolean }) => {
    if (isBuiltin) {
      keywordService.toggleBuiltin(keyword, enabled);
    } else {
      
      const { custom } = keywordService.getAll();
      const existing = custom.find(c => c.keyword === keyword);
      if (existing) {
        keywordService.saveCustom({ ...existing, enabled });
      }
    }
    return { ok: true };
  });

  ipcMain.handle(IPC.KEYWORDS_EXPORT, () => {
    return keywordService.exportJson();
  });

  ipcMain.handle(IPC.KEYWORDS_IMPORT, (_e, { json }: { json: string }) => {
    return keywordService.importJson(json);
  });

  ipcMain.handle(IPC.KEYWORDS_TRACK_USE, (_e, { keyword }: { keyword: string }) => {
    keywordService.trackUse(keyword);
    return { ok: true };
  });

  ipcMain.handle(IPC.KEYWORDS_GET_USAGE, () => {
    return keywordService.getUsage();
  });

  ipcMain.handle(IPC.KEYWORDS_RESET, () => {
    keywordService.resetBuiltinOverrides();
    return { ok: true };
  });
}
