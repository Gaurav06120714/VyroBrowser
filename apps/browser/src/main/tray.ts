import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import path from 'path';

let tray: Tray | null = null;

export function createTray(getWindow: () => BrowserWindow | null): void {
  if (process.platform !== 'win32' && process.platform !== 'linux') return;
  if (tray) return;

  const iconPath = path.join(__dirname, '../../assets/icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

  tray = new Tray(icon);
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
}

export function destroyTray(): void {
  tray?.destroy();
  tray = null;
}
