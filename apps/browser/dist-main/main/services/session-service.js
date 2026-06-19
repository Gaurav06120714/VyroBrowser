"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const electron_1 = require("electron");
const constants_1 = require("../../shared/constants");
const sessionCache = new Map();
class SessionService {
    getSession(profileId) {
        if (sessionCache.has(profileId)) {
            return sessionCache.get(profileId);
        }
        const s = electron_1.session.fromPartition(`${constants_1.WEBVIEW_PARTITION_PREFIX}${profileId}`, { cache: true });
        sessionCache.set(profileId, s);
        return s;
    }
    configureSession(profileId) {
        const s = this.getSession(profileId);
        s.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
        s.setPermissionRequestHandler((_webContents, permission, callback) => {
            const allowedByDefault = ['notifications', 'media', 'geolocation', 'clipboard-read'];
            if (allowedByDefault.includes(permission)) {
                callback(true);
            }
            else {
                callback(false);
            }
        });
        s.on('will-download', (_event, item) => {
            item.on('updated', (_e, state) => {
                if (state === 'interrupted') {
                    console.warn('Download interrupted', item.getURL());
                }
            });
        });
    }
    async clearSession(profileId) {
        const s = this.getSession(profileId);
        await s.clearStorageData();
        await s.clearCache();
    }
}
exports.SessionService = SessionService;
