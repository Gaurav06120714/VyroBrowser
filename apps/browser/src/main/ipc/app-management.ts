import { ipcMain, app, session, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { IPC } from '../../shared/ipc-channels';

function getDirSizeSync(dirPath: string): number {
  if (!fs.existsSync(dirPath)) return 0;
  let total = 0;
  try {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += getDirSizeSync(full);
      } else {
        try { total += fs.statSync(full).size; } catch {  }
      }
    }
  } catch {  }
  return total;
}

function rmSafe(dirPath: string): void {
  if (!fs.existsSync(dirPath)) return;
  try { fs.rmSync(dirPath, { recursive: true, force: true }); } catch {  }
}

export function runStartupMigration(): void {
  const platform = process.platform;
  const oldNames = ['Electron', 'vyro-desktop', 'vyro-browser', 'VyroBrowser'];

  try {
    if (platform === 'darwin') {
      const base = path.join(app.getPath('home'), 'Library', 'Application Support');
      for (const name of oldNames) {
        const old = path.join(base, name);
        if (fs.existsSync(old)) {
          const vyroData = app.getPath('userData'); 
          _migrateUserData(old, vyroData);
          rmSafe(old);
        }
      }
    } else if (platform === 'win32') {
      const appData = process.env.APPDATA || '';
      const localAppData = process.env.LOCALAPPDATA || '';
      for (const name of oldNames) {
        rmSafe(path.join(appData, name));
        rmSafe(path.join(localAppData, name));
      }
    } else {
      const base = path.join(app.getPath('home'), '.config');
      for (const name of oldNames) {
        rmSafe(path.join(base, name));
      }
    }
  } catch {
    
  }
}

function _migrateUserData(oldDir: string, newDir: string): void {
  const filesToMigrate = ['vyro.db', 'window-state.json', 'active-profile.txt'];
  for (const file of filesToMigrate) {
    const src = path.join(oldDir, file);
    const dst = path.join(newDir, file);
    if (fs.existsSync(src) && !fs.existsSync(dst)) {
      try {
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.copyFileSync(src, dst);
      } catch {  }
    }
  }
}

export function registerAppManagementIpc(): void {

  ipcMain.handle(IPC.APP_GET_VERSION, () => ({
    version: app.getVersion(),
    name: app.getName(),
    appId: 'com.vyro.browser',
    platform: process.platform,
    arch: process.arch,
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
    userData: app.getPath('userData'),
  }));

  ipcMain.handle(IPC.APP_GET_CACHE_SIZE, () => {
    const userData = app.getPath('userData');
    const cacheDirs = ['Cache', 'Code Cache', 'GPUCache', 'DawnGraphiteCache',
      'DawnWebGPUCache', 'blob_storage', 'Service Worker'];
    let totalBytes = 0;
    for (const dir of cacheDirs) {
      totalBytes += getDirSizeSync(path.join(userData, dir));
    }
    return { bytes: totalBytes, mb: (totalBytes / 1024 / 1024).toFixed(1) };
  });

  ipcMain.handle(IPC.APP_CLEAR_CACHE, async () => {
    try {
      const ses = session.defaultSession;
      await ses.clearCache();
      await ses.clearStorageData({
        storages: ['serviceworkers', 'shadercache'],
      });
      
      const userData = app.getPath('userData');
      const wipeDirs = ['Cache', 'Code Cache', 'blob_storage'];
      for (const d of wipeDirs) rmSafe(path.join(userData, d));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message };
    }
  });

  ipcMain.handle(IPC.APP_CLEAR_GPU_CACHE, async () => {
    try {
      const userData = app.getPath('userData');
      const gpuDirs = ['GPUCache', 'DawnGraphiteCache', 'DawnWebGPUCache'];
      for (const d of gpuDirs) rmSafe(path.join(userData, d));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message };
    }
  });

  ipcMain.handle(IPC.APP_RESET, async () => {
    try {
      const ses = session.defaultSession;
      await ses.clearCache();
      await ses.clearStorageData();
      const userData = app.getPath('userData');
      const keepFiles = new Set(['vyro.db', 'vyro.db-shm', 'vyro.db-wal',
        'active-profile.txt', 'window-state.json']);
      const entries = fs.readdirSync(userData);
      for (const entry of entries) {
        if (!keepFiles.has(entry)) {
          rmSafe(path.join(userData, entry));
        }
      }
      
      app.relaunch();
      app.exit(0);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message };
    }
  });
}
