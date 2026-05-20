import { ipcMain, webContents } from 'electron';
import { IPC } from '../../shared/ipc-channels';

export function registerFindIpc(): void {
  ipcMain.handle(IPC.FIND_START, (_event, { tabId, text, forward }: { tabId: string; text: string; forward?: boolean }) => {
    // Find the webContents associated with the webview for this tab
    // The webview renders in a guest WebContents; we search by the tabId
    // stored in the webContents URL or via a known ID map
    const allWebContents = webContents.getAllWebContents();
    const target = allWebContents.find(wc => {
      try {
        const url = wc.getURL();
        return url && !url.startsWith('devtools://') && wc.id.toString() === tabId;
      } catch { return false; }
    });

    if (target) {
      target.findInPage(text, { findNext: false, forward: forward !== false });
      return { ok: true };
    }
    return { ok: false };
  });

  ipcMain.handle(IPC.FIND_STOP, (_event, { tabId }: { tabId: string }) => {
    const allWebContents = webContents.getAllWebContents();
    const target = allWebContents.find(wc => {
      try {
        return wc.id.toString() === tabId;
      } catch { return false; }
    });

    if (target) {
      target.stopFindInPage('clearSelection');
    }
    return { ok: true };
  });
}
