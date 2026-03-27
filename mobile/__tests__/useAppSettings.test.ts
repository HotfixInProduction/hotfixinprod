import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAppSettings } from '../src/hooks/useAppSettings';
import * as SettingsStorage from '../src/models/SettingsStorage';

jest.mock('../src/models/SettingsStorage', () => ({
  loadSettingsFromStorage: jest.fn(),
  saveSettingsToStorage: jest.fn(),
}));

const mockLoadSettings = SettingsStorage.loadSettingsFromStorage as jest.Mock;
const mockSaveSettings = SettingsStorage.saveSettingsToStorage as jest.Mock;

describe('useAppSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with null settings and loading state', () => {
    mockLoadSettings.mockResolvedValueOnce({ poiRangeMeters: 500 });
    const { result } = renderHook(() => useAppSettings());
    
    expect(result.current.settings).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('loads settings on mount', async () => {
    const mockSettings = { poiRangeMeters: 750 };
    mockLoadSettings.mockResolvedValueOnce(mockSettings);

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toEqual(mockSettings);
    expect(mockLoadSettings).toHaveBeenCalledTimes(1);
  });

  it('handles error during settings load', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockLoadSettings.mockRejectedValueOnce(new Error('Load failed'));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to load settings:',
      expect.any(Error)
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('updates settings and persists to storage', async () => {
    const initialSettings = { poiRangeMeters: 500 };
    mockLoadSettings.mockResolvedValueOnce(initialSettings);
    mockSaveSettings.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updatedSettings = { poiRangeMeters: 1000 };

    await act(async () => {
      await result.current.updateSettings(updatedSettings);
    });

    expect(result.current.settings).toEqual(updatedSettings);
    expect(mockSaveSettings).toHaveBeenCalledWith(updatedSettings);
  });

  it('merges partial updates with existing settings', async () => {
    const initialSettings = { poiRangeMeters: 500 };
    mockLoadSettings.mockResolvedValueOnce(initialSettings);
    mockSaveSettings.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const partialUpdate = { poiRangeMeters: 800 };

    await act(async () => {
      await result.current.updateSettings(partialUpdate);
    });

    expect(result.current.settings).toEqual(partialUpdate);
  });

  it('does not update settings if not loaded', async () => {
    mockLoadSettings.mockImplementationOnce(async () => {
      // Simulate loading that doesn't complete
      return new Promise(() => {});
    });

    const { result } = renderHook(() => useAppSettings());

    // Settings are still null
    expect(result.current.settings).toBeNull();

    // Try to update (should not throw)
    await act(async () => {
      await result.current.updateSettings({ poiRangeMeters: 600 });
    });

    // Should not have saved
    expect(mockSaveSettings).not.toHaveBeenCalled();
  });
});
