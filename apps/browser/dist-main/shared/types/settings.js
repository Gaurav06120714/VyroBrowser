"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SETTINGS = exports.ACCENT_PRESETS = exports.SEARCH_ENGINES = void 0;
exports.SEARCH_ENGINES = {
    google: { label: 'Google', searchUrl: 'https://www.google.com/search?q=' },
    bing: { label: 'Bing', searchUrl: 'https://www.bing.com/search?q=' },
    duckduckgo: { label: 'DuckDuckGo', searchUrl: 'https://duckduckgo.com/?q=' },
    brave: { label: 'Brave', searchUrl: 'https://search.brave.com/search?q=' },
};
exports.ACCENT_PRESETS = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' },
];
exports.DEFAULT_SETTINGS = {
    theme: 'light',
    searchEngine: 'google',
    homePage: 'https://www.google.com',
    newTabPage: 'default',
    fontSize: 16,
    adblockEnabled: true,
    aiModel: '',
    aiSystemPrompt: 'You are a helpful browser assistant. Be concise and clear.',
    ollamaUrl: 'http://localhost:11434',
    downloadPath: '',
    readerFontSize: 18,
    readerWidth: 'medium',
    readerTheme: 'light',
    readerFont: 'serif',
    showSidebar: false,
    sidebarWidth: 380,
    hardwareAcceleration: true,
    autoUpdate: false,
    httpsOnly: false,
    accentColor: '#6366f1',
};
