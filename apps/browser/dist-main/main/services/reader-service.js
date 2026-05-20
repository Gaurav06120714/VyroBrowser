"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReaderService = void 0;
const electron_1 = require("electron");
class ReaderService {
    async extract(url) {
        return new Promise((resolve, reject) => {
            const win = new electron_1.BrowserWindow({
                show: false,
                webPreferences: {
                    javascript: true,
                    contextIsolation: true,
                },
            });
            const timeout = setTimeout(() => {
                if (!win.isDestroyed()) {
                    win.destroy();
                    reject(new Error('Timeout extracting reader content'));
                }
            }, 15000);
            win.loadURL(url).catch(() => {
                clearTimeout(timeout);
                if (!win.isDestroyed())
                    win.destroy();
                reject(new Error('Failed to load URL'));
            });
            win.webContents.once('did-finish-load', async () => {
                try {
                    const result = await win.webContents.executeJavaScript(`
            (function() {
              const title = document.title || '';
              const bylineMeta = document.querySelector('[name="author"]');
              const bylineEl = document.querySelector('.author, .byline, [itemprop="author"]');
              const byline = (bylineMeta ? bylineMeta.getAttribute('content') : bylineEl ? bylineEl.textContent : '') || '';

              let article = document.querySelector('article') ||
                            document.querySelector('[role="main"]') ||
                            document.querySelector('main') ||
                            document.querySelector('.post-content, .article-body, .entry-content') ||
                            document.body;

              // Clone to avoid modifying the page
              const clone = article.cloneNode(true);

              // Remove unwanted elements
              const toRemove = clone.querySelectorAll(
                'script,style,nav,header,footer,aside,' +
                '.ad,.advertisement,.sidebar,.comments,' +
                '[class*="ad-"],[id*="ad-"],[class*="social"],[class*="share"]'
              );
              toRemove.forEach(function(el) { el.remove(); });

              return {
                title: title,
                byline: byline.trim(),
                content: clone.innerHTML,
                excerpt: (clone.textContent || '').trim().slice(0, 200),
              };
            })()
          `);
                    clearTimeout(timeout);
                    win.destroy();
                    resolve(result);
                }
                catch (err) {
                    clearTimeout(timeout);
                    win.destroy();
                    reject(err);
                }
            });
            win.webContents.once('did-fail-load', () => {
                clearTimeout(timeout);
                if (!win.isDestroyed())
                    win.destroy();
                reject(new Error('Failed to load URL'));
            });
        });
    }
}
exports.ReaderService = ReaderService;
