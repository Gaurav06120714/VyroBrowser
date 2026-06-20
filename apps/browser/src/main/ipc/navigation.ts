import { ipcMain, webContents, dialog, app } from 'electron';
import path from 'path';
import { IPC } from '../../shared/ipc-channels';
import { tabWebContentsMap } from './tabs';
import { WindowManager } from '../window-manager';
import { NavLoadUrlSchema } from './validators';

export function registerNavigationIpc(wm: WindowManager): void {
  function getWc(tabId: string) {
    const wcId = tabWebContentsMap.get(tabId);
    if (!wcId) return null;
    return webContents.fromId(wcId) ?? null;
  }

  ipcMain.handle(IPC.NAV_LOAD_URL, (_event, args: unknown) => {
    const parsed = NavLoadUrlSchema.safeParse(args);
    if (!parsed.success) return { error: 'Invalid arguments' };
    const { tabId, url } = parsed.data;
    const wc = getWc(tabId);
    if (wc && !wc.isDestroyed()) {
      wc.loadURL(url).catch(() => {});
    }
    return { ok: true };
  });

  ipcMain.handle(IPC.NAV_GO_BACK, (_event, { tabId }: { tabId: string }) => {
    const wc = getWc(tabId);
    if (wc && !wc.isDestroyed() && wc.canGoBack()) wc.goBack();
    return { ok: true };
  });

  ipcMain.handle(IPC.NAV_GO_FORWARD, (_event, { tabId }: { tabId: string }) => {
    const wc = getWc(tabId);
    if (wc && !wc.isDestroyed() && wc.canGoForward()) wc.goForward();
    return { ok: true };
  });

  ipcMain.handle(IPC.NAV_RELOAD, (_event, { tabId, ignoreCache }: { tabId: string; ignoreCache?: boolean }) => {
    const wc = getWc(tabId);
    if (wc && !wc.isDestroyed()) {
      if (ignoreCache) {
        wc.reloadIgnoringCache();
      } else {
        wc.reload();
      }
    }
    return { ok: true };
  });

  ipcMain.handle(IPC.NAV_STOP, (_event, { tabId }: { tabId: string }) => {
    const wc = getWc(tabId);
    if (wc && !wc.isDestroyed()) wc.stop();
    return { ok: true };
  });

  ipcMain.handle(IPC.NAV_ZOOM, (_event, { tabId, factor }: { tabId: string; factor: number }) => {
    const wc = getWc(tabId);
    if (wc && !wc.isDestroyed()) wc.setZoomFactor(factor);
    return { ok: true };
  });

  ipcMain.handle(IPC.NAV_DEVTOOLS, (_event, { tabId }: { tabId: string }) => {
    const wc = getWc(tabId);
    if (wc && !wc.isDestroyed()) {
      if (wc.isDevToolsOpened()) {
        wc.closeDevTools();
      } else {
        wc.openDevTools({ mode: 'detach' });
      }
    }
    return { ok: true };
  });

  ipcMain.handle(IPC.PAGE_PRINT, (_event, { tabId }: { tabId: string }) => {
    const wc = getWc(tabId);
    if (wc && !wc.isDestroyed()) wc.print();
    return { ok: true };
  });

  ipcMain.handle(IPC.PAGE_SAVE, async (_event, { tabId }: { tabId: string }) => {
    const wc = getWc(tabId);
    if (!wc || wc.isDestroyed()) return { ok: false };
    const main = wm.getMain();
    const suggested = (() => {
      try { return new URL(wc.getURL()).hostname || 'page'; } catch { return 'page'; }
    })();
    const result = main
      ? await dialog.showSaveDialog(main, {
          defaultPath: path.join(app.getPath('downloads'), `${suggested}.html`),
        })
      : await dialog.showSaveDialog({
          defaultPath: path.join(app.getPath('downloads'), `${suggested}.html`),
        });
    if (result.canceled || !result.filePath) return { ok: false };
    try {
      await wc.savePage(result.filePath, 'HTMLComplete');
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

  ipcMain.handle(IPC.PAGE_DOWNLOAD_URL, (_event, { tabId, url }: { tabId: string; url: string }) => {
    const wc = getWc(tabId);
    if (wc && !wc.isDestroyed() && url) wc.downloadURL(url);
    return { ok: true };
  });
}
