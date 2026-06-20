import { session, Session } from 'electron';
import { WEBVIEW_PARTITION_PREFIX } from '../../shared/constants';
import { attachPermissionHandler } from '../ipc/permissions';
import { installHttpsOnlyUpgrade } from '../https-only';

const sessionCache = new Map<string, Session>();

export class SessionService {
  getSession(profileId: string): Session {
    if (sessionCache.has(profileId)) {
      return sessionCache.get(profileId)!;
    }
    const s = session.fromPartition(`${WEBVIEW_PARTITION_PREFIX}${profileId}`, { cache: true });
    sessionCache.set(profileId, s);
    return s;
  }

  configureSession(profileId: string): void {
    const s = this.getSession(profileId);

    // UA is set globally via app.userAgentFallback; permission requests go
    // through the in-app PermissionDialog rather than being auto-granted.
    attachPermissionHandler(s);
    installHttpsOnlyUpgrade(s);

    s.on('will-download', (_event, item) => {
      
      item.on('updated', (_e, state) => {
        if (state === 'interrupted') {
          console.warn('Download interrupted', item.getURL());
        }
      });
    });
  }

  async clearSession(profileId: string): Promise<void> {
    const s = this.getSession(profileId);
    await s.clearStorageData();
    await s.clearCache();
  }
}
