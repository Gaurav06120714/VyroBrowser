// ─────────────────────────────────────────────────────────────────────────────
// CommandPalette v2 — Cmd+K · smart launcher with recents + keyword search
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTabsStore } from '../../store/tabs.store';
import { useUiStore } from '../../store/ui.store';
import { ipc, IPC } from '../../lib/ipc';
import { useKeywords } from '../../hooks/useKeywords';
import { KeywordSuggestion, IntentType } from '@shared/keyword-engine/types';
import { INTENT_META } from './SuggestionDropdown';

// ── Quick action definitions ──────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { id: 'new-tab',  label: 'New Tab',       sub: 'Open a blank tab',         kbd: '⌘T',  icon: 'M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z' },
  { id: 'close-tab',label: 'Close Tab',     sub: 'Close current tab',         kbd: '⌘W',  icon: 'M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' },
  { id: 'reload',   label: 'Reload Page',   sub: 'Refresh the current tab',   kbd: '⌘R',  icon: 'M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z' },
  { id: 'settings', label: 'Open Settings', sub: 'Configure Vyro Browser',    kbd: '⌘,',  icon: 'M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z' },
  { id: 'ai',       label: 'Open AI Panel', sub: 'Chat with Vyro AI',         kbd: '',    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { id: 'history',  label: 'View History',  sub: 'Browse your history',       kbd: '',    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'bookmarks',label: 'Bookmarks',     sub: 'View saved bookmarks',      kbd: '',    icon: 'M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z' },
];

