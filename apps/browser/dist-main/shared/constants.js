"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEBVIEW_PARTITION_PREFIX = exports.OLLAMA_BASE_URL = exports.DEFAULT_PROFILE_ID = exports.SEARCH_ENGINES = exports.NEW_TAB_URL = exports.DB_VERSION = void 0;
exports.DB_VERSION = 7;
exports.NEW_TAB_URL = 'vyro://newtab';
exports.SEARCH_ENGINES = {
    google: 'https://www.google.com/search?q=',
    bing: 'https://www.bing.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    brave: 'https://search.brave.com/search?q=',
};
exports.DEFAULT_PROFILE_ID = 'default';
exports.OLLAMA_BASE_URL = 'http://localhost:11434';
exports.WEBVIEW_PARTITION_PREFIX = 'persist:profile-';
