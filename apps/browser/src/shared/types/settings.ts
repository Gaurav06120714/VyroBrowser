export type Theme = 'dark' | 'light' | 'system';
export type SearchEngine = 'google' | 'bing' | 'duckduckgo' | 'brave';

export interface AppSettings {
  theme: Theme;
  searchEngine: SearchEngine;
  homePage: string;
  newTabPage: 'default' | 'blank';
  fontSize: number;
  adblockEnabled: boolean;
  aiModel: string;
  aiSystemPrompt: string;
  ollamaUrl: string;
  downloadPath: string;
  readerFontSize: number;
  readerWidth: 'narrow' | 'medium' | 'wide';
  readerTheme: 'light' | 'dark' | 'sepia';
  readerFont: 'serif' | 'sans' | 'mono';
  showSidebar: boolean;
  sidebarWidth: number;
  hardwareAcceleration: boolean;
  autoUpdate: boolean;
  httpsOnly: boolean;
  accentColor: string;
}

export const SEARCH_ENGINES: Record<SearchEngine, { label: string; searchUrl: string }> = {
  google: { label: 'Google', searchUrl: 'https://www.google.com/search?q=' },
  bing: { label: 'Bing', searchUrl: 'https://www.bing.com/search?q=' },
  duckduckgo: { label: 'DuckDuckGo', searchUrl: 'https://duckduckgo.com/?q=' },
  brave: { label: 'Brave', searchUrl: 'https://search.brave.com/search?q=' },
};

export const ACCENT_PRESETS: { name: string; value: string }[] = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
];

export const DEFAULT_SETTINGS: AppSettings = {
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