export const CommandPalette: React.FC = () => {
  const isOpen = useUiStore(s => s.commandPaletteOpen);
  const closeCommandPalette = useUiStore(s => s.closeCommandPalette);
  const openModal = useUiStore(s => s.openModal);
  const setSidebarPanel = useUiStore(s => s.setSidebarPanel);
  const activeTabId = useTabsStore(s => s.activeTabId);

  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recentHistory, setRecentHistory] = useState<KeywordSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { suggestions, getSuggestions, resolve, trackUse, clearSuggestions } = useKeywords();

  // Load recent history when palette opens
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSelectedIdx(0);
    clearSuggestions();
    setTimeout(() => inputRef.current?.focus(), 30);

    ipc.invoke<any[]>(IPC.HISTORY_SEARCH, { query: '', limit: 6 })
      .then(entries => {
        setRecentHistory(entries.slice(0, 5).map(h => ({
          type: 'url' as const,
          label: h.title || h.url,
          sublabel: h.url,
          url: h.url,
          favicon: h.favicon || `https://www.google.com/s2/favicons?sz=32&domain=${new URL(h.url).hostname}`,
          entry: null, score: 50, group: 'suggestions' as const, intent: null,
          usageCount: h.visitCount ?? 0,
        })));
      })
      .catch(() => {});
  }, [isOpen, clearSuggestions]);

  const navigate = useCallback((url: string, keyword?: string) => {
    if (activeTabId) {
      ipc.invoke(IPC.NAV_LOAD_URL, { tabId: activeTabId, url });
      useTabsStore.getState().updateTab(activeTabId, { url });
    }
    if (keyword) trackUse(keyword);
    closeCommandPalette();
  }, [activeTabId, trackUse, closeCommandPalette]);

  const runAction = useCallback((id: string) => {
    switch (id) {
      case 'new-tab':   ipc.invoke(IPC.TABS_CREATE, { url: 'vyro://newtab' }); break;
      case 'close-tab': if (activeTabId) ipc.invoke(IPC.TABS_CLOSE, { tabId: activeTabId }); break;
      case 'reload':    if (activeTabId) ipc.invoke(IPC.NAV_RELOAD, { tabId: activeTabId }); break;
      case 'settings':  openModal('settings'); break;
      case 'ai':        setSidebarPanel('ai'); break;
      case 'history':   setSidebarPanel('history'); break;
      case 'bookmarks': setSidebarPanel('bookmarks'); break;
    }
    closeCommandPalette();
  }, [activeTabId, openModal, setSidebarPanel, closeCommandPalette]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIdx(0);
    getSuggestions(val);
  }, [getSuggestions]);

  const showSearch = query.trim().length > 0;
  const displayItems = showSearch ? suggestions : [];
  const displayActions = showSearch ? [] : QUICK_ACTIONS;
  const totalItems = showSearch ? displayItems.length : displayActions.length;

  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { closeCommandPalette(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, totalItems - 1)); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!showSearch) {
        const a = displayActions[selectedIdx];
        if (a) runAction(a.id);
        return;
      }
      const s = displayItems[selectedIdx];
      if (s) { navigate(s.url, s.entry?.keyword); return; }
      const current = query.trim();
      if (!current) return;
      const match = await resolve(current);
      navigate(match.url, match.entry?.keyword ?? undefined);
    }
  }, [totalItems, showSearch, selectedIdx, displayActions, displayItems, query, runAction, navigate, resolve, closeCommandPalette]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center"
      style={{ paddingTop: '13vh' }}
      onMouseDown={() => closeCommandPalette()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[6px]" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-[640px] mx-4 rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0e0e1a]/98 shadow-[0_28px_80px_-8px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.03)]"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Accent top */}
        <div className="h-px bg-gradient-to-r from-transparent via-vyro-500/40 to-transparent" />

        {/* Search */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <svg className="w-5 h-5 text-vyro-400/60 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search, navigate, or run a command…"
            className="flex-1 bg-transparent text-white text-[15px] placeholder:text-white/20 focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <button onClick={() => { setQuery(''); clearSuggestions(); setSelectedIdx(0); }} className="text-white/25 hover:text-white/60 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <kbd className="text-[11px] text-white/20 bg-white/5 border border-white/10 rounded-md px-2 py-0.5 font-mono">Esc</kbd>
          )}
        </div>

        {/* Body */}
        <div className="max-h-[52vh] overflow-y-auto">
          {/* Quick actions (empty state) */}
          {!showSearch && (
            <>
              <div className="px-4 pt-3 pb-1.5">
                <span className="text-[9px] font-bold tracking-[0.12em] text-white/20 uppercase">Quick Actions</span>
              </div>
              {displayActions.map((a, i) => (
                <div
                  key={a.id}
                  className={['relative flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors', i === selectedIdx ? 'bg-vyro-600/15' : 'hover:bg-white/[0.04]'].join(' ')}
                  onMouseEnter={() => setSelectedIdx(i)}
                  onMouseDown={() => runAction(a.id)}
                >
                  {i === selectedIdx && <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-vyro-500" />}
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white/50" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d={a.icon} clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white/85 font-medium">{a.label}</div>
                    <div className="text-xs text-white/30">{a.sub}</div>
                  </div>
                  {a.kbd && <kbd className="text-[11px] text-white/20 bg-white/5 border border-white/8 rounded-md px-1.5 py-0.5 font-mono">{a.kbd}</kbd>}
                </div>
              ))}

              {/* Recent history */}
              {recentHistory.length > 0 && (
                <>
                  <div className="mx-4 my-2 border-t border-white/[0.05]" />
                  <div className="px-4 pb-1.5">
                    <span className="text-[9px] font-bold tracking-[0.12em] text-white/20 uppercase">Recent</span>
                  </div>
                  {recentHistory.map((h, i) => {
                    const idx = displayActions.length + i;
                    return (
                      <div
                        key={h.url}
                        className={['relative flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors', idx === selectedIdx ? 'bg-vyro-600/15' : 'hover:bg-white/[0.04]'].join(' ')}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        onMouseDown={() => navigate(h.url)}
                      >
                        {idx === selectedIdx && <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-vyro-500" />}
                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                          {h.favicon ? <img src={h.favicon} className="w-4 h-4 rounded-sm object-contain" alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : (
                            <svg className="w-3.5 h-3.5 text-white/25" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] text-white/80 truncate font-medium">{h.label}</div>
                          <div className="text-[11px] text-white/30 truncate">{h.sublabel}</div>
                        </div>
                        <span className="text-[10px] text-white/15">history</span>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}

          {/* Search results */}
          {showSearch && displayItems.map((s, i) => {
            const intentMeta = s.intent ? INTENT_META[s.intent] : null;
            return (
              <div
                key={s.url + i}
                className={['relative flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors', i === selectedIdx ? 'bg-vyro-600/15' : 'hover:bg-white/[0.04]'].join(' ')}
                onMouseEnter={() => setSelectedIdx(i)}
                onMouseDown={() => navigate(s.url, s.entry?.keyword)}
              >
                {i === selectedIdx && <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-vyro-500" />}
                <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center overflow-hidden shrink-0">
                  {s.favicon ? (
                    <img src={s.favicon} className="w-4 h-4 object-contain rounded-sm" alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <svg className="w-3.5 h-3.5 text-white/25" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/85 truncate font-medium">{s.label}</div>
                  <div className="text-xs text-white/30 truncate">{s.sublabel}</div>
                </div>
                {intentMeta && (
                  <span className={['text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0', intentMeta.cls].join(' ')}>{intentMeta.label}</span>
                )}
                {s.type === 'smart-search' && !intentMeta && (
                  <span className="text-[10px] text-vyro-400/70 bg-vyro-500/10 border border-vyro-500/20 px-1.5 py-0.5 rounded-md">search</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.05] bg-white/[0.015]">
          <div className="flex items-center gap-2 text-[10px] text-white/20">
            <span>↑↓ navigate</span><span className="text-white/10">·</span>
            <span>↵ open</span><span className="text-white/10">·</span>
            <span>Esc close</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-vyro-500/40 font-medium">⌘K</span>
            <span className="text-[10px] text-white/15">Command Palette</span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
