# Vyro Browser

> A production-ready, AI-powered macOS browser built with Electron, React, and TypeScript.

Vyro wraps Chromium's webview into a polished dark-mode UI with tabbed browsing, smart keyword navigation, a built-in Ollama AI assistant, ad-blocking, per-profile sessions, reader mode, and a command palette — all packaged as a native macOS app for Apple Silicon.

---

## Features

- **Smart keyword navigation** — type `gh`, `yt react hooks`, or `watch cricket` in the address bar to jump straight to the right site. Supports exact keywords, smart search, NLP verbs (`open`, `watch`, `buy`, `find`), fuzzy matching with typo tolerance, and intent routing (streaming, shopping, coding, music)
- **Built-in AI assistant** — local AI chat via [Ollama](https://ollama.com). Multi-model support, per-page summarisation, conversation history, streaming responses — all running 100% offline on your Mac
- **Tabbed browsing** — open, close, reorder, pin, and group tabs; restore recently closed tabs
- **Ad-blocking** — network-level filter via `@cliqz/adblocker-electron`; per-site toggle and live block stats
- **Reader mode** — extract article content as clean readable text with optional text-to-speech
- **Per-profile sessions** — isolated cookie/storage partitions; switch profiles without restarting
- **Find in page** — Cmd+F inline search bar
- **Bookmarks** — tree-organised, importable/exportable
- **Downloads** — download manager with pause/resume/cancel
- **CSS/JS injection** — per-origin custom stylesheets and scripts
- **Command palette** — Cmd+K fuzzy-search over open tabs, bookmarks, history, and shortcuts
- **Zoom controls** — per-tab zoom with on-screen indicator
- **Dark-first UI** — native dark mode, Tailwind CSS, no light-mode flicker
- **macOS-native lifecycle** — proper Dock menu (New Window, New Tab), window restoration, single-instance lock

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 31 |
| Renderer | React 19, TypeScript 5, Vite 5 |
| Styling | Tailwind CSS 3 |
| State management | Zustand 5 |
| Database | better-sqlite3 (local SQLite) |
| AI | Ollama (local LLMs — llama3, qwen2.5-coder, codellama, etc.) |
| Ad-blocking | @cliqz/adblocker-electron |
| IPC security | contextIsolation + preload allowlist |
| Packaging | electron-builder (macOS arm64) |

---

## Folder Structure

```
apps/browser/src/
├── main/                        # Electron main process (Node.js)
│   ├── index.ts                 # Entry point — app lifecycle, Dock menu, IPC init
│   ├── window-manager.ts        # BrowserWindow creation, bounds persistence
│   ├── adblock/
│   │   └── request-filter.ts    # Network-level ad-block via cliqz adblocker
│   ├── ipc/
│   │   ├── index.ts             # registerAllIpc() — delegates to domain modules
│   │   ├── tabs.ts              # Tab CRUD and registration
│   │   ├── navigation.ts        # load-url, back/forward, reload, zoom, devtools
│   │   ├── history.ts           # Browse history search/add/delete
│   │   ├── bookmarks.ts         # Bookmark CRUD, import/export
│   │   ├── downloads.ts         # Download lifecycle management
│   │   ├── ai.ts                # Ollama AI chat, summarisation, streaming
│   │   ├── adblock.ts           # Adblock stats, per-site toggles
│   │   ├── reader.ts            # Reader mode extraction + TTS
│   │   ├── injections.ts        # Custom CSS/JS injection
│   │   ├── find.ts              # Find-in-page
│   │   ├── keywords.ts          # Keyword engine IPC bridge
│   │   ├── profiles.ts          # Profile management
│   │   ├── settings.ts          # App settings get/set
│   │   └── permissions.ts       # Media/geo permission dialogs
│   ├── preload/
│   │   └── browser-preload.ts   # contextBridge — exposes window.vyro API
│   └── services/
│       ├── db.ts                # SQLite singleton + WAL setup
│       ├── ai-service.ts        # Ollama HTTP client, streaming, conversation DB
│       ├── keyword-service.ts   # Keyword resolve/suggest/track/import/export
│       ├── history-service.ts   # History FTS search
│       ├── bookmark-service.ts  # Bookmark tree builder
│       ├── profile-service.ts   # Profile CRUD + active profile tracking
│       ├── settings-service.ts  # Per-profile settings persistence
│       ├── download-service.ts  # Download state and file ops
│       ├── injection-service.ts # Custom script storage per origin
│       ├── reader-service.ts    # Readability extraction + sanitisation
│       └── migrations/          # Versioned SQL schema migrations (001–007)
│
├── renderer/                    # React renderer process
│   ├── App.tsx                  # Root layout, modals, Dock IPC listeners
│   ├── main.tsx                 # React DOM entry point
│   ├── components/
│   │   ├── browser/
│   │   │   ├── TabBar.tsx           # Tab strip with drag-to-reorder
│   │   │   ├── WebviewContainer.tsx # Mounts NewTab or WebviewPane per tab
│   │   │   ├── WebviewPane.tsx      # Electron <webview> wrapper, event sync
│   │   │   ├── AddressBar.tsx       # Omnibox: URL display, nav, suggestions
│   │   │   ├── NavigationButtons.tsx # Back/forward/reload/stop
│   │   │   ├── SuggestionDropdown.tsx # Keyword autocomplete dropdown
│   │   │   ├── FindBar.tsx          # In-page find bar
│   │   │   ├── ZoomIndicator.tsx    # Transient zoom level overlay
│   │   │   ├── ContextMenu.tsx      # Right-click context menu
│   │   │   └── CommandPalette.tsx   # Cmd+K command palette
│   │   ├── modals/
│   │   │   ├── SettingsModal.tsx    # Settings page
│   │   │   ├── BookmarkDialog.tsx   # Add/edit bookmark
│   │   │   ├── ReaderModal.tsx      # Reader mode overlay
│   │   │   ├── InjectionEditor.tsx  # CSS/JS injection editor
│   │   │   ├── PermissionDialog.tsx # Camera/mic/geo permission prompt
│   │   │   └── ProfileSwitcher.tsx  # Profile picker
│   │   ├── sidebar/
│   │   │   ├── Sidebar.tsx          # Sidebar container (AI, History, Bookmarks, Downloads)
│   │   │   ├── AIPanel.tsx          # Ollama AI chat interface
│   │   │   ├── AIToolbar.tsx        # Model selector + New Chat + Summarize
│   │   │   ├── AIMessage.tsx        # Individual chat message with markdown
│   │   │   ├── HistoryPanel.tsx     # Browsing history list + search
│   │   │   ├── BookmarksPanel.tsx   # Bookmark tree UI
│   │   │   └── DownloadsPanel.tsx   # Download list with progress
│   │   └── shared/
│   │       ├── Toast.tsx            # Toast notification system
│   │       ├── Spinner.tsx          # Loading spinner
│   │       ├── Modal.tsx            # Modal container
│   │       └── FaviconImage.tsx     # Favicon with letter fallback
│   ├── hooks/
│   │   ├── useKeywords.ts       # Debounced suggestions + LRU cache
│   │   ├── useAI.ts             # Ollama conversation management + streaming
│   │   ├── useSettings.ts       # Settings IPC sync
│   │   ├── useProfiles.ts       # Profile IPC sync
│   │   ├── useHistory.ts        # History search and CRUD
│   │   ├── useBookmarks.ts      # Bookmark tree + CRUD
│   │   ├── useDownloads.ts      # Downloads list + progress events
│   │   ├── useAdblock.ts        # Adblock stats + per-site toggle
│   │   ├── useFind.ts           # Find-in-page
│   │   └── useContextMenu.ts    # Context menu state
│   ├── lib/
│   │   ├── ipc.ts               # Typed wrapper around window.vyro IPC
│   │   └── keyboard-shortcuts.ts # Shortcut matching and action dispatch
│   ├── pages/
│   │   └── NewTab.tsx           # New-tab page with search + keyword shortcuts
│   ├── store/
│   │   ├── tabs.store.ts        # Zustand — open tabs, active tab, groups
│   │   ├── ui.store.ts          # Zustand — modals, sidebar, command palette
│   │   ├── ai.store.ts          # Zustand — conversations, messages, streaming
│   │   ├── history.store.ts     # Zustand — history entries
│   │   ├── bookmarks.store.ts   # Zustand — bookmark tree
│   │   ├── downloads.store.ts   # Zustand — downloads list
│   │   ├── profile.store.ts     # Zustand — profiles, active profile
│   │   ├── settings.store.ts    # Zustand — app settings
│   │   └── adblock.store.ts     # Zustand — adblock stats
│   └── styles/
│       └── globals.css          # Tailwind base + custom scrollbars/animations
│
└── shared/                      # Shared between main and renderer
    ├── constants.ts             # NEW_TAB_URL, WEBVIEW_PARTITION_PREFIX
    ├── ipc-channels.ts          # IPC channel constants + security allowlists
    ├── keyword-engine/
    │   ├── types.ts             # KeywordEntry, KeywordMatch, KeywordSuggestion
    │   ├── database.ts          # 65+ built-in keywords + in-memory index
    │   ├── matcher.ts           # resolve() + suggest() core algorithms
    │   ├── intent.ts            # NLP intent detection (streaming, shopping, …)
    │   └── index.ts             # Barrel exports
    └── types/
        ├── tab.ts               # Tab, TabGroup, TabSnapshot
        ├── settings.ts          # AppSettings, DEFAULT_SETTINGS
        ├── ai.ts                # AIConversation, AIMessage, OllamaModel
        ├── profile.ts           # Profile
        ├── history.ts           # HistoryEntry
        ├── bookmark.ts          # Bookmark, BookmarkFolder
        └── download.ts          # Download, DownloadState
```

---

## Prerequisites

- **Node.js** 20 or later
- **npm** 10 or later
- **macOS** 12 (Monterey) or later, Apple Silicon (arm64)
- Xcode Command Line Tools: `xcode-select --install`
- **[Ollama](https://ollama.com)** for the AI assistant (optional but recommended)

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Gaurav06120714/Vyro.git
cd VyroBrowser/apps/browser
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

Runs two processes in parallel:
- TypeScript compiler watching `src/main/` → `dist-main/`
- Vite dev server at `http://localhost:5173`

Hot-module replacement is active for renderer code. Restart Electron to pick up main-process changes.

### 4. Build for production

```bash
npm run build
```

### 5. Package as macOS app

```bash
# Fast — outputs Vyro.app bundle only (no installer)
npm run package:dir

# Full — creates Vyro.app + .dmg installer
npm run package
```

### 6. Install permanently to /Applications

```bash
npm run install-app
```

Builds, packages, and copies `Vyro.app` to `/Applications/Vyro.app`. After this, Vyro appears in Spotlight, Launchpad, and the Dock.

---

## AI Setup (Ollama)

Vyro's AI assistant runs entirely locally via Ollama — no API keys, no cloud.

### Install Ollama

```bash
brew install ollama
```

### Pull a model

```bash
# Lightweight and fast (recommended)
ollama pull llama3.2

# Coding-focused (already installed if you followed along)
ollama pull qwen2.5-coder:7b

# Most capable, needs ~8GB RAM
ollama pull llama3.1:8b
```

### Verify it's running

```bash
curl http://localhost:11434/api/tags
```

Ollama runs as a background service after `brew install`. If it's not running:

```bash
brew services start ollama
```

### Use it in Vyro

1. Open Vyro → click the **sidebar toggle** (≡ button, top-right)
2. Click the **AI** tab
3. Select your model from the dropdown
4. Click **New Chat** and start typing

The AI can also **summarise any page** — click **Summarize** in the AI toolbar while on a webpage.

---

## Development Workflow

```bash
# Start dev mode
npm run dev

# Type-check without emitting
npx tsc --noEmit

# Rebuild main process only
npm run build:main

# Full production build
npm run build

# Package without installer
npm run package:dir

# Install to /Applications
npm run install-app
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+T` | New tab |
| `Cmd+W` | Close current tab |
| `Cmd+Shift+T` | Reopen last closed tab |
| `Cmd+L` | Focus address bar |
| `Cmd+R` | Reload page |
| `Cmd+Shift+R` | Hard reload |
| `Cmd+[` | Go back |
| `Cmd+]` | Go forward |
| `Cmd+F` | Find in page |
| `Cmd+K` | Open command palette |
| `Cmd+1` … `Cmd+8` | Switch to tab N |
| `Cmd+9` | Switch to last tab |
| `Cmd++` / `Cmd+-` | Zoom in / out |
| `Cmd+0` | Reset zoom |
| `Cmd+Shift+I` | Open DevTools for active tab |

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Main Process (Node.js)                     │
│  src/main/                                  │
│  - Window management + macOS Dock menu      │
│  - SQLite database (all persistence)        │
│  - Ollama HTTP client (streaming AI)        │
│  - ipcMain handlers (100+ channels)         │
│  - Ad-block request filter                  │
│  - Download management                      │
└──────────────┬──────────────────────────────┘
               │  contextBridge (preload)
               │  window.vyro.invoke / window.vyro.on
               │  Only channels in INVOKE_ALLOWLIST /
               │  PUSH_ALLOWLIST can cross this boundary
┌──────────────▼──────────────────────────────┐
│  Renderer Process (React 19 + Vite)         │
│  src/renderer/                              │
│  - Zustand stores (tabs, UI, AI, settings)  │
│  - React component tree                     │
│  - Electron <webview> per tab               │
└─────────────────────────────────────────────┘
         │
         │  src/shared/  (compiled into both processes)
         └─ Types, IPC channel constants, keyword engine
```

**macOS lifecycle:** `window-all-closed` keeps the app alive in the Dock (like Chrome). The SQLite DB stays open so IPC handlers remain functional. Clicking the Dock icon calls `activate` which creates and loads a fresh window. `before-quit` closes the DB cleanly.

**Tab navigation:** `WebviewPane` mounts `<webview src={url}>` once. Navigations on an existing tab go through `ipc.invoke(NAV_LOAD_URL)` → main process → `wc.loadURL()`. The `did-navigate` event only syncs the address bar — it never re-calls `loadURL`, preventing reload loops.

---

## Keyword Navigation

The keyword engine (`src/shared/keyword-engine/`) converts address bar input into a destination URL:

1. **URL passthrough** — input looks like a URL → navigate directly
2. **NLP command** — `open gmail`, `watch cricket`, `buy airpods` → verb + target routing
3. **Exact keyword** — `gh` → `https://github.com`, `yt` → `https://youtube.com`
4. **Smart search** — `gh react hooks` → `https://github.com/search?q=react+hooks`
5. **Prefix match** — `goo` → suggests Google
6. **Fuzzy match** — `gihtub` (typo) → suggests GitHub
7. **Search fallback** — anything else → Google search

65+ built-in keywords covering search, social, coding, streaming, shopping, productivity, and more. Usage tracked in SQLite with score bonuses for frequently used keywords.

---

## Troubleshooting

**App won't start / blank window**
```bash
npm run build:main   # recompile main process
npm run dev          # check DevTools console for errors
```

**`better-sqlite3` native module error**
```bash
npx electron-rebuild -f -w better-sqlite3
```

**AI panel shows "Ollama not running"**
```bash
brew services start ollama
curl http://localhost:11434/api/tags   # verify it responds
```

**Packaged app shows security warning**
Right-click → Open in Finder to bypass Gatekeeper for unsigned local builds.

**Google / sites keep refreshing**
This was a known bug fixed in the current version. `WebviewPane` no longer watches `tab.url` — all navigations go through IPC or the webview's own `src` attribute.

---

## Roadmap

- [ ] **Ollama model management** — download, delete, and switch models from within the browser
- [ ] **Keywords settings page** — full UI for browsing, adding, editing, and importing custom keywords
- [ ] **Page context AI** — AI reads the actual page DOM content, not just title/URL
- [ ] **Split-view** — side-by-side tabs in a single window
- [ ] **Vertical tabs** — optional sidebar tab strip
- [ ] **Sync** — bookmark and history sync across devices
- [ ] **Extensions** — Chrome extension compatibility layer (Manifest V3)
- [ ] **Privacy report** — per-page breakdown of blocked trackers and ads
- [ ] **Automatic updates** — electron-updater integration
- [ ] **Windows / Linux** — cross-platform packaging

---

## License

MIT
