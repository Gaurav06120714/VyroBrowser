import { describe, it, expect } from 'vitest';
import { looksLikeUrl, fallbackSearchUrl, resolve, suggest } from './matcher';

describe('looksLikeUrl', () => {
  it('recognizes explicit protocols', () => {
    expect(looksLikeUrl('https://example.com')).toBe(true);
    expect(looksLikeUrl('http://example.com/path')).toBe(true);
  });

  it('recognizes bare domains', () => {
    expect(looksLikeUrl('example.com')).toBe(true);
    expect(looksLikeUrl('sub.example.co.uk/path')).toBe(true);
  });

  it('rejects plain search queries', () => {
    expect(looksLikeUrl('hello world')).toBe(false);
    expect(looksLikeUrl('weather today')).toBe(false);
  });
});

describe('fallbackSearchUrl', () => {
  it('encodes the query into the default Google search URL', () => {
    expect(fallbackSearchUrl('ai news')).toBe(
      'https://www.google.com/search?q=ai%20news',
    );
  });

  it('honors a custom engine', () => {
    expect(fallbackSearchUrl('cats', 'https://duckduckgo.com/?q=')).toBe(
      'https://duckduckgo.com/?q=cats',
    );
  });
});

describe('resolve', () => {
  it('returns an empty none-match for blank input', () => {
    const r = resolve('   ');
    expect(r.type).toBe('none');
    expect(r.url).toBe('');
  });

  it('normalizes a bare domain to https', () => {
    const r = resolve('example.com');
    expect(r.type).toBe('url');
    expect(r.url).toBe('https://example.com');
  });

  it('passes through an explicit URL unchanged', () => {
    const r = resolve('https://example.com/page');
    expect(r.type).toBe('url');
    expect(r.url).toBe('https://example.com/page');
  });

  it('falls back to a search for unknown free text', () => {
    const r = resolve('some random query');
    expect(r.type).toBe('none');
    expect(r.url).toContain('some%20random%20query');
  });
});

describe('suggest', () => {
  it('returns nothing for empty input', () => {
    expect(suggest('')).toEqual([]);
  });

  it('produces a single go-to-URL suggestion for a URL-like input', () => {
    const out = suggest('github.com');
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('url');
    expect(out[0].url).toBe('https://github.com');
    // regression: domain extraction must not crash on the favicon lookup
    expect(out[0].favicon).toContain('github.com');
  });
});
