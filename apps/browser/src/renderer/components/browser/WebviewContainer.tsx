import React from 'react';
import { useTabsStore } from '../../store/tabs.store';
import { useUiStore } from '../../store/ui.store';
import { WebviewPane } from './WebviewPane';
import { ErrorBoundary } from '../shared/ErrorBoundary';

export const WebviewContainer: React.FC = () => {
  const tabs = useTabsStore(s => s.tabs);
  const activeTabId = useTabsStore(s => s.activeTabId);
  const splitViewEnabled = useUiStore(s => s.splitViewEnabled);

  if (tabs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f0f10] text-white/20 text-sm">
        No tabs open
      </div>
    );
  }

  // In split view the active tab is shown on the left and its neighbour on the
  // right. Falls back to a single pane when there is only one tab. Inactive
  // tabs stay mounted (hidden) so they are not reloaded when switching back.
  const activeIdx = tabs.findIndex(t => t.id === activeTabId);
  const splitEnabled = splitViewEnabled && tabs.length >= 2;
  const secondaryId = splitEnabled
    ? ((tabs[activeIdx + 1] ?? tabs[activeIdx - 1] ?? null)?.id ?? null)
    : null;

  const paneStyle = (tabId: string): React.CSSProperties => {
    const isActive = tabId === activeTabId;
    if (splitEnabled && (isActive || tabId === secondaryId)) {
      return {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: isActive ? '0%' : '50%',
        width: '50%',
        display: 'flex',
      };
    }
    return { position: 'absolute', inset: 0, display: isActive ? 'flex' : 'none' };
  };

  return (
    <div className="flex-1 relative overflow-hidden flex">
      {splitEnabled && (
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10 z-10 pointer-events-none" />
      )}
      {tabs.map(tab => {
        const visible = tab.id === activeTabId || tab.id === secondaryId;
        return (
          <div key={tab.id} className="flex flex-col" style={paneStyle(tab.id)}>
            <ErrorBoundary label={`Tab: ${tab.title}`}>
              <WebviewPane tab={tab} active={visible} />
            </ErrorBoundary>
          </div>
        );
      })}
    </div>
  );
};
