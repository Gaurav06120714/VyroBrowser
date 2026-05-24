<div align="center">

<img src="apps/browser/assets/icon.png" alt="Vyro Browser" width="120" />

# Vyro Browser

**The AI-first desktop browser. Local. Private. Fast.**

[![macOS](https://img.shields.io/badge/macOS-12%2B-black?style=flat-square&logo=apple&logoColor=white)](https://github.com/Gaurav06120714/Vyro/releases)
[![Windows](https://img.shields.io/badge/Windows-10%2B-0078D4?style=flat-square&logo=windows&logoColor=white)](https://github.com/Gaurav06120714/Vyro/releases)
[![Linux](https://img.shields.io/badge/Linux-Ubuntu%2020%2B-E95420?style=flat-square&logo=ubuntu&logoColor=white)](https://github.com/Gaurav06120714/Vyro/releases)
[![Electron](https://img.shields.io/badge/Electron-31-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/Gaurav06120714/Vyro/ci.yml?style=flat-square&label=CI)](https://github.com/Gaurav06120714/Vyro/actions)

[**Download**](#-download) · [**Quick Start**](#-quick-start) · [**Ollama Setup**](#-ollama-setup) · [**Features**](#-features) · [**Architecture**](#-architecture) · [**Contributing**](#-contributing)

---

> Vyro is a Chromium-based desktop browser built on Electron that runs a **local AI assistant powered by Ollama** — your AI data never leaves your machine. Every inference, every suggestion, every summary happens entirely on-device.

</div>

---

## 📥 Download

| Platform | Installer | Portable |
|---|---|---|
| **macOS** (Apple Silicon) | [Vyro-arm64.dmg](https://github.com/Gaurav06120714/Vyro/releases/latest) | [Vyro-arm64.zip](https://github.com/Gaurav06120714/Vyro/releases/latest) |
| **macOS** (Intel) | [Vyro-x64.dmg](https://github.com/Gaurav06120714/Vyro/releases/latest) | [Vyro-x64.zip](https://github.com/Gaurav06120714/Vyro/releases/latest) |
| **Windows** x64 | [Vyro-Setup.exe](https://github.com/Gaurav06120714/Vyro/releases/latest) | [Vyro-portable.exe](https://github.com/Gaurav06120714/Vyro/releases/latest) |
| **Linux** x64 | [Vyro.AppImage](https://github.com/Gaurav06120714/Vyro/releases/latest) | [Vyro.deb](https://github.com/Gaurav06120714/Vyro/releases/latest) |

> **Note:** Builds are unsigned for now. See [platform notes](#platform-notes) for Gatekeeper / SmartScreen bypass instructions.

---

## ✅ Platform Support Matrix

| Feature | macOS | Windows | Linux |
|---|:---:|:---:|:---:|
| Tabbed browsing | ✅ | ✅ | ✅ |
| Native vibrancy / glass | ✅ | ✅¹ | — |
| System tray | — | ✅ | ✅ |
| Custom title bar | ✅ | ✅ | — |
| Keyboard shortcuts (Cmd/Ctrl) | ✅ | ✅ | ✅ |
| AI assistant (Ollama) | ✅ | ✅ | ✅ |
| One-click model install | ✅ | ✅ | ✅ |
| Ad-blocking | ✅ | ✅ | ✅ |
| Reader mode + TTS | ✅ | ✅ | ✅ |
| Per-profile sessions | ✅ | ✅ | ✅ |
| DMG installer | ✅ | — | — |
| NSIS installer | — | ✅ | — |
| AppImage / .deb | — | — | ✅ |
| GPU acceleration | ✅ | ✅² | ✅ |
| Dock / Start Menu shortcut | ✅ | ✅ | ✅ |
| Crash recovery | ✅ | ✅ | ✅ |
| CSP (renderer shell) | ✅ | ✅ | ✅ |

¹ Acrylic-inspired glassmorphism via CSS `backdrop-filter: blur()`
² Requires NVIDIA/AMD drivers; see [Windows GPU Setup](#windows-gpu-setup)

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | ≥ 20 LTS | [nodejs.org](https://nodejs.org) |
| pnpm | ≥ 9 | `npm i -g pnpm` |
| **macOS** Xcode CLI tools | latest | `xcode-select --install` |
| **Windows** VS Build Tools | 2019/2022 | See [Windows Setup](#windows-development-setup) |
| **Linux** build-essential | any | `sudo apt install build-essential` |
| Ollama | latest | Optional — needed for AI features |

### Clone & Install

```bash
git clone https://github.com/Gaurav06120714/Vyro.git
cd Vyro/apps/browser
pnpm install
```

> **Windows:** If `better-sqlite3` fails to compile:
> ```powershell
> npx electron-rebuild -f -w better-sqlite3
> ```

### Development

```bash
pnpm dev          # TypeScript watch (main) + Vite dev server (renderer)
```

### Build & Package

```bash
# Build only (no package)
pnpm build

# Package for current platform
pnpm package

# Package without creating installer (faster for testing)
pnpm package:dir
```

#### Platform-specific packaging

```bash
# macOS → .dmg + .zip (arm64 + x64)
pnpm package

# Windows → NSIS setup .exe + portable .exe
pnpm package

# Linux → .AppImage + .deb
pnpm package
```

---

## 🎓 Onboarding Walkthrough

Vyro shows a guided first-launch wizard on every fresh install, inspired by Arc, Cursor, and Raycast.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Step 1 · Welcome                                                    │
│  Detects your OS — shows platform-optimized messaging + features     │
│                                                                      │
│  Step 2 · Ollama Detection                                           │
│  Pings localhost:11434 · "Check Again" button                        │
│  Platform-specific install command with one-click copy               │
│  macOS: brew install ollama                                          │
│  Windows: installer download link                                    │
│  Linux: curl -fsSL https://ollama.ai/install.sh | sh                │
│                                                                      │
│  Step 3 · Model Selection                                            │
│  Grid of 5 models with size, RAM requirement, recommended badge      │
│  One-click install · live download progress bar · cancel support     │
│                                                                      │
│  Step 4 · Ready                                                      │
│  AI health verification · keyboard shortcut cheatsheet               │
│  "Launch Vyro" button → automatically opens the real browser UI      │
└──────────────────────────────────────────────────────────────────────┘
```

**You can always skip.** Every step has a "Skip for now" option — you'll never be stuck on an onboarding screen.

**Reset onboarding:**

```js
// Run in browser DevTools (Cmd/Ctrl+Alt+I)
localStorage.removeItem('vyro:onboarding:complete');
location.reload();
```

---

## 🤖 Ollama Setup

### macOS

```bash
# Install
brew install ollama

# Start as background service (auto-starts on login)
brew services start ollama

# Verify
curl http://localhost:11434/api/tags

# Pull a model
ollama pull llama3.2
```

**Apple Silicon:** Ollama uses Metal GPU acceleration automatically on M1/M2/M3/M4.

### Windows

1. Download installer from [ollama.ai/download/windows](https://ollama.ai/download/windows)
2. Run the installer — Ollama is added to PATH and starts as a background service

**NVIDIA GPU:** Install [CUDA Toolkit 12+](https://developer.nvidia.com/cuda-downloads)
**AMD GPU:** Install [ROCm for Windows](https://rocm.docs.amd.com/) (experimental)

```powershell
# Verify
ollama list

# Pull a model
ollama pull llama3.2
```

**PATH detection:** If Ollama isn't found, add `%LOCALAPPDATA%\Programs\Ollama` to your PATH.

### Linux

```bash
# Install
curl -fsSL https://ollama.ai/install.sh | sh

# Start as systemd service
sudo systemctl enable --now ollama

# Verify
curl http://localhost:11434/api/tags

# Pull a model
ollama pull llama3.2
```

**NVIDIA:** Ensure CUDA drivers are installed (`nvidia-smi` should show your GPU)
**AMD:** Install [ROCm](https://rocm.docs.amd.com/en/latest/deploy/linux/index.html)

### AI Diagnostics

Vyro includes built-in Ollama diagnostics reachable via the onboarding wizard:

- Ollama API connectivity check
- Installed models list with size info
- Test inference (short prompt)
- Auto-reconnect on API timeout
- Streaming performance metrics (tokens/sec)
- Intelligent fallback: if a model isn't found, suggests alternatives

---

## 🧠 AI Model Catalog

Install models from the Vyro onboarding UI or via CLI:

| Model | Size | RAM Needed | Badge | Best For |
|---|---|---|---|---|
| **llama3.2** | 2.0 GB | ~3 GB | ⭐ Recommended | General chat, reasoning |
| **qwen2.5-coder** | 4.7 GB | ~6 GB | 💻 Code | Code generation, debugging |
| **mistral** | 4.1 GB | ~6 GB | ⚡ Fast | Fast responses, Q&A |
| **codellama** | 3.8 GB | ~6 GB | 🔧 Dev | Code completion, refactoring |
| **deepseek-coder** | 3.8 GB | ~6 GB | 🧠 Deep | Complex reasoning, analysis |

After a model finishes downloading, Vyro automatically:
1. Verifies the Ollama API responds
2. Confirms the model is listed in `/api/tags`
3. Preloads the AI service
4. Opens the real Vyro browser UI

---

## ✨ Features

### 1 · Cross-Platform Browser Shell

- **Tabbed browsing** — open, close, reorder, pin, group tabs; restore recently closed
- **Address bar** — URL navigation + keyword shortcuts + AI queries
- **Smart keyword navigation** — `gh react`, `yt lofi`, `npm axios` → jump directly to the right URL
- **Find in page** — `Cmd/Ctrl+F` inline search
- **Zoom controls** — per-tab zoom with on-screen indicator
- **Command palette** — `Cmd/Ctrl+K` fuzzy search over tabs, bookmarks, history, shortcuts
- **Context menu** — right-click actions: open in new tab, copy, inspect, translate

### 2 · Windows Premium Support

- Custom `WindowsTitleBar` component — minimize / maximize / close with proper drag region
- Acrylic-inspired glassmorphism via `backdrop-filter: blur()`
- System tray integration — hide/show window, New Tab, Quit
- NSIS installer with Desktop + Start Menu shortcuts
- GPU acceleration (NVIDIA CUDA, AMD ROCm via Ollama)
- `better-sqlite3` native module rebuild guide for Windows
- Electron webview stability with `webviewTag: true` + isolated sessions

### 3 · First-Launch Onboarding

- 4-step wizard: Welcome → Ollama detection → Model download → Ready
- Platform detection with OS-specific install commands
- Live Ollama health check with re-check button
- One-click model installation with streaming progress bars
- Cancel support mid-download
- AI health verification before completing
- Never blocks the user — skip available at every step
- Auto-redirects to browser after successful setup

### 4 · Full Ollama Integration

- Ollama HTTP client with streaming NDJSON parsing
- Model pull with real-time progress (percent + status)
- AbortController per model for reliable cancel
- `list-models` IPC: name, size, modified date
- Auto-reconnect on Ollama service restart
- Per-conversation model selection
- Streaming chat responses token-by-token

### 5 · One-Click AI Model Downloading

- 5 curated model cards with size, RAM requirements, description
- ⭐ Recommended badge on llama3.2
- Install / Installed / Downloading / Error states
- Live progress bar with percentage
- Cancel button during download
- Retry on failure
- Installed badge once complete

### 6 · Modern Browser Features

- **Ad-blocking** — network-level via `@cliqz/adblocker-electron`; per-site toggle
- **Reader mode** — clean article extraction from any page
- **Text-to-speech** — read articles aloud
- **Bookmarks** — tree-organised; import/export
- **History** — full navigation history with search
- **Downloads manager** — pause/resume/cancel with progress
- **Per-profile sessions** — isolated cookies/storage per profile
- **Custom injections** — per-origin CSS/JS
- **Permissions dialog** — camera/microphone/geolocation prompts

### 7 · Premium UI/UX

- **Dark-first design** — Tailwind CSS, no light-mode flicker
- **macOS vibrancy** — native `under-window` blur for translucent chrome
- **Glassmorphism** — Windows title bar + sidebar with `backdrop-filter`
- **Custom traffic lights** — macOS: positioned at (16, 14) with hiddenInset
- **Windows custom titlebar** — `WindowsTitleBar.tsx` with proper drag regions
- **Smooth transitions** — CSS transitions on all interactive states
- **AI sidebar** — persistent panel with conversation history, model picker
- **Onboarding visuals** — gradient backgrounds, progress indicators, success states

### 8 · Developer Experience

- TypeScript 5 throughout (main + renderer + shared)
- Vite 5 for renderer (HMR, fast builds)
- ESLint (`@typescript-eslint`, `react-hooks` plugins)
- Prettier (consistent formatting)
- GitHub Actions CI/CD (lint → build → package → release on all 3 platforms)
- `INVOKE_ALLOWLIST` + `PUSH_ALLOWLIST` for type-safe IPC
- `.env.example` / `.env.development` / `.env.production` with documented variables
- Turbo monorepo build pipeline
- pnpm workspaces

### 9 · Performance, Reliability & Security

- **Content Security Policy** — applied to renderer shell via `onHeadersReceived`
- **Context isolation** — renderer fully sandboxed from Node.js
- **IPC allowlist** — preload drops any channel not in the whitelist
- **Crash recovery** — `crash-recovery.ts` restores session after renderer crash
- **Window bounds persistence** — restores size/position across restarts
- **Multi-display safety** — `ensureVisible()` moves off-screen windows back into view
- **SQLite WAL mode** — better crash resilience for the local database
- **Single-instance lock** — prevents duplicate app windows
- **Startup optimization** — `show: false` until `ready-to-show` fires (no white flash)
- **Lazy webview mounting** — webviews created only when a tab is first activated
- **Background tab throttling** — Chromium reduces timer resolution for hidden webviews

---

## 🏗 Architecture

```
VyroBrowser/
├── apps/
│   ├── browser/                ← Primary Electron app
│   │   ├── src/
│   │   │   ├── main/           Electron main process (Node.js)
│   │   │   │   ├── index.ts            App entry, lifecycle, tray
│   │   │   │   ├── window-manager.ts   Cross-platform window + CSP
│   │   │   │   ├── shortcuts.ts        Global shortcuts (Cmd/Ctrl)
│   │   │   │   ├── tray.ts             System tray (Windows/Linux)
│   │   │   │   ├── ipc/                IPC handlers (20+ modules)
│   │   │   │   │   └── onboarding.ts   Ollama check, model pull, streaming
│   │   │   │   ├── services/
│   │   │   │   │   ├── ai-service.ts       Ollama HTTP + streaming
│   │   │   │   │   ├── db.ts               SQLite init + 7 migrations
│   │   │   │   │   ├── crash-recovery.ts   Session restore
│   │   │   │   │   └── ...
│   │   │   │   ├── adblock/            Network-level request filtering
│   │   │   │   └── preload/            contextBridge — window.vyro API
│   │   │   │
│   │   │   ├── renderer/       React renderer process (Vite)
│   │   │   │   ├── App.tsx             Root — onboarding gate + browser shell
│   │   │   │   ├── pages/
│   │   │   │   │   ├── Onboarding.tsx  4-step first-launch wizard
│   │   │   │   │   └── NewTab.tsx      Speed dial + search home page
│   │   │   │   ├── components/
│   │   │   │   │   ├── browser/        TabBar, AddressBar, CommandPalette...
│   │   │   │   │   │   └── WindowsTitleBar.tsx  Custom titlebar (Windows)
│   │   │   │   │   ├── sidebar/        AIPanel, HistoryPanel, BookmarksPanel...
│   │   │   │   │   └── modals/         Settings, Bookmarks, Permissions...
│   │   │   │   ├── hooks/              useOnboarding, useAI, useKeywords...
│   │   │   │   └── store/              Zustand (tabs, AI, UI, settings...)
│   │   │   │
│   │   │   └── shared/         Compiled into both processes
│   │   │       ├── ipc-channels.ts     All IPC channels + allowlists
│   │   │       ├── constants.ts        App-wide constants
│   │   │       └── types/              TypeScript interfaces
│   │   │
│   │   ├── assets/             Icons (icns, ico, png)
│   │   ├── .env.example        Environment variable template
│   │   ├── .env.development
│   │   └── .env.production
│   │
│   └── api/                    Optional backend API (Express + WebSocket)
│
├── packages/
│   ├── agent-core/             Ollama tool-calling agent (BrowserAgent)
│   ├── ai-prompts/             System prompts, tool definitions
│   ├── browser-engine/         Browser automation engine
│   ├── dom-parser/             DOM parsing utilities
│   ├── shared-types/           Cross-package TypeScript types
│   └── ui-components/          Shared React component library
│
├── .github/workflows/ci.yml    GitHub Actions: lint → build → release
├── .eslintrc.js
├── .prettierrc
└── turbo.json                  Turbo monorepo pipeline
```

### IPC Security Model

```
Renderer (React)                contextBridge               Main (Node.js)
────────────────                ─────────────               ──────────────
window.vyro.invoke()  ────────► INVOKE_ALLOWLIST  ────────► ipcMain.handle()
window.vyro.on()      ◄────────  PUSH_ALLOWLIST   ◄────────  webContents.send()
```

Only whitelisted channels pass through. All others are silently dropped by the preload bridge.

### Database Schema

```sql
profiles         -- User profiles (isolated cookie/storage partitions)
history          -- Navigation history
bookmarks        -- Saved pages (tree structure)
downloads        -- Download metadata + state
ai_conversations -- Chat sessions (model, system prompt, created_at)
ai_messages      -- Chat messages (role, content, token_count)
injections       -- Custom CSS/JS per origin
adblock_rules    -- Per-domain blocking overrides
```

---

## ⌨️ Keyboard Shortcuts

> **Cmd** on macOS · **Ctrl** on Windows/Linux

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + T` | New tab |
| `Cmd/Ctrl + W` | Close current tab |
| `Cmd/Ctrl + L` | Focus address bar |
| `Cmd/Ctrl + R` | Reload page |
| `Cmd/Ctrl + Shift + R` | Hard reload (bypass cache) |
| `Cmd/Ctrl + [` | Go back |
| `Cmd/Ctrl + ]` | Go forward |
| `Cmd/Ctrl + F` | Find in page |
| `Cmd/Ctrl + K` | Command palette |
| `Cmd/Ctrl + Tab` | Next tab |
| `Cmd/Ctrl + Shift + Tab` | Previous tab |
| `Cmd/Ctrl + 1–8` | Switch to tab N |
| `Cmd/Ctrl + 9` | Switch to last tab |
| `Cmd/Ctrl + +` / `-` | Zoom in / out |
| `Cmd/Ctrl + 0` | Reset zoom |
| `Cmd/Ctrl + Alt + I` | Open DevTools |

---

## 🖥 Platform Notes

### macOS

- Native `vibrancy: 'under-window'` for translucent chrome (Sonoma-style glass)
- Traffic lights via `titleBarStyle: 'hiddenInset'` + `trafficLightPosition: { x: 16, y: 14 }`
- Dock menu: New Window / New Tab (right-click Dock icon)
- `window-all-closed` keeps app alive in Dock (Chrome/Arc behaviour)
- **Gatekeeper bypass:** Right-click → Open in Finder, then click Open

### Windows

- `WindowsTitleBar.tsx` replaces native frame (`titleBarStyle: 'hidden'`)
- Glassmorphism sidebar and title bar via CSS `backdrop-filter: blur()`
- System tray: hide/show window, New Tab, Quit
- NSIS installer creates Desktop + Start Menu shortcuts
- Uninstall via Windows Add/Remove Programs
- GPU acceleration enabled by default
- **SmartScreen bypass:** Click "More info" → "Run anyway" for unsigned local builds

### Linux

- Standard native frame (`frame: true`) for compositor compatibility
- System tray for window management
- AppImage: `chmod +x Vyro.AppImage && ./Vyro.AppImage`
- .deb: `sudo dpkg -i Vyro.deb`
- Ollama via `sudo systemctl enable --now ollama`

---

## 🔒 Privacy Philosophy

> **Your AI, your data, your machine.**

- **Zero telemetry** — Vyro sends nothing to any external server
- **Local AI only** — Ollama runs on your CPU/GPU; prompts never leave your machine
- **Local database** — all history, bookmarks, and conversations in SQLite on your disk
- **Network ad-blocking** — trackers blocked before they load
- **Isolated profiles** — separate cookie/storage partitions per profile
- **Open source** — read every line of code that runs on your machine

---

## 🛡 Security

- **Context isolation** — renderer and main process fully separated
- **IPC allowlist** — only whitelisted channels accessible from the renderer
- **No `nodeIntegration`** — renderer has no direct Node.js access
- **Secure preload** — `contextBridge` exposes only `vyro.invoke()` and `vyro.on()`
- **Content Security Policy** — applied to renderer shell via `onHeadersReceived`
- **Webview isolation** — each tab runs in its own webview with separate session partition
- **Single-instance lock** — prevents concurrent app instances sharing the same database

---

## ⚡ Performance

| Optimization | Description |
|---|---|
| Lazy webview mounting | Tab webviews created only when first activated |
| Background tab throttling | Chromium reduces timer resolution for hidden tabs |
| Crash recovery | Session auto-restored after renderer crash |
| Window state persistence | Size/position restored across restarts |
| `show: false` startup | Window hidden until `ready-to-show` fires (no white flash) |
| Multi-display safety | `ensureVisible()` prevents off-screen windows |
| SQLite WAL mode | Better crash resilience for local database |
| Streaming AI responses | Token-by-token NDJSON streaming from Ollama |

---

## 🪟 Windows Development Setup

### 1. Install Visual Studio Build Tools

Required to compile `better-sqlite3` (native Node.js addon).

```powershell
# Option A: winget
winget install Microsoft.VisualStudio.2022.BuildTools

# Option B: Download from visualstudio.microsoft.com/downloads/
# → Tools for Visual Studio → Build Tools for Visual Studio 2022
# → Select workload: "Desktop development with C++"
```

### 2. Install Node.js & pnpm

```powershell
winget install OpenJS.NodeJS.LTS
npm install -g pnpm
```

### 3. Clone & install

```powershell
git clone https://github.com/Gaurav06120714/Vyro.git
cd Vyro\apps\browser
pnpm install
npx electron-rebuild -f -w better-sqlite3
```

### 4. Start development

```powershell
pnpm dev
```

### Windows GPU Setup

**NVIDIA:**

```powershell
# Install CUDA Toolkit 12.x
# https://developer.nvidia.com/cuda-downloads
# Ollama detects CUDA automatically
ollama run llama3.2   # should show GPU usage in task manager
```

**AMD:**

```powershell
# ROCm for Windows (experimental)
# https://rocm.docs.amd.com/en/latest/deploy/windows/index.html
```

### Building the Windows Installer

```powershell
pnpm build
pnpm package
# Output: apps/browser/dist/
#   Vyro Setup X.Y.Z.exe   — NSIS installer
#   Vyro X.Y.Z.exe         — portable executable
```

---

## 🛠 Developer Experience

### Tooling

| Tool | Purpose |
|---|---|
| TypeScript 5 | Strict typing across main + renderer + shared |
| Vite 5 | Renderer HMR, fast production builds |
| ESLint | `@typescript-eslint` + `react-hooks` rules |
| Prettier | Consistent formatting |
| Turbo | Monorepo build pipeline with caching |
| pnpm 9 | Fast, disk-efficient package management |
| GitHub Actions | CI: lint → build → package → release (all 3 platforms) |

### Environment Variables

Copy `.env.example` → `.env.development`:

| Variable | Default | Description |
|---|---|---|
| `ELECTRON_IS_DEV` | `1` | Loads Vite dev server, opens DevTools |
| `NODE_ENV` | `development` | `production` in packaged builds |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API endpoint |
| `LOG_LEVEL` | `debug` | Pino log level |
| `VITE_APP_VERSION` | `0.1.0` | Injected into renderer via `import.meta.env` |

### Useful Commands

```bash
# Type-check without building
npx tsc --noEmit -p tsconfig.main.json

# Rebuild native modules after Electron upgrade
npx electron-rebuild -f -w better-sqlite3

# Lint
pnpm --filter @vyro/browser lint

# Format
npx prettier --write "src/**/*.{ts,tsx}"

# Build main process only
pnpm --filter @vyro/browser build:main

# Build renderer only
pnpm --filter @vyro/browser build:renderer
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| Blank window on startup | `pnpm build:main` then `pnpm dev`; check DevTools console |
| `better-sqlite3` compile error | `npx electron-rebuild -f -w better-sqlite3` |
| Windows: missing build tools | Install VS Build Tools 2022 with "Desktop development with C++" |
| AI panel shows "Ollama not running" | `ollama serve` or `brew services start ollama` (macOS) |
| Packaged app blocked by Gatekeeper | Right-click → Open in Finder → Open |
| Packaged app blocked by SmartScreen | Click "More info" → "Run anyway" |
| Linux: SUID sandbox error | Run with `--no-sandbox` flag or fix permissions |
| Ollama not found on Windows | Add `%LOCALAPPDATA%\Programs\Ollama` to PATH |
| Webview shows blank page | Navigate via address bar; check network access |
| Window opens off-screen | Delete `~/.config/Vyro/window-state.json` |

---

## 🗺 Roadmap

### ✅ Completed

- [x] Cross-platform packaging — macOS (dmg/zip), Windows (NSIS/portable), Linux (AppImage/deb)
- [x] Platform-safe window manager — vibrancy on macOS, custom titlebar on Windows, native frame on Linux
- [x] First-launch onboarding wizard — Ollama detection, model download, health verification, auto-redirect
- [x] System tray — Windows and Linux (hide/show, New Tab, Quit)
- [x] OS-specific keyboard shortcuts — Cmd on macOS, Ctrl on Windows/Linux
- [x] One-click model installation — live progress, cancel, retry, installed badges
- [x] Full Ollama integration — streaming chat, model listing, diagnostics
- [x] AI sidebar — streaming chat, conversation history, multi-model support
- [x] Ad-blocking — network-level, per-site toggle
- [x] Reader mode + TTS
- [x] Command palette
- [x] Per-profile sessions
- [x] Bookmarks, History, Downloads managers
- [x] Custom CSS/JS injection per origin
- [x] Content Security Policy for renderer shell
- [x] Crash recovery + session restore
- [x] GitHub Actions CI/CD (lint → build → release on macOS / Windows / Linux)
- [x] ESLint + Prettier
- [x] Environment files (.env.example / .env.development / .env.production)
- [x] Windows GPU setup documentation
- [x] `better-sqlite3` Windows compatibility guide

### 🚧 Planned

- [ ] Vertical tabs sidebar
- [ ] Split view (side-by-side tabs)
- [ ] Workspaces (named tab groups)
- [ ] AI omnibox — `?` prefix to query AI from address bar
- [ ] Explain selected text via context menu
- [ ] AI rewrite / translate / debug / summarize actions
- [ ] Privacy dashboard — per-page tracker breakdown
- [ ] Fingerprinting protection
- [ ] Tab sleeping / memory saver for inactive tabs
- [ ] Framer Motion animations
- [ ] Dynamic themes + wallpaper support
- [ ] Focus mode / compact mode
- [ ] Ollama model manager — update, delete, RAM usage indicators
- [ ] Streaming performance metrics (tokens/sec)
- [ ] Auto-update (electron-updater)
- [ ] Chrome extension compatibility (MV3)
- [ ] Sync (bookmarks + history across devices)
- [ ] Vitest unit tests
- [ ] Playwright end-to-end tests
- [ ] Husky + lint-staged pre-commit hooks
- [ ] Conventional commits enforcement

---

## 🆚 Vyro vs. Alternatives

| Feature | Vyro | Chrome | Arc | Zen | Brave |
|---|:---:|:---:|:---:|:---:|:---:|
| Local AI (no API key) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Open source | ✅ | ❌ | ❌ | ✅ | ✅ |
| Zero telemetry | ✅ | ❌ | ❌ | ✅ | ⚠️ |
| Built-in ad-blocking | ✅ | ❌ | ❌ | ✅ | ✅ |
| Windows support | ✅ | ✅ | ❌ | ✅ | ✅ |
| Linux support | ✅ | ✅ | ❌ | ✅ | ✅ |
| Reader mode | ✅ | ❌ | ✅ | ✅ | ✅ |
| Command palette | ✅ | ❌ | ✅ | ✅ | ❌ |
| Custom injections | ✅ | ❌ | ❌ | ❌ | ❌ |
| Keyword shortcuts | ✅ | ❌ | ❌ | ❌ | ❌ |
| Per-profile sessions | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🤝 Contributing

Contributions are welcome!

### 1. Fork & Clone

```bash
git clone https://github.com/<your-fork>/Vyro.git
cd Vyro/apps/browser
pnpm install
```

### 2. Create a branch

```bash
git checkout -b feat/your-feature
# or
git checkout -b fix/your-bug
```

### 3. Commit convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add vertical tabs sidebar
fix: resolve better-sqlite3 crash on Windows
docs: update Ollama setup guide for Linux GPU
chore: upgrade Electron to 32
```

### 4. Open a PR

Push and open a pull request against `main`. CI runs lint + build + package on macOS, Windows, and Linux automatically.

### Development tips

- Renderer changes: instant via Vite HMR
- Main process changes: requires restarting `pnpm dev`
- New IPC channels: add to `src/shared/ipc-channels.ts` allowlists before calling from renderer
- Platform-specific code: always guard with `process.platform === 'darwin'` etc.

---

## 📄 License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<div align="center">

Built with ❤️ using Electron · React · TypeScript · Ollama

[Report a Bug](https://github.com/Gaurav06120714/Vyro/issues) · [Request a Feature](https://github.com/Gaurav06120714/Vyro/issues) · [Discussions](https://github.com/Gaurav06120714/Vyro/discussions)

</div>
