import { ipcMain, BrowserWindow } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { WindowManager } from '../window-manager';

export function registerWindowControlsIpc(wm: WindowManager): void {
  ipcMain.handle(IPC.WINDOW_MINIMIZE, () => {
    wm.getMain()?.minimize();
  });

  ipcMain.handle(IPC.WINDOW_MAXIMIZE, () => {
    const win = wm.getMain();
    if (!win) return;
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  ipcMain.handle(IPC.WINDOW_CLOSE, () => {
    wm.getMain()?.close();
  });

  function wireEvents(win: BrowserWindow) {
    win.on('maximize', () => {
      win.webContents.send(IPC.WINDOW_MAXIMIZED);
    });
    win.on('unmaximize', () => {
      win.webContents.send(IPC.WINDOW_RESTORED);
    });
    win.on('restore', () => {
      win.webContents.send(IPC.WINDOW_RESTORED);
    });
  }

  const existing = wm.getMain();
  if (existing) wireEvents(existing);
}
