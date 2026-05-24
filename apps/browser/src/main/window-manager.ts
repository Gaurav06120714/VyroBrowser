import { BrowserWindow, screen, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const STATE_FILE = () => path.join(app.getPath('userData'), 'window-state.json');

function loadBounds(): WindowBounds | null {
  try {
    const raw = fs.readFileSync(STATE_FILE(), 'utf8');
    return JSON.parse(raw) as WindowBounds;
  } catch {
    return null;
  }
}

function saveBounds(win: BrowserWindow): void {
  try {
    const bounds = win.getBounds();
    fs.writeFileSync(STATE_FILE(), JSON.stringify(bounds), 'utf8');
  } catch {
    // ignore
  }
}

function ensureVisible(bounds: WindowBounds): WindowBounds {
  const displays = screen.getAllDisplays();
  const visible = displays.some(d => {
    const { x, y, width, height } = d.workArea;
    return (
      bounds.x < x + width &&
      bounds.x + bounds.width > x &&
      bounds.y < y + height &&
      bounds.y + bounds.height > y
    );
  });
  if (!visible) {
    const primary = screen.getPrimaryDisplay().workArea;
    return {
      x: primary.x + 100,
      y: primary.y + 100,
      width: Math.min(bounds.width, primary.width - 200),
      height: Math.min(bounds.height, primary.height - 200),
    };
  }
  return bounds;
}

function getPlatformWindowOptions(): Electron.BrowserWindowConstructorOptions {
  const platform = process.platform;

  if (platform === 'darwin') {
    return {
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 16, y: 14 },
      // Arc-style translucent chrome — macOS only
      vibrancy: 'under-window',
      visualEffectState: 'followWindow',
      backgroundColor: '#00000000',
      transparent: true,
    };
  }

  if (platform === 'win32') {
    return {
      // Hidden title bar so we can render a custom one in the renderer
      titleBarStyle: 'hidden',
      backgroundColor: '#1a1a2e',
      transparent: false,
    };
  }

  // Linux — use standard frame to avoid compositor issues
  return {
    frame: true,
    backgroundColor: '#1a1a2e',
    transparent: false,
  };
}

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  createMain(): BrowserWindow {
    const saved = loadBounds();
    const bounds = saved ? ensureVisible(saved) : { x: undefined, y: undefined, width: 1280, height: 800 };

    const platformOptions = getPlatformWindowOptions();

    const win = new BrowserWindow({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      minWidth: 800,
      minHeight: 600,
      ...platformOptions,
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        webviewTag: true,
        preload: path.join(__dirname, 'preload/browser-preload.js'),
      },
    });

    win.once('ready-to-show', () => {
      win.show();
    });

    win.on('close', () => {
      saveBounds(win);
    });

    win.on('closed', () => {
      this.mainWindow = null;
    });

    // ── Content Security Policy ──────────────────────────────────────────
    // Applied to the renderer shell only (not to webview content).
    session.defaultSession.webRequest.onHeadersReceived(
      { urls: ['http://localhost:5173/*', 'file://*/*'] },
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* blob: data:; " +
              "connect-src 'self' http://localhost:* ws://localhost:*; " +
              "img-src 'self' data: https: http:; " +
              "font-src 'self' data:;",
            ],
          },
        });
      }
    );

    win.webContents.setWindowOpenHandler(({ url }) => {
      // Block native new windows; let the renderer handle them via IPC
      win.webContents.send('webview:new-window', { url });
      return { action: 'deny' };
    });

    this.mainWindow = win;
    return win;
  }

  getMain(): BrowserWindow | null {
    return this.mainWindow;
  }

  focusMain(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) this.mainWindow.restore();
      this.mainWindow.focus();
    }
  }
}
