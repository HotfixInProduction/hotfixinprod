import { useState, useEffect } from 'react';
import {
  AppSettings,
  loadSettingsFromStorage,
  saveSettingsToStorage,
} from '../models/SettingsStorage';

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const loadedSettings = await loadSettingsFromStorage();
        if (isMounted) {
          setSettings(loadedSettings);
        }
      } catch (error) {
        // Handle error gracefully - settings remain null
        if (isMounted) {
          console.error('Failed to load settings:', error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!settings) return;

    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    await saveSettingsToStorage(updatedSettings);
  };

  return {
    settings,
    isLoading,
    updateSettings,
  };
}
