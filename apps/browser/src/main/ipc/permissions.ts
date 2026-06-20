import { ipcMain, session, Session } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { IPC } from '../../shared/ipc-channels';
import { WindowManager } from '../window-manager';

type PermissionCallback = (granted: boolean) => void;
const pendingCallbacks = new Map<string, PermissionCallback>();

let wmRef: WindowManager | null = null;

// Route a session's permission requests through the in-app PermissionDialog.
// Applied to the default session and every per-profile partition so no webview
// permission is silently auto-granted.
export function attachPermissionHandler(s: Session): void {
  s.setPermissionRequestHandler((_webContents, permission, callback, details) => {
    const win = wmRef?.getMain();
    if (!win || win.isDestroyed()) {
      callback(false);
      return;
    }
    const requestId = uuidv4();
    pendingCallbacks.set(requestId, callback);
    win.webContents.send(IPC.PERMISSION_REQUEST, {
      requestId,
      permission,
      origin: details.requestingUrl,
    });
  });
}

export function registerPermissionsIpc(wm: WindowManager): void {
  wmRef = wm;
  attachPermissionHandler(session.defaultSession);

  ipcMain.handle(IPC.PERMISSION_RESPOND, (_event, { requestId, granted }: { requestId: string; granted: boolean }) => {
    const cb = pendingCallbacks.get(requestId);
    if (cb) {
      pendingCallbacks.delete(requestId);
      cb(granted);
    }
    return { ok: true };
  });
}
