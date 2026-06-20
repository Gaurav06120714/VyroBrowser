import { Session } from 'electron';
import { initBlocker, resetBlocker } from './engine';
import { SettingsService } from '../services/settings-service';

export interface AdblockStats {
  totalBlocked: number;
  trackersBlocked: number;
  sessionBlocked: number;
  totalAllowed: number;
}

const SITE_RULE_PREFIX = 'adblock:site:';

const stats: AdblockStats = { totalBlocked: 0, trackersBlocked: 0, sessionBlocked: 0, totalAllowed: 0 };

const siteOverridesCache = new Map<string, boolean>(); 

let statsListenerAttached = false;

export async function setupAdblocking(sess: Session): Promise<void> {
  const blocker = await initBlocker();

  if (!statsListenerAttached) {
    statsListenerAttached = true;
    blocker.on('request-blocked', () => {
      stats.totalBlocked++;
      stats.sessionBlocked++;
    });
    blocker.on('request-allowed', () => {
      stats.totalAllowed++;
    });
  }

  blocker.enableBlockingInSession(sess);
}

export async function reloadBlocklists(sess: Session): Promise<void> {
  const { getBlocker } = await import('./engine');
  const currentBlocker = getBlocker();
  if (currentBlocker) {
    currentBlocker.disableBlockingInSession(sess);
  }
  resetBlocker();
  statsListenerAttached = false; 
  const newBlocker = await initBlocker();
  
  statsListenerAttached = true;
  newBlocker.on('request-blocked', () => {
    stats.totalBlocked++;
    stats.sessionBlocked++;
  });
  newBlocker.on('request-allowed', () => {
    stats.totalAllowed++;
  });
  newBlocker.enableBlockingInSession(sess);
}

export function incrementBlocked(isTracker = false): void {
  stats.totalBlocked++;
  stats.sessionBlocked++;
  if (isTracker) stats.trackersBlocked++;
}

export function getStats(): AdblockStats & { blocked: number; allowed: number; total: number } {
  return {
    ...stats,
    blocked: stats.totalBlocked,
    allowed: stats.totalAllowed,
    total: stats.totalBlocked + stats.totalAllowed,
  };
}

export function setSiteOverride(origin: string, enabled: boolean, settingsService?: SettingsService): void {
  siteOverridesCache.set(origin, enabled);
  if (settingsService) {
    
    const key = `${SITE_RULE_PREFIX}${origin}`;
    
    settingsService.setRaw('default', key, enabled);
  }
}

export function getSiteOverride(origin: string): boolean | undefined {
  return siteOverridesCache.get(origin);
}

export function getAllSiteOverrides(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  siteOverridesCache.forEach((val, key) => { result[key] = val; });
  return result;
}

export function loadSiteRulesFromDb(settingsService: SettingsService): void {
  const rules = settingsService.getAllByPrefix('default', SITE_RULE_PREFIX);
  for (const [key, value] of Object.entries(rules)) {
    const origin = key.slice(SITE_RULE_PREFIX.length);
    if (origin) siteOverridesCache.set(origin, Boolean(value));
  }
}
