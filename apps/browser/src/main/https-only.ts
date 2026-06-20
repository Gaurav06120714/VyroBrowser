import { Session } from 'electron';

// HTTPS-only mode: upgrade top-level http:// navigations to https://. Resource
// sub-requests are left alone to avoid breaking mixed-content-tolerant pages;
// if the https upgrade fails the renderer shows the standard error page.

let enabled = false;

export function setHttpsOnly(value: boolean): void {
  enabled = value;
}

export function isHttpsOnly(): boolean {
  return enabled;
}

export function installHttpsOnlyUpgrade(session: Session): void {
  session.webRequest.onBeforeRequest((details, callback) => {
    if (
      enabled &&
      details.resourceType === 'mainFrame' &&
      details.url.startsWith('http://') &&
      // Never try to upgrade localhost / loopback dev targets.
      !/^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(details.url)
    ) {
      callback({ redirectURL: 'https://' + details.url.slice('http://'.length) });
      return;
    }
    callback({});
  });
}
