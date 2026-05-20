// ─────────────────────────────────────────────────────────────────────────────
// NewTab — the new-tab page shown when a tab has no URL yet.
//
// Contains a centered search bar (with keyword suggestions) and a speed-dial
// grid of frequently visited sites.  Navigation works by calling updateTab()
// only — no IPC needed here because WebviewContainer will unmount this page
// and mount WebviewPane as soon as tab.url changes to a real URL.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useCallback } from 'react';
import { useTabsStore } from '../store/tabs.store';
import { ipc, IPC } from '../lib/ipc';
import { useKeywords } from '../hooks/useKeywords';
import { SuggestionDropdown } from '../components/browser/SuggestionDropdown';
import { NEW_TAB_URL } from '@shared/constants';

const SPEED_DIAL = [
  { label: 'YouTube', url: 'https://youtube.com', favicon: 'https://www.youtube.com/favicon.ico' },
  { label: 'Google',  url: 'https://google.com',  favicon: 'https://www.google.com/favicon.ico' },
  { label: 'Reddit',  url: 'https://reddit.com',  favicon: 'https://www.reddit.com/favicon.ico' },
  { label: 'GitHub',  url: 'https://github.com',  favicon: 'https://github.com/favicon.ico' },
  { label: 'Netflix', url: 'https://netflix.com', favicon: 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico' },
  { label: 'X',       url: 'https://x.com',       favicon: 'https://x.com/favicon.ico' },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export const NewTab: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const activeTabId = useTabsStore(s => s.activeTabId);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigatingRef = useRef(false);

  const { suggestions, getSuggestions, resolve, trackUse, clearSuggestions } = useKeywords();

  // Navigate by updating the tab URL in the store.
  // When tab.url changes from NEW_TAB_URL to a real URL,
  // WebviewContainer unmounts NewTab and mounts WebviewPane with the new URL.
  const navigate = useCallback((targetUrl: string, keyword?: string) => {
    if (!activeTabId || !targetUrl) return;
    useTabsStore.getState().updateTab(activeTabId, {
      url: targetUrl,
      isLoading: true,
      title: 'Loading…',
      favicon: null,
    });
    if (keyword) trackUse(keyword);
    clearSuggestions();
    setSelectedIdx(-1);
    navigatingRef.current = false;
  }, [activeTabId, trackUse, clearSuggestions]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIdx(-1);
    navigatingRef.current = false;
    getSuggestions(val);
    setAnchorRect(wrapperRef.current?.getBoundingClientRect() ?? null);
  }, [getSuggestions]);

  const handleKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, suggestions.length - 1)); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, -1)); return; }
    if (e.key === 'Escape')    { setQuery(''); clearSuggestions(); setSelectedIdx(-1); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (navigatingRef.current) return;
      navigatingRef.current = true;

      if (selectedIdx >= 0 && suggestions[selectedIdx]) {
        const s = suggestions[selectedIdx];
        navigate(s.url, s.entry?.keyword);
        return;
      }
      const current = query.trim();
      if (!current) { navigatingRef.current = false; return; }
      const match = await resolve(current);
      navigate(match.url, match.entry?.keyword ?? undefined);
    }
  }, [suggestions, selectedIdx, query, resolve, navigate, clearSuggestions]);

  const showSuggestions = query.length > 0 && suggestions.length > 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 bg-[#0f0f10] overflow-auto p-8 select-none">
      {/* Logo + greeting */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-vyro-500 to-vyro-700 flex items-center justify-center shadow-lg shadow-vyro-600/30">
          <svg className="w-6 h-6 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-white/40 text-sm">{getGreeting()}</p>
      </div>

      {/* Search bar */}
      <div ref={wrapperRef} className="w-full max-w-xl">
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/6 border border-white/8 shadow-xl focus-within:border-vyro-500/40 focus-within:bg-white/8 focus-within:shadow-vyro-500/10 transition-all duration-200">
          <svg className="w-4 h-4 text-white/30 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search or navigate…"
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/20 focus:outline-none"
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { setQuery(''); clearSuggestions(); setSelectedIdx(-1); inputRef.current?.focus(); }}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {showSuggestions && (
          <SuggestionDropdown
            suggestions={suggestions}
            selectedIdx={selectedIdx}
            anchorRect={anchorRect}
            onSelect={s => navigate(s.url, s.entry?.keyword)}
            onHover={setSelectedIdx}
          />
        )}
      </div>

      {/* Speed dial */}
      <div className="w-full max-w-xl">
        <p className="text-white/20 text-[10px] font-semibold uppercase tracking-widest mb-3 text-center">Quick Access</p>
        <div className="grid grid-cols-6 gap-3">
          {SPEED_DIAL.map(site => (
            <button key={site.url} onClick={() => navigate(site.url)} className="flex flex-col items-center gap-2 group focus:outline-none">
              <div className="w-12 h-12 rounded-2xl bg-white/6 border border-white/8 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/15 transition-all duration-150 group-hover:scale-105">
                <img src={site.favicon} alt={site.label} className="w-6 h-6 rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <span className="text-xs text-white/35 group-hover:text-white/65 transition-colors truncate max-w-full">{site.label}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-white/10 text-xs mt-4">Vyro Browser · AI-powered browsing</p>
    </div>
  );
};
