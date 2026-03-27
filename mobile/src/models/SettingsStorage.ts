import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  poiRangeMeters: number;
  showNearestPOIBanner: boolean;
}

const SETTINGS_KEY = 'app_settings';
const DEFAULT_SETTINGS: AppSettings = {
  poiRangeMeters: 500,
  showNearestPOIBanner: true,
};

export async function loadSettingsFromStorage(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettingsToStorage(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function clearSettingsFromStorage(): Promise<void> {
  await AsyncStorage.removeItem(SETTINGS_KEY);
}
