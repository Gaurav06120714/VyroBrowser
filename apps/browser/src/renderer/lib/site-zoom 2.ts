// Per-origin zoom persistence, backed by localStorage. A non-default zoom for
// an origin is restored whenever a tab navigates to that origin.

const KEY = 'vyro:site-zoom';
const MIN = 0.3;
const MAX = 3;

type ZoomMap = Record<string, number>;

function load(): ZoomMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as ZoomMap;
  } catch {
    return {};
  }
}

function save(map: ZoomMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / serialization errors */
  }
}

export function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function clampZoom(level: number): number {
  return Math.min(MAX, Math.max(MIN, Math.round(level * 100) / 100));
}

export function getSiteZoom(origin: string | null): number {
  if (!origin) return 1;
  return load()[origin] ?? 1;
}

export function setSiteZoom(origin: string | null, level: number): void {
  if (!origin) return;
  const map = load();
  if (level === 1) {
    delete map[origin];
  } else {
    map[origin] = level;
  }
  save(map);
}
