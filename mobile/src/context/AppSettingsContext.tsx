import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  AppSettings,
  loadSettingsFromStorage,
  saveSettingsToStorage,
} from '../models/SettingsStorage';

interface AppSettingsContextType {
  settings: AppSettings | null;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
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

  // Memoize the context value to prevent unnecessary re-renders in child components
  const contextValue = useMemo(
    () => ({ settings, isLoading, updateSettings }),
    [settings, isLoading]
  );

  return (
    <AppSettingsContext.Provider value={contextValue}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
}
