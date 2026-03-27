import { AppSettings } from '../src/models/SettingsStorage';
import * as SettingsStorage from '../src/models/SettingsStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const defaultSettings: AppSettings = { poiRangeMeters: 500, showNearestPOIBanner: true };
const customSettings: AppSettings = { poiRangeMeters: 1000, showNearestPOIBanner: false };

describe('SettingsStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadSettingsFromStorage', () => {
    it('returns default settings when no data exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      const result = await SettingsStorage.loadSettingsFromStorage();
      expect(result).toEqual(defaultSettings);
    });

    it('returns stored settings when data exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(customSettings));
      const result = await SettingsStorage.loadSettingsFromStorage();
      expect(result).toEqual(customSettings);
    });

    it('merges stored settings with defaults', async () => {
      const partialSettings = { poiRangeMeters: 750, showNearestPOIBanner: true };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(partialSettings));
      const result = await SettingsStorage.loadSettingsFromStorage();
      expect(result).toEqual(partialSettings);
    });

    it('returns default settings on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
      const result = await SettingsStorage.loadSettingsFromStorage();
      expect(result).toEqual(defaultSettings);
    });
  });

  describe('saveSettingsToStorage', () => {
    it('calls setItem with correct key and serialized settings', async () => {
      await SettingsStorage.saveSettingsToStorage(customSettings);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'app_settings',
        JSON.stringify(customSettings)
      );
    });

    it('saves default settings', async () => {
      await SettingsStorage.saveSettingsToStorage(defaultSettings);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'app_settings',
        JSON.stringify(defaultSettings)
      );
    });
  });

  describe('clearSettingsFromStorage', () => {
    it('calls removeItem with correct key', async () => {
      await SettingsStorage.clearSettingsFromStorage();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('app_settings');
    });
  });
});
