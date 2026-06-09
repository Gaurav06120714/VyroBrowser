import { useState, useCallback, useRef } from 'react';
import { ipc, IPC } from '../lib/ipc';
import { KeywordSuggestion, KeywordMatch } from '@shared/keyword-engine/types';

const CACHE_TTL = 10_000;
const CACHE_MAX = 200;
interface CacheEntry { data: KeywordSuggestion[]; ts: number }
const _cache = new Map<string, CacheEntry>();

function cacheGet(key: string): KeywordSuggestion[] | null {
  const e = _cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return e.data;
}

function cacheSet(key: string, data: KeywordSuggestion[]): void {
  if (_cache.size >= CACHE_MAX) {
    let oldest = { key: '', ts: Infinity };
    for (const [k, v] of _cache) { if (v.ts < oldest.ts) oldest = { key: k, ts: v.ts }; }
    _cache.delete(oldest.key);
  }
  _cache.set(key, { data, ts: Date.now() });
}

export function useKeywords() {
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInputRef = useRef('');

  const getSuggestions = useCallback((input: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    const cached = cacheGet(input);
    if (cached) {
      setSuggestions(cached);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      lastInputRef.current = input;
      setIsLoading(true);
      try {
        const results = await ipc.invoke<KeywordSuggestion[]>(
          IPC.KEYWORDS_SUGGEST,
          { input, max: 8 },
        );
        
        if (lastInputRef.current !== input) return;
        setSuggestions(results);
        cacheSet(input, results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 50); 
  }, []);

  const resolve = useCallback(async (input: string): Promise<KeywordMatch> => {
    return ipc.invoke<KeywordMatch>(IPC.KEYWORDS_RESOLVE, { input });
  }, []);

  const trackUse = useCallback((keyword: string) => {
    ipc.invoke(IPC.KEYWORDS_TRACK_USE, { keyword }).catch(() => {});
  }, []);

  const clearSuggestions = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSuggestions([]);
  }, []);

  return { suggestions, isLoading, getSuggestions, resolve, trackUse, clearSuggestions };
}
