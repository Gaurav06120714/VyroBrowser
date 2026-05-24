// ─────────────────────────────────────────────────────────────────────────────
// ipc/index.ts — IPC registration hub.
//
// registerAllIpc() is called once at startup and delegates to per-domain
// register functions (tabs, navigation, history, bookmarks, downloads, AI,
// adblock, reader, injections, find, keywords, profiles, settings, permissions).
// Each domain module calls ipcMain.handle() / ipcMain.on() for its channels.
// ─────────────────────────────────────────────────────────────────────────────
import Database from 'better-sqlite3';
import { WindowManager } from '../window-manager';
import { registerTabsIpc } from './tabs';
import { registerNavigationIpc } from './navigation';
import { registerProfilesIpc } from './profiles';
import { registerSettingsIpc } from './settings';
import { registerPermissionsIpc } from './permissions';
import { registerHistoryIpc } from './history';
import { registerBookmarksIpc } from './bookmarks';
import { registerDownloadsIpc } from './downloads';
import { registerAIIpc } from './ai';
import { registerAdblockIpc } from './adblock';
import { registerReaderIpc } from './reader';
import { registerInjectionsIpc } from './injections';
import { registerFindIpc } from './find';
import { registerKeywordsIpc } from './keywords';
import { registerOnboardingIpc } from './onboarding';
import { KeywordService } from '../services/keyword-service';

export function registerAllIpc(db: Database.Database, wm: WindowManager): void {
  const keywordService = new KeywordService(db);
  registerTabsIpc(db, wm);
  registerNavigationIpc(wm);
  registerProfilesIpc(db, wm);
  registerSettingsIpc(db);
  registerPermissionsIpc(wm);
  registerHistoryIpc(db);
  registerBookmarksIpc(db);
  registerDownloadsIpc(db, wm);
  registerAIIpc(db, wm);
  registerAdblockIpc();
  registerReaderIpc();
  registerInjectionsIpc(db);
  registerFindIpc();
  registerKeywordsIpc(keywordService);
  registerOnboardingIpc(wm);
}
