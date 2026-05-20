import { ipcMain, session } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { getStats, setSiteOverride, getAllSiteOverrides, reloadBlocklists } from '../adblock/request-filter';
import { WEBVIEW_PARTITION_PREFIX } from '../../shared/constants';

export function registerAdblockIpc(): void {
  ipcMain.handle(IPC.ADBLOCK_GET_STATS, () => {
    return getStats();
  });

  ipcMain.handle(IPC.ADBLOCK_SITE_TOGGLE, (_event, { origin, enabled }: { origin: string; enabled: boolean }) => {
    setSiteOverride(origin, enabled);
    return { ok: true };
  });

  ipcMain.handle(IPC.ADBLOCK_GET_SITE_RULES, () => {
    return getAllSiteOverrides();
  });

  ipcMain.handle(IPC.ADBLOCK_RELOAD_LISTS, async () => {
    const defaultSess = session.defaultSession;
    await reloadBlocklists(defaultSess);
    // Also reload for all partition sessions
    for (const s of (session as any).getAllSessions ? (session as any).getAllSessions() : []) {
      if (s !== defaultSess) {
        try { await reloadBlocklists(s); } catch { /* ignore */ }
      }
    }
    return { ok: true };
  });
}
