import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useGoogleCalendar } from '../src/hooks/useGoogleCalendar';
import { loadTokenFromStorage, isTokenExpired, loadUserFromStorage, saveTokenToStorage } from '../src/models/CalendarStorage';
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

// Mutable response ref so individual tests can control what useAuthRequest returns
let mockResponse: any = null;
const mockPromptAsync = jest.fn();
jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: () => [null, mockResponse, mockPromptAsync]
}));
jest.mock('expo-auth-session', () => ({ makeRedirectUri: () => 'redirect' }));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      androidClientId: 'test-android-client-id',
      iosClientId: 'test-ios-client-id',
    },
  },
}));

describe('useGoogleCalendar', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockResponse = null;
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
    (fetchCalendarEvents as jest.Mock).mockResolvedValue([{ id: '1', start: { dateTime: new Date().toISOString() }, end: { dateTime: new Date().toISOString() }, location: 'B 101', summary: 'Concordia: Math' }]);
    (fetchUserProfile as jest.Mock).mockResolvedValue({ name: 'Test', email: 'test@mail.com', picture: 'pic' });

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isAuthenticated).toBe(true));
    expect(result.current.state.user).toEqual({ name: 'Test', email: 'test@mail.com', picture: 'pic' });
    expect(result.current.state.events.length).toBeGreaterThan(0);
  });

  it('handles valid token with existing user from storage', async () => {
    const savedUser = { name: 'Cached', email: 'cached@mail.com', picture: 'pic2' };
    (loadTokenFromStorage as jest.Mock).mockResolvedValue({ accessToken: 'token', expiresAt: Date.now() + 10000, tokenType: 'Bearer' });
    (isTokenExpired as jest.Mock).mockReturnValue(false);
    (loadUserFromStorage as jest.Mock).mockResolvedValue(savedUser);
    (fetchCalendarEvents as jest.Mock).mockResolvedValue([{ id: '1', start: { dateTime: new Date().toISOString() }, end: { dateTime: new Date().toISOString() }, location: 'B 101', summary: 'Math' }]);

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isAuthenticated).toBe(true));
    expect(result.current.state.user).toEqual(savedUser);
    expect(fetchUserProfile).not.toHaveBeenCalled();
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

  it('handles non-Error throw in loadEvents', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue({ accessToken: 'token', expiresAt: Date.now() + 10000, tokenType: 'Bearer' });
    (isTokenExpired as jest.Mock).mockReturnValue(false);
    (loadUserFromStorage as jest.Mock).mockResolvedValue(null);
    (fetchCalendarEvents as jest.Mock).mockRejectedValue('string error');
    (fetchUserProfile as jest.Mock).mockResolvedValue({ name: 'Test', email: 'test@mail.com', picture: 'pic' });

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.error).toBe('Failed to load events'));
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

  it('handles successful OAuth response', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue(null);
    (fetchCalendarEvents as jest.Mock).mockResolvedValue([{ id: '1', start: { dateTime: new Date().toISOString() }, end: { dateTime: new Date().toISOString() }, location: 'B 101', summary: 'Math' }]);
    (fetchUserProfile as jest.Mock).mockResolvedValue({ name: 'OAuth User', email: 'oauth@mail.com', picture: 'pic' });

    mockResponse = {
      type: 'success',
      authentication: { accessToken: 'new-token', expiresIn: 3600 },
    };

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isAuthenticated).toBe(true));
    expect(saveTokenToStorage).toHaveBeenCalled();
    expect(result.current.state.user).toEqual({ name: 'OAuth User', email: 'oauth@mail.com', picture: 'pic' });
  });

  it('handles error OAuth response', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue(null);
    mockResponse = {
      type: 'error',
      error: { message: 'access_denied' },
    };

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.error).toBe('access_denied'));
    expect(result.current.state.isLoading).toBe(false);
  });

  it('handles dismissed OAuth response', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue(null);
    mockResponse = { type: 'dismiss' };

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));
    expect(result.current.state.error).toBe(null);
  });
});