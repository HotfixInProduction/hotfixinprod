import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useGoogleCalendar } from '../src/hooks/useGoogleCalendar';
import { loadTokenFromStorage, isTokenExpired, loadUserFromStorage } from '../src/models/CalendarStorage';
import { fetchCalendarEvents, fetchUserProfile } from '../src/models/CalendarApi';

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

describe('useGoogleCalendar', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('initializes with loading state and handles missing token', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue(null);
    const { result } = renderHook(() => useGoogleCalendar());
    expect(result.current.state.isLoading).toBe(true);
    expect(result.current.state.isAuthenticated).toBe(false);

    await waitFor(() => expect(result.current.state.isLoading).toBe(false));
  });

  it('handles expired token', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue({ accessToken: 'token', expiresAt: Date.now() - 10000, tokenType: 'Bearer' });
    (isTokenExpired as jest.Mock).mockReturnValue(true);

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));
    expect(result.current.state.isAuthenticated).toBe(false);
  });

  it('handles valid token and loads events', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue({ accessToken: 'token', expiresAt: Date.now() + 10000, tokenType: 'Bearer' });
    (isTokenExpired as jest.Mock).mockReturnValue(false);
    (loadUserFromStorage as jest.Mock).mockResolvedValue(null);
    (fetchCalendarEvents as jest.Mock).mockResolvedValue([{ id: '1', start: { dateTime: new Date().toISOString() }, end: { dateTime: new Date().toISOString() }, location: 'B 101', summary: 'Math' }]);
    (fetchUserProfile as jest.Mock).mockResolvedValue({ name: 'Test', email: 'test@mail.com', picture: 'pic' });

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isAuthenticated).toBe(true));
    expect(result.current.state.user).toEqual({ name: 'Test', email: 'test@mail.com', picture: 'pic' });
    expect(result.current.state.events.length).toBeGreaterThan(0);
  });

  it('handles error in loadEvents', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue({ accessToken: 'token', expiresAt: Date.now() + 10000, tokenType: 'Bearer' });
    (isTokenExpired as jest.Mock).mockReturnValue(false);
    (loadUserFromStorage as jest.Mock).mockResolvedValue(null);
    (fetchCalendarEvents as jest.Mock).mockRejectedValue(new Error('fetch fail'));
    (fetchUserProfile as jest.Mock).mockResolvedValue({ name: 'Test', email: 'test@mail.com', picture: 'pic' });

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.error).toBe('fetch fail'));
    expect(result.current.state.isLoading).toBe(false);
  });

  it('connect sets loading', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue(null);
    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    await act(async () => {
      await result.current.connect();
    });
    expect(result.current.state.isLoading).toBe(true);
  });

  it('disconnect resets state', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue(null);
    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    await act(async () => {
      await result.current.disconnect();
    });
    expect(result.current.state.isAuthenticated).toBe(false);
    expect(result.current.state.token).toBe(null);
    expect(result.current.state.user).toBe(null);
    expect(result.current.state.events).toEqual([]);
  });
});