"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReaderService = void 0;
const electron_1 = require("electron");

let hiddenWin = null;
let extractionBusy = false;
const extractionQueue = [];
function getOrCreateHiddenWin() {
    if (hiddenWin && !hiddenWin.isDestroyed())
        return hiddenWin;
    hiddenWin = new electron_1.BrowserWindow({
        show: false,
        width: 1280,
        height: 800,
        webPreferences: {
            javascript: true,
            contextIsolation: true,
        },
    });
    hiddenWin.on('closed', () => { hiddenWin = null; });
    return hiddenWin;
}
function acquireWin() {
    if (!extractionBusy) {
        extractionBusy = true;
        return Promise.resolve();
    }
    return new Promise(resolve => { extractionQueue.push(resolve); });
}
function releaseWin() {
    const next = extractionQueue.shift();
    if (next) {
        next();
    }
    else {
        extractionBusy = false;
    }
}
class ReaderService {
    async extract(url) {
        await acquireWin();
        const win = getOrCreateHiddenWin();
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                releaseWin();
                reject(new Error('Timeout extracting reader content'));
            }, 15000);
            win.loadURL(url).catch((err) => {
                clearTimeout(timeout);
                releaseWin();
                reject(err instanceof Error ? err : new Error('Failed to load URL'));
            });
            win.webContents.once('did-finish-load', async () => {
                try {
                    const html = await win.webContents.executeJavaScript('document.documentElement.outerHTML');
                    clearTimeout(timeout);
                    releaseWin();
                    
                    let article;
                    try {
                        
                        const { JSDOM } = require('jsdom');
                        
                        const { Readability } = require('@mozilla/readability');
                        const dom = new JSDOM(html, { url });
                        const parsed = new Readability(dom.window.document).parse();
                        if (parsed) {
                            article = {
                                title: parsed.title ?? '',
                                content: parsed.content ?? '',
                                byline: parsed.byline ?? '',
                                excerpt: parsed.excerpt ?? '',
                                siteName: parsed.siteName ?? undefined,
                                textContent: parsed.textContent ?? undefined,
                            };
                        }
                        else {
                            throw new Error('Readability returned null');
                        }
                    }
                    catch {
                        
                        article = await win.webContents.executeJavaScript(`
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
                const clone = article.cloneNode(true);
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
                    }
                    resolve(article);
                }
                catch (err) {
                    clearTimeout(timeout);
                    releaseWin();
                    reject(err);
                }
            });
            win.webContents.once('did-fail-load', () => {
                clearTimeout(timeout);
                releaseWin();
                reject(new Error('Failed to load URL'));
            });
        });
    }
}
exports.ReaderService = ReaderService;
