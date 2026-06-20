import { ElectronBlocker } from '@cliqz/adblocker-electron';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import https from 'https';

let blocker: ElectronBlocker | null = null;

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

const MINIMAL_FILTERS = `
! Vyro minimal blocklist
||ads.google.com^
||doubleclick.net^
||googlesyndication.com^
||adnxs.com^
||facebook.com/tr^
||google-analytics.com^
`;

export async function initBlocker(): Promise<ElectronBlocker> {
  if (blocker) return blocker;

  const cachePath = path.join(app.getPath('userData'), 'adblocker.cache');

  try {
    if (fs.existsSync(cachePath)) {
      const serialized = fs.readFileSync(cachePath);
      blocker = ElectronBlocker.deserialize(new Uint8Array(serialized));
      return blocker;
    }
  } catch {
    
  }

  try {
    const fetchFn = async (url: string): Promise<{ text: () => Promise<string> }> => ({
      text: () => fetchText(url),
    });
    blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetchFn as Parameters<typeof ElectronBlocker.fromPrebuiltAdsAndTracking>[0]);
    fs.writeFileSync(cachePath, Buffer.from(blocker.serialize()));
    return blocker;
  } catch {
    
  }

  blocker = ElectronBlocker.parse(MINIMAL_FILTERS);
  return blocker;
}

export function getBlocker(): ElectronBlocker | null { return blocker; }

export function resetBlocker(): void { blocker = null; }
