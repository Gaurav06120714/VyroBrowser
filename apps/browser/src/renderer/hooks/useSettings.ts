import { useEffect, useCallback } from 'react';
import { ipc, IPC } from '../lib/ipc';
import { useSettingsStore } from '../store/settings.store';
import { AppSettings } from '@shared/types/settings';
import { DEFAULT_PROFILE_ID } from '@shared/constants';

export function useSettings() {
  const { settings, setSettings, updateSetting } = useSettingsStore();

  useEffect(() => {
    ipc.invoke<AppSettings>(IPC.SETTINGS_GET, { profileId: DEFAULT_PROFILE_ID })
      .then(setSettings)
      .catch(console.error);
  }, []);

  // Apply the selected theme to the document, following the OS when set to
  // 'system'. Sets data-theme="light" | "dark" on <html>.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const resolved =
        settings.theme === 'system'
          ? (mq.matches ? 'light' : 'dark')
          : settings.theme;
      document.documentElement.setAttribute('data-theme', resolved);
    };
    apply();
    if (settings.theme === 'system') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [settings.theme]);

  // Apply the accent color to the CSS custom properties live.
  useEffect(() => {
    const accent = settings.accentColor || '#6366f1';
    const root = document.documentElement;
    root.style.setProperty('--vyro-accent', accent);
    // Derive a translucent glow from the accent hex.
    const hex = accent.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      root.style.setProperty('--vyro-accent-glow', `rgba(${r}, ${g}, ${b}, 0.35)`);
    }
  }, [settings.accentColor]);

  const saveSetting = useCallback(async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateSetting(key, value);
    await ipc.invoke(IPC.SETTINGS_SET, {
      profileId: DEFAULT_PROFILE_ID,
      settings: { [key]: value },
    });
  }, [updateSetting]);

  const saveSettings = useCallback(async (partial: Partial<AppSettings>) => {
    await ipc.invoke(IPC.SETTINGS_SET, { profileId: DEFAULT_PROFILE_ID, settings: partial });
    const refreshed = await ipc.invoke<AppSettings>(IPC.SETTINGS_GET, { profileId: DEFAULT_PROFILE_ID });
    setSettings(refreshed);
  }, [setSettings]);

  return { settings, saveSetting, saveSettings };
}
