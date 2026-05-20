// ─────────────────────────────────────────────────────────────────────────────
// WebviewContainer — renders the active tab's content area.
//
// Two rendering modes (selected per-tab based on tab.url):
//   • NewTab mode  (url === NEW_TAB_URL / about:blank / '')  — renders the
//     React <NewTab> page. No Electron webview is mounted.  When the user
//     navigates, NewTab calls updateTab(url) and WebviewContainer remounts
//     the same slot as <WebviewPane>, which loads via its src attribute.
//   • WebviewPane mode (any real URL) — renders an Electron <webview>
//     inside <WebviewPane> for full browser functionality.
//
// All tabs are kept in the DOM (display:none when inactive) so webviews are
// never destroyed on tab switch, preserving page state and scroll position.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { useTabsStore } from '../../store/tabs.store';
import { WebviewPane } from './WebviewPane';
import { NewTab } from '../../pages/NewTab';
import { NEW_TAB_URL } from '@shared/constants';

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
        const isNewTab = tab.url === NEW_TAB_URL || tab.url === 'about:blank' || tab.url === '';

        return (
          <div
            key={tab.id}
            className="absolute inset-0 flex flex-col"
            style={{ display: isActive ? 'flex' : 'none' }}
          >
            {isNewTab ? (
              <NewTab />
            ) : (
              <WebviewPane tab={tab} active={isActive} />
            )}
          </div>
        );
      })}
    </div>
  );
};
