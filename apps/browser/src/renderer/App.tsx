import React, { useEffect, useState } from 'react';
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
import { WindowsTitleBar } from './components/browser/WindowsTitleBar';
import { UpdateBanner } from './components/browser/UpdateBanner';
import { AuthModal } from './components/modals/AuthModal';
import { Onboarding } from './pages/Onboarding';
import { useUiStore } from './store/ui.store';
import { useTabsStore } from './store/tabs.store';
import { useAuthStore } from './store/auth.store';
import { NEW_TAB_URL } from '@shared/constants';
import { matchShortcut, handleShortcutAction } from './lib/keyboard-shortcuts';
import { ipc, IPC } from './lib/ipc';
import { useContextMenu } from './hooks/useContextMenu';
import { useSettings } from './hooks/useSettings';
import { useProfiles } from './hooks/useProfiles';
import { DEFAULT_PROFILE_ID } from '@shared/constants';
import { SessionState } from '@shared/types/tab';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

const ONBOARDING_KEY = 'vyro:onboarding:complete';

const NavBar: React.FC = () => {
  const openModal = useUiStore(s => s.openModal);
  const toggleSidebar = useUiStore(s => s.toggleSidebar);
  const sidebarOpen = useUiStore(s => s.sidebarOpen);
  const splitViewEnabled = useUiStore(s => s.splitViewEnabled);
  const setSplitViewEnabled = useUiStore(s => s.setSplitViewEnabled);
  const activeTab = useTabsStore(s => s.activeTab());
  const syncUser = useAuthStore(s => s.user);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 glass-floor no-drag">
      <NavigationButtons />

      <AddressBar />

      {}
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

        {}
        <button
          onClick={() => openModal('auth')}
          className="btn-toolbar relative"
          aria-label="Sync"
          title={syncUser ? `Syncing as ${syncUser.email}` : 'Sign in to sync'}
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          {syncUser && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-400 rounded-full" />
          )}
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
          onClick={() => setSplitViewEnabled(!splitViewEnabled)}
          className="btn-toolbar"
          style={splitViewEnabled ? { background: 'rgba(129,140,248,0.14)', color: 'var(--vyro-accent)' } : undefined}
          aria-label="Toggle split view"
          title="Split view"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="14" height="12" rx="1.5" />
            <path strokeLinecap="round" d="M10 4v12" />
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

