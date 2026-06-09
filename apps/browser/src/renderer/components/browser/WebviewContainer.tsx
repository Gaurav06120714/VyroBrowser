import React from 'react';
import { useTabsStore } from '../../store/tabs.store';
import { WebviewPane } from './WebviewPane';
import { ErrorBoundary } from '../shared/ErrorBoundary';

export const WebviewContainer: React.FC = () => {
  const tabs = useTabsStore(s => s.tabs);
  const activeTabId = useTabsStore(s => s.activeTabId);

  if (tabs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f0f10] text-white/20 text-sm">
        No tabs open
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden flex">
      {tabs.map(tab => {
        const isActive = tab.id === activeTabId;

        return (
          <div
            key={tab.id}
            className="absolute inset-0 flex flex-col"
            style={{ display: isActive ? 'flex' : 'none' }}
          >
            <ErrorBoundary label={`Tab: ${tab.title}`}>
              <WebviewPane tab={tab} active={isActive} />
            </ErrorBoundary>
          </div>
        );
      })}
    </div>
  );
};
