// ─────────────────────────────────────────────────────────────────────────────
// App.tsx — root layout and modal/overlay orchestration.
//
// Split into two components:
//   NavBar — toolbar row: navigation buttons, address bar, action icons.
//   App    — full-screen shell: tab bar, NavBar, WebviewContainer, sidebar,
//            modals (settings / bookmark / reader / injection / profiles),
//            context menu, command palette, and toast notifications.
//
// App also owns global keyboard shortcut handling (both renderer-side keydown
// and shortcuts pushed from the main process via IPC).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { TabBar } from './components/browser/TabBar';
import { NavigationButtons } from './components/browser/NavigationButtons';
import { AddressBar } from './components/browser/AddressBar';
import { WebviewContainer } from './components/browser/WebviewContainer';
import { FindBar } from './components/browser/FindBar';
import { ZoomIndicator } from './components/browser/ZoomIndicator';
import { ContextMenu } from './components/browser/ContextMenu';
import { Sidebar } from './components/sidebar/Sidebar';
import { SettingsModal } from './components/modals/SettingsModal';
import { BookmarkDialog } from './components/modals/BookmarkDialog';
import { PermissionDialog } from './components/modals/PermissionDialog';
import { ReaderModal } from './components/modals/ReaderModal';
import { InjectionEditor } from './components/modals/InjectionEditor';
import { ProfileSwitcher } from './components/modals/ProfileSwitcher';
import { ToastContainer } from './components/shared/Toast';
import { CommandPalette } from './components/browser/CommandPalette';
import { useUiStore } from './store/ui.store';
import { useTabsStore } from './store/tabs.store';
import { NEW_TAB_URL } from '@shared/constants';
import { matchShortcut, handleShortcutAction } from './lib/keyboard-shortcuts';
import { ipc, IPC } from './lib/ipc';
import { useContextMenu } from './hooks/useContextMenu';
import { useSettings } from './hooks/useSettings';
import { useProfiles } from './hooks/useProfiles';

// ── NavBar — toolbar row below the tab strip ───────────────────────────────
const NavBar: React.FC = () => {
  const openModal = useUiStore(s => s.openModal);
  const toggleSidebar = useUiStore(s => s.toggleSidebar);
  const sidebarOpen = useUiStore(s => s.sidebarOpen);
  const activeTab = useTabsStore(s => s.activeTab());

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 glass-floor no-drag">
      <NavigationButtons />

      <AddressBar />

      {/* Action buttons — premium magnetic toolbar */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => openModal('bookmark')}
          className="btn-toolbar"
          aria-label="Bookmark"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill={activeTab ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
        </button>

        <button
          onClick={() => openModal('profiles')}
          className="btn-toolbar"
          aria-label="Switch Profile"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={toggleSidebar}
          className="btn-toolbar"
          style={sidebarOpen ? { background: 'rgba(129,140,248,0.14)', color: 'var(--vyro-accent)' } : undefined}
          aria-label="Toggle sidebar"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={() => openModal('settings')}
          className="btn-toolbar"
          aria-label="Settings"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ── App — root shell: tab bar, content area, all modals and overlays ────────
const App: React.FC = () => {
  const sidebarOpen = useUiStore(s => s.sidebarOpen);
  const activeModal = useUiStore(s => s.activeModal);
  const closeModal = useUiStore(s => s.closeModal);
  const openCommandPalette = useUiStore(s => s.openCommandPalette);
  const createTab = useTabsStore(s => s.createTab);
  const tabs = useTabsStore(s => s.tabs);
  const activeTab = useTabsStore(s => s.activeTab());
  const { menu: ctxMenu, show: showCtxMenu, hide: hideCtxMenu } = useContextMenu();

  // Initialize global data at app level
  useSettings();
  useProfiles();

  // Open a default tab on first load
  useEffect(() => {
    if (tabs.length === 0) {
      createTab({ url: NEW_TAB_URL });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+K → command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCommandPalette();
        return;
      }
      const action = matchShortcut(e);
      if (action) {
        e.preventDefault();
        handleShortcutAction(action);
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [openCommandPalette]);

  // Listen for Dock "New Tab" action pushed from main process
  useEffect(() => {
    const off = ipc.on(IPC.APP_NEW_TAB, () => {
      createTab({ url: NEW_TAB_URL });
    });
    return off;
  }, [createTab]);

  // Listen for shortcut actions pushed from main
  useEffect(() => {
    const off = ipc.on(IPC.SHORTCUT_ACTION, (...args: unknown[]) => {
      const action = args[0] as string;
      handleShortcutAction(action as Parameters<typeof handleShortcutAction>[0]);
    });
    return off;
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0f0f10] text-white">
      <TabBar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <NavBar />

        <div className="flex flex-1 overflow-hidden relative">
          <WebviewContainer />
          <ZoomIndicator />
          {sidebarOpen && <Sidebar />}
        </div>
      </div>

      <FindBar />

      {/* Modals */}
      {activeModal === 'settings' && <SettingsModal />}
      {activeModal === 'bookmark' && <BookmarkDialog />}
      {activeModal === 'reader' && activeTab && (
        <ReaderModal url={activeTab.url} onClose={closeModal} />
      )}
      {activeModal === 'injection' && (
        <InjectionEditor origin={activeTab?.url ? new URL(activeTab.url).hostname : undefined} onClose={closeModal} />
      )}
      {activeModal === 'profiles' && (
        <ProfileSwitcher onClose={closeModal} />
      )}
      <PermissionDialog />

      {/* Context menu */}
      {ctxMenu.visible && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          type={ctxMenu.type}
          context={ctxMenu.context}
          onClose={hideCtxMenu}
        />
      )}

      <CommandPalette />
      <ToastContainer />
    </div>
  );
};

export default App;
