import { Session } from 'electron';
import { initBlocker, resetBlocker } from './engine';

export interface AdblockStats {
  totalBlocked: number;
  trackersBlocked: number;
  sessionBlocked: number;
}

const stats: AdblockStats = { totalBlocked: 0, trackersBlocked: 0, sessionBlocked: 0 };
const siteOverrides = new Map<string, boolean>(); // origin → enabled

export async function setupAdblocking(sess: Session): Promise<void> {
  const blocker = await initBlocker();
  blocker.enableBlockingInSession(sess);
}

export async function reloadBlocklists(sess: Session): Promise<void> {
  const { getBlocker } = await import('./engine');
  const currentBlocker = getBlocker();
  if (currentBlocker) {
    currentBlocker.disableBlockingInSession(sess);
  }
  resetBlocker();
  const newBlocker = await initBlocker();
  newBlocker.enableBlockingInSession(sess);
}

export function incrementBlocked(isTracker = false): void {
  stats.totalBlocked++;
  stats.sessionBlocked++;
  if (isTracker) stats.trackersBlocked++;
}

export function getStats(): AdblockStats { return { ...stats }; }
export function setSiteOverride(origin: string, enabled: boolean): void { siteOverrides.set(origin, enabled); }
export function getSiteOverride(origin: string): boolean | undefined { return siteOverrides.get(origin); }
export function getAllSiteOverrides(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  siteOverrides.forEach((val, key) => { result[key] = val; });
  return result;
}
