import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTabsStore } from '../../store/tabs.store';
import { useUiStore } from '../../store/ui.store';
import { useAIStore } from '../../store/ai.store';
import { ipc, IPC } from '../../lib/ipc';

type MenuType = 'page' | 'link' | 'image' | 'selection';

interface MenuContext {
  linkUrl?: string;
  srcUrl?: string;
  selectionText?: string;
}

interface Props {
  x: number;
  y: number;
  type: MenuType;
  context: MenuContext;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  shortcut?: string;
  action: () => void;
  danger?: boolean;
}

type MenuEntry = MenuItem | 'separator';

const Separator: React.FC = () => (
  <div className="my-1 border-t border-white/8" />
);

const Item: React.FC<{ item: MenuItem }> = ({ item }) => (
  <button
    role="menuitem"
    onClick={item.action}
    className={`vyro-menuitem w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-colors ${
      item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-white/70 hover:bg-white/8 hover:text-white'
    }`}
  >
    <span>{item.label}</span>
    {item.shortcut && <span className="text-white/25 ml-4 font-mono text-[10px]">{item.shortcut}</span>}
  </button>
);

export const ContextMenu: React.FC<Props> = ({ x, y, type, context, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const createTab = useTabsStore(s => s.createTab);
  const activeTab = useTabsStore(s => s.activeTab());
  const setSidebarPanel = useUiStore(s => s.setSidebarPanel);
  const setPendingPrompt = useAIStore(s => s.setPendingPrompt);

  const askAI = (prompt: string) => {
    setPendingPrompt(prompt);
    setSidebarPanel('ai');
    onClose();
  };

  const clampedX = Math.min(x, window.innerWidth - 200);
  const clampedY = Math.min(y, window.innerHeight - 300);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Keyboard navigation: focus first item, Arrow/Home/End move, Esc closes.
  useEffect(() => {
    const root = menuRef.current;
    if (!root) return;
    const items = () => Array.from(root.querySelectorAll<HTMLButtonElement>('.vyro-menuitem'));
    const first = items()[0];
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      const list = items();
      const idx = list.findIndex(el => el === document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); list[(idx + 1) % list.length]?.focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); list[(idx - 1 + list.length) % list.length]?.focus(); }
      else if (e.key === 'Home') { e.preventDefault(); list[0]?.focus(); }
      else if (e.key === 'End') { e.preventDefault(); list[list.length - 1]?.focus(); }
    };
    root.addEventListener('keydown', onKey);
    return () => root.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pageItems: MenuEntry[] = [
    { label: 'Back', shortcut: '⌘[', action: () => { if (activeTab) ipc.invoke(IPC.NAV_GO_BACK, { tabId: activeTab.id }); onClose(); } },
    { label: 'Forward', shortcut: '⌘]', action: () => { if (activeTab) ipc.invoke(IPC.NAV_GO_FORWARD, { tabId: activeTab.id }); onClose(); } },
    { label: 'Reload', shortcut: '⌘R', action: () => { if (activeTab) ipc.invoke(IPC.NAV_RELOAD, { tabId: activeTab.id }); onClose(); } },
    'separator',
    { label: 'Save Page As...', shortcut: '⌘S', action: () => { if (activeTab) ipc.invoke(IPC.PAGE_SAVE, { tabId: activeTab.id }); onClose(); } },
    { label: 'Print...', shortcut: '⌘P', action: () => { if (activeTab) ipc.invoke(IPC.PAGE_PRINT, { tabId: activeTab.id }); onClose(); } },
    'separator',
    { label: 'View Source', shortcut: '⌥⌘U', action: () => { if (activeTab) createTab({ url: `view-source:${activeTab.url}` }); onClose(); } },
    { label: 'Inspect', shortcut: '⌥⌘I', action: () => { if (activeTab) ipc.invoke(IPC.NAV_DEVTOOLS, { tabId: activeTab.id }); onClose(); } },
  ];

  const linkItems: MenuEntry[] = [
    { label: 'Open in New Tab', action: () => { if (context.linkUrl) createTab({ url: context.linkUrl }); onClose(); } },
    'separator',
    { label: 'Copy Link Address', action: () => { if (context.linkUrl) navigator.clipboard.writeText(context.linkUrl); onClose(); } },
    { label: 'Save Link As...', action: () => { if (context.linkUrl && activeTab) ipc.invoke(IPC.PAGE_DOWNLOAD_URL, { tabId: activeTab.id, url: context.linkUrl }); onClose(); } },
  ];

  const imageItems: MenuEntry[] = [
    { label: 'Open Image in New Tab', action: () => { if (context.srcUrl) createTab({ url: context.srcUrl }); onClose(); } },
    'separator',
    { label: 'Save Image As...', action: () => { if (context.srcUrl && activeTab) ipc.invoke(IPC.PAGE_DOWNLOAD_URL, { tabId: activeTab.id, url: context.srcUrl }); onClose(); } },
    { label: 'Copy Image Address', action: () => { if (context.srcUrl) navigator.clipboard.writeText(context.srcUrl); onClose(); } },
  ];

  const selText = context.selectionText ?? '';
  const truncated = selText.length > 20 ? selText.slice(0, 20) + '...' : selText;
  const selectionItems: MenuEntry[] = [
    { label: 'Copy', shortcut: '⌘C', action: () => { navigator.clipboard.writeText(selText); onClose(); } },
    'separator',
    { label: `Search Google for "${truncated}"`, action: () => { createTab({ url: `https://www.google.com/search?q=${encodeURIComponent(selText)}` }); onClose(); } },
    { label: `Define "${truncated}"`, action: () => { createTab({ url: `https://www.google.com/search?q=define+${encodeURIComponent(selText)}` }); onClose(); } },
    'separator',
    { label: 'Explain with AI', action: () => askAI(`Explain the following in simple terms:\n\n"${selText}"`) },
    { label: 'Summarize with AI', action: () => askAI(`Summarize the following concisely:\n\n"${selText}"`) },
    { label: 'Translate to English with AI', action: () => askAI(`Translate the following to English. If it is already English, just say so:\n\n"${selText}"`) },
  ];

  const items = type === 'link' ? linkItems
    : type === 'image' ? imageItems
    : type === 'selection' ? selectionItems
    : pageItems;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-orientation="vertical"
      tabIndex={-1}
      className="fixed z-[9999] bg-[#111113]/95 border border-white/10 rounded-xl shadow-2xl py-1.5 px-1 min-w-[200px] backdrop-blur-sm"
      style={{ left: clampedX, top: clampedY }}
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item, idx) =>
        item === 'separator'
          ? <Separator key={idx} />
          : <Item key={idx} item={item} />
      )}
    </div>,
    document.body
  );
};