const App: React.FC = () => {
  const [onboardingDone, setOnboardingDone] = useState<boolean>(() => {
    try { return localStorage.getItem(ONBOARDING_KEY) === 'true'; } catch { return false; }
  });

  const sidebarOpen = useUiStore(s => s.sidebarOpen);
  const activeModal = useUiStore(s => s.activeModal);
  const setUpdateAvailable = useUiStore(s => s.setUpdateAvailable);
  const setUpdateReady = useUiStore(s => s.setUpdateReady);
  const closeModal = useUiStore(s => s.closeModal);
  const { setUser, setConfigured, setLoading } = useAuthStore();
  const openCommandPalette = useUiStore(s => s.openCommandPalette);
  const createTab = useTabsStore(s => s.createTab);
  const tabs = useTabsStore(s => s.tabs);
  const activeTab = useTabsStore(s => s.activeTab());
  const { menu: ctxMenu, show: showCtxMenu, hide: hideCtxMenu } = useContextMenu();

  useSettings();
  useProfiles();

  useEffect(() => {
    if (tabs.length > 0) return;
    ipc.invoke<SessionState | null>(IPC.TABS_RESTORE_SESSION, { profileId: DEFAULT_PROFILE_ID })
      .then(session => {
        if (session && session.tabs && session.tabs.length > 0) {
          const activateTab = useTabsStore.getState().activateTab;
          for (const snapshot of session.tabs) {
            useTabsStore.getState().createTab({
              url: snapshot.url,
              title: snapshot.title,
              isPinned: snapshot.isPinned,
              groupId: snapshot.groupId ?? undefined,
              profileId: snapshot.profileId,
            });
          }
          
          const restoredTabs = useTabsStore.getState().tabs;
          
          const activeSnapshot = session.tabs.find(t => t.id === session.activeTabId);
          if (activeSnapshot) {
            const match = restoredTabs.find(t => t.url === activeSnapshot.url);
            if (match) activateTab(match.id);
          }
        } else {
          createTab({ url: NEW_TAB_URL });
        }
      })
      .catch(() => {
        createTab({ url: NEW_TAB_URL });
      });
  }, []); 

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      
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

  useEffect(() => {
    const off = ipc.on(IPC.APP_NEW_TAB, () => {
      createTab({ url: NEW_TAB_URL });
    });
    return off;
  }, [createTab]);

  useEffect(() => {
    const off = ipc.on(IPC.WEBVIEW_NEW_WINDOW, (...args: unknown[]) => {
      const payload = args[0] as { url?: string };
      if (payload?.url) createTab({ url: payload.url });
    });
    return off;
  }, [createTab]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastSig = '';
    const signature = () => {
      const { tabs, activeTabId } = useTabsStore.getState();
      // Only persist when the durable shape changes — not on transient
      // isLoading/favicon churn — to avoid constant disk writes while browsing.
      return tabs
        .map(t => `${t.id}|${t.url}|${t.title}|${t.isPinned ? 1 : 0}|${t.groupId ?? ''}`)
        .join('~') + `#${activeTabId ?? ''}`;
    };
    const saveSession = () => {
      const { tabs, activeTabId } = useTabsStore.getState();
      if (tabs.length === 0) return;
      const snapshots = tabs.map(t => ({
        id: t.id,
        url: t.url,
        title: t.title,
        isPinned: t.isPinned,
        groupId: t.groupId ?? null,
        profileId: t.profileId,
      }));
      ipc.invoke(IPC.TABS_SAVE_SESSION as never, {
        profileId: DEFAULT_PROFILE_ID,
        tabs: snapshots,
        activeTabId: activeTabId ?? '',
      }).catch(() => {});
    };
    const unsubscribe = useTabsStore.subscribe(() => {
      const sig = signature();
      if (sig === lastSig) return;
      lastSig = sig;
      if (timer) clearTimeout(timer);
      timer = setTimeout(saveSession, 1500);
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // Memory saver: put non-active, non-pinned tabs to sleep after 30 minutes
    // of inactivity so their renderer processes can be reclaimed.
    const SLEEP_AFTER_MS = 30 * 60 * 1000;
    const sweep = () => {
      const { tabs, activeTabId, sleepTab } = useTabsStore.getState();
      const now = Date.now();
      for (const t of tabs) {
        if (t.id === activeTabId || t.isPinned || t.asleep) continue;
        if (now - t.lastActiveAt > SLEEP_AFTER_MS) sleepTab(t.id);
      }
    };
    const interval = setInterval(sweep, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const offAvailable = ipc.on(IPC.UPDATE_AVAILABLE, (...args: unknown[]) => {
      const payload = args[0] as { version?: string };
      setUpdateAvailable(payload?.version ?? '');
    });
    const offReady = ipc.on(IPC.UPDATE_READY, () => {
      setUpdateReady();
    });
    return () => { offAvailable(); offReady(); };
  }, [setUpdateAvailable, setUpdateReady]);

  useEffect(() => {
    const off = ipc.on(IPC.SHORTCUT_ACTION, (...args: unknown[]) => {
      const action = args[0] as string;
      handleShortcutAction(action as Parameters<typeof handleShortcutAction>[0]);
    });
    return off;
  }, []);

  useEffect(() => {
    ipc.invoke(IPC.AUTH_GET_SESSION).then((r: any) => {
      setConfigured(r?.configured ?? false);
      if (r?.user) setUser({ id: r.user.id, email: r.user.email });
      setLoading(false);
    }).catch(() => setLoading(false));

    const off = ipc.on(IPC.AUTH_STATE_CHANGED, (...args: unknown[]) => {
      const payload = args[0] as { user: any };
      if (payload?.user) {
        setUser({ id: payload.user.id, email: payload.user.email });
      } else {
        setUser(null);
      }
    });
    return off;
  }, [setUser, setConfigured, setLoading]);

  if (!onboardingDone) {
    return (
      <ErrorBoundary label="Onboarding">
        <Onboarding onComplete={() => setOnboardingDone(true)} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary label="App">
      <div className="flex flex-col h-screen overflow-hidden bg-[#0f0f10] text-white">
        {}
        <WindowsTitleBar />

        {}
        <UpdateBanner />

        <ErrorBoundary label="TabBar">
          <TabBar />
        </ErrorBoundary>

        <div className="flex flex-col flex-1 overflow-hidden">
          <NavBar />

          <div className="flex flex-1 overflow-hidden relative">
            <ErrorBoundary label="WebviewContainer">
              <WebviewContainer />
            </ErrorBoundary>
            <ZoomIndicator />
            <div
              className="overflow-hidden transition-all duration-200 ease-out shrink-0"
              style={{
                width: sidebarOpen ? undefined : 0,
                opacity: sidebarOpen ? 1 : 0,
              }}
            >
              {sidebarOpen && (
                <ErrorBoundary label="Sidebar">
                  <Sidebar />
                </ErrorBoundary>
              )}
            </div>
          </div>
        </div>

        <FindBar />

        {}
        {activeModal === 'settings' && <SettingsModal />}
        {activeModal === 'bookmark' && <BookmarkDialog />}
        {activeModal === 'reader' && activeTab && (
          <ErrorBoundary label="ReaderModal">
            <ReaderModal url={activeTab.url} onClose={closeModal} />
          </ErrorBoundary>
        )}
        {activeModal === 'injection' && (
          <InjectionEditor origin={activeTab?.url ? new URL(activeTab.url).hostname : undefined} onClose={closeModal} />
        )}
        {activeModal === 'profiles' && (
          <ProfileSwitcher onClose={closeModal} />
        )}
        {activeModal === 'auth' && <AuthModal />}
        <PermissionDialog />

        {}
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
    </ErrorBoundary>
  );
};

export default App;
