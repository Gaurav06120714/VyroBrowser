import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Tab } from '@shared/types/tab';
import { useTabsStore } from '../../store/tabs.store';
import { useUiStore } from '../../store/ui.store';
import { WEBVIEW_PARTITION_PREFIX, NEW_TAB_URL } from '@shared/constants';
import { NewTab } from '../../pages/NewTab';
import { IPC } from '../../lib/ipc';
import { getSiteZoom, originOf } from '../../lib/site-zoom';

interface WebviewElement extends HTMLElement {
  src: string;
  partition: string;
  allowpopups: string;
  useragent: string;
  webpreferences: string;
  getWebContentsId(): number;
  goBack(): void;
  goForward(): void;
  reload(): void;
  stop(): void;
  canGoBack(): boolean;
  canGoForward(): boolean;
  loadURL(url: string): Promise<void>;
  executeJavaScript(code: string): Promise<unknown>;
  isLoading(): boolean;
}

interface WebviewPaneProps {
  tab: Tab;
  active: boolean;
}

function renderWebview(
  tab: Tab,
  ref: React.RefObject<HTMLElement>,
): React.ReactElement {
  return React.createElement('webview', {
    ref,
    src: tab.url,
    partition: `${WEBVIEW_PARTITION_PREFIX}${tab.profileId}`,
    allowpopups: 'true',
    // UA comes from app.userAgentFallback (main); node integration disabled and
    // context isolation enforced in main via will-attach-webview.
    webpreferences: 'contextIsolation=yes,nodeIntegration=no',
    style: { flex: 1, width: '100%', height: '100%', border: 'none' },
  });
}

function isNewTab(url: string): boolean {
  return !url || url === NEW_TAB_URL || url === 'about:blank';
}


const WebviewSkeleton: React.FC = () => (
  <div className="absolute inset-0 z-10 bg-[#0f0f10] flex flex-col gap-3 p-5 pointer-events-none animate-pulse">
    {}
    <div className="h-7 rounded-lg bg-white/8 w-3/4 mx-auto" />
    {}
    <div className="flex flex-col gap-3 mt-4 flex-1">
      <div className="h-5 rounded-md bg-white/6 w-full" />
      <div className="h-5 rounded-md bg-white/6 w-5/6" />
      <div className="h-5 rounded-md bg-white/5 w-4/6" />
      <div className="h-3 rounded-md bg-white/4 w-full mt-2" />
      <div className="h-3 rounded-md bg-white/4 w-11/12" />
      <div className="h-3 rounded-md bg-white/4 w-3/4" />
      <div className="h-3 rounded-md bg-white/3 w-5/6 mt-2" />
      <div className="h-3 rounded-md bg-white/3 w-2/3" />
    </div>
  </div>
);

