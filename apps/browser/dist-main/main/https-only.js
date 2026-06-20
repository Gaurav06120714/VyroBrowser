"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setHttpsOnly = setHttpsOnly;
exports.isHttpsOnly = isHttpsOnly;
exports.installHttpsOnlyUpgrade = installHttpsOnlyUpgrade;
// HTTPS-only mode: upgrade top-level http:// navigations to https://. Resource
// sub-requests are left alone to avoid breaking mixed-content-tolerant pages;
// if the https upgrade fails the renderer shows the standard error page.
let enabled = false;
function setHttpsOnly(value) {
    enabled = value;
}
function isHttpsOnly() {
    return enabled;
}
function installHttpsOnlyUpgrade(session) {
    session.webRequest.onBeforeRequest((details, callback) => {
        if (enabled &&
            details.resourceType === 'mainFrame' &&
            details.url.startsWith('http://') &&
            // Never try to upgrade localhost / loopback dev targets.
            !/^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(details.url)) {
            callback({ redirectURL: 'https://' + details.url.slice('http://'.length) });
            return;
        }
        callback({});
    });
}
