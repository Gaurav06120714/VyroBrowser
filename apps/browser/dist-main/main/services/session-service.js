"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const electron_1 = require("electron");
const constants_1 = require("../../shared/constants");
const permissions_1 = require("../ipc/permissions");
const https_only_1 = require("../https-only");
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
        // UA is set globally via app.userAgentFallback; permission requests go
        // through the in-app PermissionDialog rather than being auto-granted.
        (0, permissions_1.attachPermissionHandler)(s);
        (0, https_only_1.installHttpsOnlyUpgrade)(s);
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