export const WebviewPane: React.FC<WebviewPaneProps> = ({ tab, active }) => {
  const webviewRef = useRef<WebviewElement | null>(null);
  const updateTab = useTabsStore(s => s.updateTab);
  const registeredRef = useRef(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [loadError, setLoadError] = useState<{ code: number; description: string; url: string } | null>(null);

  const handleDomReady = useCallback(() => {
    const wv = webviewRef.current;
    if (!wv || registeredRef.current) return;
    registeredRef.current = true;

    try {
      const wcId = wv.getWebContentsId();
      
      if (window.vyro) {
        window.vyro.invoke('webview:register' as never, { tabId: tab.id, webContentsId: wcId });
      }

      updateTab(tab.id, {
        canGoBack: wv.canGoBack(),
        canGoForward: wv.canGoForward(),
      });
    } catch {
      
    }
  }, [tab.id, updateTab]);

  const handleDidFinishLoad = useCallback(async () => {
    const wv = webviewRef.current;
    if (!wv) return;

    // Restore the persisted per-origin zoom for this page.
    try {
      const loadedUrl = (wv as unknown as { getURL(): string }).getURL?.() ?? tab.url;
      const siteZoom = getSiteZoom(originOf(loadedUrl));
      window.vyro.invoke(IPC.NAV_ZOOM as never, { tabId: tab.id, factor: siteZoom });
      if (active) useUiStore.getState().setZoomLevel(siteZoom);
    } catch {
      /* ignore */
    }

    try {
      const currentUrl = (wv as unknown as { getURL(): string }).getURL?.() ?? tab.url;
      if (!currentUrl || isNewTab(currentUrl)) return;
      const origin = new URL(currentUrl).hostname;
      if (!origin) return;
      const injection = await window.vyro.invoke(IPC.INJECTIONS_GET_FOR_ORIGIN as never, { origin }) as {
        css: string; js: string; enabled: boolean;
      } | null;
      if (!injection || !injection.enabled) return;
      if (injection.css?.trim()) {
        await (wv as unknown as { insertCSS(css: string): Promise<void> }).insertCSS(injection.css);
      }
      if (injection.js?.trim()) {
        await (wv as unknown as { executeJavaScript(code: string): Promise<unknown> }).executeJavaScript(
          `(function(){\n${injection.js}\n})()`
        );
      }
    } catch {

    }
  }, [tab.url, tab.id, active]);

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    const onStartLoading = () => {
      setLocalLoading(true);
      setLoadError(null);
      updateTab(tab.id, { isLoading: true });
    };

    const onDidFailLoad = (e: Event) => {
      const ev = e as unknown as { errorCode: number; errorDescription: string; validatedURL: string; isMainFrame: boolean };
      // Ignore subframe failures and user-aborted loads (-3 = ERR_ABORTED).
      if (ev.isMainFrame === false || ev.errorCode === -3) return;
      setLocalLoading(false);
      setLoadError({ code: ev.errorCode, description: ev.errorDescription, url: ev.validatedURL || tab.url });
      updateTab(tab.id, { isLoading: false });
    };

    const onStopLoading = () => {
      setLocalLoading(false);
      updateTab(tab.id, {
        isLoading: false,
        canGoBack: wv.canGoBack(),
        canGoForward: wv.canGoForward(),
      });
    };

    const onTitleUpdated = (e: Event) => {
      const ev = e as CustomEvent<{ title: string }>;
      updateTab(tab.id, { title: ev.detail?.title ?? (e as unknown as { title: string }).title });
    };

    const onFaviconUpdated = (e: Event) => {
      const ev = e as unknown as { favicons: string[] };
      const favicon = ev.favicons?.[0] ?? null;
      updateTab(tab.id, { favicon });
    };

    const onDidNavigate = (e: Event) => {
      const ev = e as unknown as { url: string };
      updateTab(tab.id, {
        url: ev.url,
        canGoBack: wv.canGoBack(),
        canGoForward: wv.canGoForward(),
        isLoading: false,
      });
    };

    const onCrashed = () => {
      updateTab(tab.id, { isLoading: false, title: 'Tab Crashed' });
    };

    wv.addEventListener('dom-ready', handleDomReady);
    wv.addEventListener('did-finish-load', handleDidFinishLoad);
    wv.addEventListener('did-start-loading', onStartLoading);
    wv.addEventListener('did-fail-load', onDidFailLoad);
    wv.addEventListener('did-stop-loading', onStopLoading);
    wv.addEventListener('page-title-updated', onTitleUpdated);
    wv.addEventListener('page-favicon-updated', onFaviconUpdated);
    wv.addEventListener('did-navigate', onDidNavigate);
    wv.addEventListener('did-navigate-in-page', onDidNavigate);
    wv.addEventListener('crashed', onCrashed);

    return () => {
      wv.removeEventListener('dom-ready', handleDomReady);
      wv.removeEventListener('did-finish-load', handleDidFinishLoad);
      wv.removeEventListener('did-start-loading', onStartLoading);
      wv.removeEventListener('did-fail-load', onDidFailLoad);
      wv.removeEventListener('did-stop-loading', onStopLoading);
      wv.removeEventListener('page-title-updated', onTitleUpdated);
      wv.removeEventListener('page-favicon-updated', onFaviconUpdated);
      wv.removeEventListener('did-navigate', onDidNavigate);
      wv.removeEventListener('did-navigate-in-page', onDidNavigate);
      wv.removeEventListener('crashed', onCrashed);
    };
  }, [tab.id, handleDomReady, handleDidFinishLoad, updateTab]);

  const isCrashed = tab.title === 'Tab Crashed';
  const showNewTab = isNewTab(tab.url);

  return (
    <div
      className="flex flex-col flex-1 overflow-hidden"
      style={{ display: active ? 'flex' : 'none' }}
    >
      {showNewTab ? (
        <NewTab />
      ) : isCrashed ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#0f0f10] text-white/50">
          <svg className="w-12 h-12 text-red-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm">This tab crashed</p>
          <button
            onClick={() => {
              const wv = webviewRef.current;
              if (wv) wv.reload();
              updateTab(tab.id, { title: tab.url, isLoading: false });
            }}
            className="px-4 py-1.5 text-sm bg-white/8 hover:bg-white/12 rounded-lg border border-white/10 transition-colors"
          >
            Reload
          </button>
        </div>
      ) : (
        <div className="relative flex flex-col flex-1 overflow-hidden">
          {localLoading && <WebviewSkeleton />}
          {loadError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#0f0f10] text-white/60 px-6 text-center">
              <svg className="w-12 h-12 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M12 12h.01" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white/80">This page can't be reached</p>
                <p className="text-xs text-white/40 mt-1 break-all max-w-md">{loadError.url}</p>
                <p className="text-xs text-white/30 mt-2 font-mono">
                  {loadError.description} ({loadError.code})
                </p>
              </div>
              <button
                onClick={() => {
                  const wv = webviewRef.current;
                  setLoadError(null);
                  if (wv) {
                    try { wv.loadURL(loadError.url); } catch { wv.reload(); }
                  }
                }}
                className="px-4 py-1.5 text-sm bg-white/8 hover:bg-white/12 rounded-lg border border-white/10 transition-colors"
              >
                Try again
              </button>
            </div>
          )}
          <div
            className="flex flex-col flex-1"
            style={{
              opacity: localLoading ? 0 : 1,
              transition: 'opacity 200ms ease-out',
            }}
          >
            {renderWebview(tab, webviewRef as React.RefObject<HTMLElement>)}
          </div>
        </div>
      )}
    </div>
  );
};
