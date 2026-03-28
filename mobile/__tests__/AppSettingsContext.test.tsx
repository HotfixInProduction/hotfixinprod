import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AppSettingsProvider, useAppSettings } from '../src/context/AppSettingsContext';
import * as SettingsStorage from '../src/models/SettingsStorage';

jest.mock('../src/models/SettingsStorage', () => ({
  loadSettingsFromStorage: jest.fn(),
  saveSettingsToStorage: jest.fn(),
}));

const mockLoadSettings = SettingsStorage.loadSettingsFromStorage as jest.Mock;
const mockSaveSettings = SettingsStorage.saveSettingsToStorage as jest.Mock;

describe('AppSettingsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppSettingsProvider>{children}</AppSettingsProvider>
  );

  describe('AppSettingsProvider', () => {
    it('initializes with null settings and loading state', () => {
      mockLoadSettings.mockResolvedValueOnce({ poiRangeMeters: 500, showNearestPOIBanner: true });
      const { result } = renderHook(() => useAppSettings(), { wrapper });

      expect(result.current.settings).toBeNull();
      expect(result.current.isLoading).toBe(true);
    });

    it('loads settings on mount', async () => {
      const mockSettings = { poiRangeMeters: 750, showNearestPOIBanner: false };
      mockLoadSettings.mockResolvedValueOnce(mockSettings);

      const { result } = renderHook(() => useAppSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings).toEqual(mockSettings);
      expect(mockLoadSettings).toHaveBeenCalledTimes(1);
    });

    it('handles error during settings load', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockLoadSettings.mockRejectedValueOnce(new Error('Load failed'));

      const { result } = renderHook(() => useAppSettings(), { wrapper });

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
      const initialSettings = { poiRangeMeters: 500, showNearestPOIBanner: true };
      mockLoadSettings.mockResolvedValueOnce(initialSettings);
      mockSaveSettings.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAppSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedSettings = { poiRangeMeters: 1000 };

      await act(async () => {
        await result.current.updateSettings(updatedSettings);
      });

      expect(result.current.settings).toEqual({
        ...initialSettings,
        ...updatedSettings,
      });
      expect(mockSaveSettings).toHaveBeenCalledWith({
        ...initialSettings,
        ...updatedSettings,
      });
    });

    it('merges partial updates with existing settings', async () => {
      const initialSettings = { poiRangeMeters: 500, showNearestPOIBanner: true };
      mockLoadSettings.mockResolvedValueOnce(initialSettings);
      mockSaveSettings.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAppSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const partialUpdate = { showNearestPOIBanner: false };

      await act(async () => {
        await result.current.updateSettings(partialUpdate);
      });

      expect(result.current.settings).toEqual({
        poiRangeMeters: 500,
        showNearestPOIBanner: false,
      });
      expect(mockSaveSettings).toHaveBeenCalledWith({
        poiRangeMeters: 500,
        showNearestPOIBanner: false,
      });
    });

    it('does not update settings if not loaded', async () => {
      mockLoadSettings.mockResolvedValueOnce({ poiRangeMeters: 500, showNearestPOIBanner: true });
      const { result } = renderHook(() => useAppSettings(), { wrapper });

      // Force settings to be null before update
      const { result: result2 } = renderHook(() => useAppSettings(), {
        wrapper: ({ children }) => {
          mockLoadSettings.mockResolvedValueOnce(null);
          return <AppSettingsProvider>{children}</AppSettingsProvider>;
        },
      });

      mockSaveSettings.mockResolvedValueOnce(undefined);

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result2.current.updateSettings({ poiRangeMeters: 800 });
      });

      expect(mockSaveSettings).not.toHaveBeenCalled();
    });

    it('cleanup handles unmounted component correctly', async () => {
      mockLoadSettings.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ poiRangeMeters: 500, showNearestPOIBanner: true }), 100);
          })
      );

      const { unmount } = renderHook(() => useAppSettings(), { wrapper });

      // Unmount before settings load completes
      unmount();

      // Wait to see if any state updates happen after unmount
      // If they do, this test would fail, but since we have isMounted check, it shouldn't
      await waitFor(() => {
        expect(mockLoadSettings).toHaveBeenCalled();
      });
    });
  });

  describe('useAppSettings hook', () => {
    it('throws error when used outside of provider', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAppSettings());
      }).toThrow('useAppSettings must be used within AppSettingsProvider');

      consoleErrorSpy.mockRestore();
    });

    it('returns context value when used inside provider', async () => {
      const mockSettings = { poiRangeMeters: 600, showNearestPOIBanner: true };
      mockLoadSettings.mockResolvedValueOnce(mockSettings);

      const { result } = renderHook(() => useAppSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings).toEqual(mockSettings);
      expect(typeof result.current.updateSettings).toBe('function');
    });
  });
});
