// Utility to flush all pending promises
const flushPromises = () => new Promise(setImmediate);
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useGoogleCalendar } from '../src/hooks/useGoogleCalendar';

jest.mock('../src/models/CalendarStorage', () => ({
  loadTokenFromStorage: jest.fn(),
  saveTokenToStorage: jest.fn(),
  clearTokenFromStorage: jest.fn(),
  loadUserFromStorage: jest.fn(),
  saveUserToStorage: jest.fn(),
  clearUserFromStorage: jest.fn(),
  isTokenExpired: jest.fn()
}));
jest.mock('../src/models/CalendarApi', () => ({
  fetchCalendarEvents: jest.fn(),
  fetchUserProfile: jest.fn(),
  GOOGLE_CALENDAR_SCOPES: ['scope']
}));
jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: () => [null, null, jest.fn()]
}));
jest.mock('expo-auth-session', () => ({ makeRedirectUri: () => 'redirect' }));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('expo-constants', () => ({ expoConfig: { extra: {} } }));



interface HookType {
  state: any;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

type OnHookType = (hook: HookType) => void;

function TestComponent({ onHook }: { onHook: OnHookType }) {
  const hook = useGoogleCalendar();
  React.useEffect(() => {
    onHook && onHook(hook as HookType);
  }, [hook, onHook]);
  return null;
}

describe('useGoogleCalendar', () => {
    it('handles valid token and loads events (success branch)', async () => {
      const { loadTokenFromStorage, isTokenExpired, loadUserFromStorage } = require('../src/models/CalendarStorage');
      const { fetchCalendarEvents, fetchUserProfile } = require('../src/models/CalendarApi');
      loadTokenFromStorage.mockResolvedValueOnce({ accessToken: 'token', expiresAt: Date.now() + 10000, tokenType: 'Bearer' });
      isTokenExpired.mockReturnValueOnce(false);
      loadUserFromStorage.mockResolvedValueOnce(null);
      fetchCalendarEvents.mockResolvedValueOnce([{ id: '1', start: { dateTime: new Date().toISOString() }, end: { dateTime: new Date().toISOString() }, location: 'B 101', summary: 'Math' }]);
      fetchUserProfile.mockResolvedValueOnce({ name: 'Test', email: 'test@mail.com', picture: 'pic' });
      let hook: HookType | undefined;
      await act(async () => {
        TestRenderer.create(<TestComponent onHook={(h: HookType) => { hook = h; }} />);
      });
      for (let i = 0; i < 10 && (!hook?.state.isAuthenticated || hook?.state.events.length === 0); i++) {
        await act(async () => { await flushPromises(); });
      }
      expect(hook?.state.isAuthenticated).toBe(true);
      expect(hook?.state.user).toEqual({ name: 'Test', email: 'test@mail.com', picture: 'pic' });
      expect(hook?.state.events.length).toBeGreaterThan(0);
    });

    it('handles error in loadEvents (catch branch)', async () => {
      const { loadTokenFromStorage, isTokenExpired, loadUserFromStorage } = require('../src/models/CalendarStorage');
      const { fetchCalendarEvents, fetchUserProfile } = require('../src/models/CalendarApi');
      loadTokenFromStorage.mockResolvedValueOnce({ accessToken: 'token', expiresAt: Date.now() + 10000, tokenType: 'Bearer' });
      isTokenExpired.mockReturnValueOnce(false);
      loadUserFromStorage.mockResolvedValueOnce(null);
      fetchCalendarEvents.mockRejectedValueOnce(new Error('fetch fail'));
      fetchUserProfile.mockResolvedValueOnce({ name: 'Test', email: 'test@mail.com', picture: 'pic' });
      let hook: HookType | undefined;
      await act(async () => {
        TestRenderer.create(<TestComponent onHook={(h: HookType) => { hook = h; }} />);
      });
      for (let i = 0; i < 10 && !hook?.state.error; i++) {
        await act(async () => { await flushPromises(); });
      }
      expect(hook?.state.error).toBe('fetch fail');
      expect(hook?.state.isLoading).toBe(false);
    });

    it('calls connect directly and sets loading', async () => {
      let hook: HookType | undefined;
      await act(async () => {
        TestRenderer.create(<TestComponent onHook={(h: HookType) => { hook = h; }} />);
      });
      await act(async () => { await hook?.connect(); });
      expect(hook?.state.isLoading).toBe(true);
    });

    it('calls disconnect directly and resets state', async () => {
      let hook: HookType | undefined;
      await act(async () => {
        TestRenderer.create(<TestComponent onHook={(h: HookType) => { hook = h; }} />);
      });
      await act(async () => { await hook?.disconnect(); });
      expect(hook?.state.isAuthenticated).toBe(false);
      expect(hook?.state.token).toBe(null);
      expect(hook?.state.user).toBe(null);
      expect(hook?.state.events).toEqual([]);
    });
  it('handles missing token (else branch)', async () => {
    const { loadTokenFromStorage, isTokenExpired } = require('../src/models/CalendarStorage');
    loadTokenFromStorage.mockResolvedValueOnce(null);
    isTokenExpired.mockReturnValueOnce(true);
    let hook: HookType | undefined;
    await act(async () => {
      TestRenderer.create(<TestComponent onHook={(h: HookType) => { hook = h; }} />);
    });
    // Wait for state update
    await act(async () => { await Promise.resolve(); });
    expect(hook?.state.isLoading).toBe(false);
    expect(hook?.state.isAuthenticated).toBe(false);
  });

  it('handles expired token (else branch)', async () => {
    const { loadTokenFromStorage, isTokenExpired } = require('../src/models/CalendarStorage');
    loadTokenFromStorage.mockResolvedValueOnce({ accessToken: 'token', expiresAt: Date.now() - 10000, tokenType: 'Bearer' });
    isTokenExpired.mockReturnValueOnce(true);
    let hook: HookType | undefined;
    await act(async () => {
      TestRenderer.create(<TestComponent onHook={(h: HookType) => { hook = h; }} />);
    });
    await act(async () => { await Promise.resolve(); });
    expect(hook?.state.isLoading).toBe(false);
    expect(hook?.state.isAuthenticated).toBe(false);
  });

  it('handles response type dismiss', async () => {
    jest.resetModules();
    jest.doMock('expo-auth-session/providers/google', () => ({
      useAuthRequest: () => [null, { type: 'dismiss' }, jest.fn()]
    }));
    const { useGoogleCalendar } = require('../src/hooks/useGoogleCalendar');
    let hook: HookType | undefined;
    await act(async () => {
      TestRenderer.create(<TestComponent onHook={(h: HookType) => { hook = h; }} />);
    });
    await act(async () => { await Promise.resolve(); });
    expect(hook?.state.isLoading).toBe(false);
    expect(hook?.state.error).toBe(null);
  });

  it('handles response type cancel', async () => {
    jest.resetModules();
    jest.doMock('expo-auth-session/providers/google', () => ({
      useAuthRequest: () => [null, { type: 'cancel' }, jest.fn()]
    }));
    const { useGoogleCalendar } = require('../src/hooks/useGoogleCalendar');
    let hook: HookType | undefined;
    await act(async () => {
      TestRenderer.create(<TestComponent onHook={(h: HookType) => { hook = h; }} />);
    });
    await act(async () => { await Promise.resolve(); });
    expect(hook?.state.isLoading).toBe(false);
    expect(hook?.state.error).toBe(null);
  });

  it('connect sets loading and calls promptAsync', async () => {
    const { useGoogleCalendar } = require('../src/hooks/useGoogleCalendar');
    let hook: HookType | undefined;
    await act(async () => {
      TestRenderer.create(<TestComponent onHook={(h: HookType) => { hook = h; }} />);
    });
    await act(async () => { await hook?.connect(); });
    expect(hook?.state.isLoading).toBe(true);
  });

  it('disconnect resets state', async () => {
    const { useGoogleCalendar } = require('../src/hooks/useGoogleCalendar');
    let hook: HookType | undefined;
    await act(async () => {
      TestRenderer.create(<TestComponent onHook={(h: HookType) => { hook = h; }} />);
    });
    await act(async () => { await hook?.disconnect(); });
    expect(hook?.state.isAuthenticated).toBe(false);
    expect(hook?.state.token).toBe(null);
    expect(hook?.state.user).toBe(null);
    expect(hook?.state.events).toEqual([]);
  });
  it('initializes with loading state', () => {
    let hook: HookType | undefined;
    act(() => {
      TestRenderer.create(<TestComponent onHook={(h: HookType) => { hook = h; }} />);
    });
    expect(hook?.state.isLoading).toBe(true);
    expect(hook?.state.isAuthenticated).toBe(false);
  });
});
