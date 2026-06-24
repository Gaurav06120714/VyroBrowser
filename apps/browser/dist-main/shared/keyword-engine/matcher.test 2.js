"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const matcher_1 = require("./matcher");
(0, vitest_1.describe)('looksLikeUrl', () => {
    (0, vitest_1.it)('recognizes explicit protocols', () => {
        (0, vitest_1.expect)((0, matcher_1.looksLikeUrl)('https://example.com')).toBe(true);
        (0, vitest_1.expect)((0, matcher_1.looksLikeUrl)('http://example.com/path')).toBe(true);
    });
    (0, vitest_1.it)('recognizes bare domains', () => {
        (0, vitest_1.expect)((0, matcher_1.looksLikeUrl)('example.com')).toBe(true);
        (0, vitest_1.expect)((0, matcher_1.looksLikeUrl)('sub.example.co.uk/path')).toBe(true);
    });
    (0, vitest_1.it)('rejects plain search queries', () => {
        (0, vitest_1.expect)((0, matcher_1.looksLikeUrl)('hello world')).toBe(false);
        (0, vitest_1.expect)((0, matcher_1.looksLikeUrl)('weather today')).toBe(false);
    });
});
(0, vitest_1.describe)('fallbackSearchUrl', () => {
    (0, vitest_1.it)('encodes the query into the default Google search URL', () => {
        (0, vitest_1.expect)((0, matcher_1.fallbackSearchUrl)('ai news')).toBe('https://www.google.com/search?q=ai%20news');
    });
    (0, vitest_1.it)('honors a custom engine', () => {
        (0, vitest_1.expect)((0, matcher_1.fallbackSearchUrl)('cats', 'https://duckduckgo.com/?q=')).toBe('https://duckduckgo.com/?q=cats');
    });
});
(0, vitest_1.describe)('resolve', () => {
    (0, vitest_1.it)('returns an empty none-match for blank input', () => {
        const r = (0, matcher_1.resolve)('   ');
        (0, vitest_1.expect)(r.type).toBe('none');
        (0, vitest_1.expect)(r.url).toBe('');
    });
    (0, vitest_1.it)('normalizes a bare domain to https', () => {
        const r = (0, matcher_1.resolve)('example.com');
        (0, vitest_1.expect)(r.type).toBe('url');
        (0, vitest_1.expect)(r.url).toBe('https://example.com');
    });
    (0, vitest_1.it)('passes through an explicit URL unchanged', () => {
        const r = (0, matcher_1.resolve)('https://example.com/page');
        (0, vitest_1.expect)(r.type).toBe('url');
        (0, vitest_1.expect)(r.url).toBe('https://example.com/page');
    });
    (0, vitest_1.it)('falls back to a search for unknown free text', () => {
        const r = (0, matcher_1.resolve)('some random query');
        (0, vitest_1.expect)(r.type).toBe('none');
        (0, vitest_1.expect)(r.url).toContain('some%20random%20query');
    });
});
(0, vitest_1.describe)('suggest', () => {
    (0, vitest_1.it)('returns nothing for empty input', () => {
        (0, vitest_1.expect)((0, matcher_1.suggest)('')).toEqual([]);
    });
    (0, vitest_1.it)('produces a single go-to-URL suggestion for a URL-like input', () => {
        const out = (0, matcher_1.suggest)('github.com');
        (0, vitest_1.expect)(out).toHaveLength(1);
        (0, vitest_1.expect)(out[0].type).toBe('url');
        (0, vitest_1.expect)(out[0].url).toBe('https://github.com');
        // regression: domain extraction must not crash on the favicon lookup
        (0, vitest_1.expect)(out[0].favicon).toContain('github.com');
    });
});
