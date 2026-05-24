import { Tray, Menu, nativeImage, app, BrowserWindow, NativeImage } from 'electron';
import path from 'path';

let tray: Tray | null = null;

/** Resolve the best tray icon for the current platform and DPI. */
function getTrayIcon(): NativeImage {
  const base = path.join(__dirname, '../../assets');

  if (process.platform === 'win32') {
    // Windows: use .ico — Windows scales it automatically for all DPIs
    const ico = path.join(base, 'icon.ico');
    const img = nativeImage.createFromPath(ico);
    if (!img.isEmpty()) return img;
  }

  // Linux / macOS fallback: use the 32px PNG (tray icons are ~22–24px rendered)
  const png32 = path.join(base, 'icons', '32x32.png');
  const img32 = nativeImage.createFromPath(png32);
  if (!img32.isEmpty()) return img32.resize({ width: 22, height: 22 });

  // Ultimate fallback: resize icon.png
  const fallback = nativeImage
    .createFromPath(path.join(base, 'icon.png'))
    .resize({ width: 22, height: 22 });
  return fallback;
}

export function createTray(getWindow: () => BrowserWindow | null): void {
  if (process.platform !== 'win32' && process.platform !== 'linux') return;
  if (tray) return;

  tray = new Tray(getTrayIcon());
  tray.setToolTip('Vyro Browser');

  const rebuild = () => {
    const win = getWindow();
    const isVisible = win?.isVisible() ?? false;
    const menu = Menu.buildFromTemplate([
      {
        label: isVisible ? 'Hide Vyro' : 'Show Vyro',
        click: () => {
          const w = getWindow();
          if (!w) return;
          if (w.isVisible()) { w.hide(); } else { w.show(); w.focus(); }
          rebuild();
        },
      },
      { type: 'separator' },
      {
        label: 'New Tab',
        click: () => {
          const w = getWindow();
          if (!w) return;
          w.show(); w.focus();
          w.webContents.send('app:new-tab');
        },
      },
      {
        label: 'New Window',
        click: () => {
          const w = getWindow();
          if (w) { w.show(); w.focus(); }
        },
      },
      { type: 'separator' },
      { label: 'Quit Vyro', click: () => app.quit() },
    ]);
    tray!.setContextMenu(menu);
  };

  rebuild();

  tray.on('click', () => {
    const w = getWindow();
    if (!w) return;
    if (w.isVisible()) { w.focus(); } else { w.show(); w.focus(); }
    rebuild();
  });

  tray.on('double-click', () => {
    const w = getWindow();
    if (!w) return;
    w.show(); w.focus();
  });
}

export function destroyTray(): void {
  tray?.destroy();
  tray = null;
}
