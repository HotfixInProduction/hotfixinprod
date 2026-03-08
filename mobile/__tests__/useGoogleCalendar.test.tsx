import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useGoogleCalendar, mapToClassEvent, extractRoom, filterValidClassEvents, validateEventBuilding } from '../src/hooks/useGoogleCalendar';
import type { GoogleCalendarEvent, ClassEvent } from '../src/types/calendar';
import { loadTokenFromStorage, isTokenExpired, loadUserFromStorage, saveTokenToStorage } from '../src/models/CalendarStorage';
import { fetchCalendarEvents, fetchCalendarList, fetchUserProfile } from '../src/models/CalendarApi';

jest.mock('../src/models/CalendarStorage', () => ({
  loadTokenFromStorage: jest.fn(),
  saveTokenToStorage: jest.fn(),
  clearTokenFromStorage: jest.fn(),
  loadUserFromStorage: jest.fn(),
  saveUserToStorage: jest.fn(),
  clearUserFromStorage: jest.fn(),
  isTokenExpired: jest.fn(),
}));

jest.mock('../src/models/CalendarApi', () => ({
  fetchCalendarEvents: jest.fn(),
  fetchCalendarList: jest.fn(),
  fetchUserProfile: jest.fn(),
  GOOGLE_CALENDAR_SCOPES: ['scope'],
}));

// Mutable response ref so individual tests can control what useAuthRequest returns
let mockResponse: any = null;
const mockPromptAsync = jest.fn();
jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: () => [null, mockResponse, mockPromptAsync],
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

const mockEvent = {
  id: '1',
  start: { dateTime: new Date().toISOString() },
  end: { dateTime: new Date().toISOString() },
  location: 'B 101',
  summary: 'Math',
};

const mockCalendars = [
  { id: 'primary', summary: 'My Calendar', backgroundColor: '#4A90E2', primary: true },
  { id: 'work@example.com', summary: 'Work', backgroundColor: '#E94B3C' },
];

const mockUser = { name: 'Test', email: 'test@mail.com', picture: 'pic' };

describe('useGoogleCalendar', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockResponse = null;
  });

  // Initial state

  it('initializes with correct default state', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue(null);
    const { result } = renderHook(() => useGoogleCalendar());

    expect(result.current.state.isLoading).toBe(true);
    expect(result.current.state.isAuthenticated).toBe(false);
    expect(result.current.state.calendars).toEqual([]);
    expect(result.current.state.selectedCalendarId).toBe('primary');

    await waitFor(() => expect(result.current.state.isLoading).toBe(false));
  });

  it('handles expired token', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue({ accessToken: 'token', expiresAt: Date.now() - 10000, tokenType: 'Bearer' });
    (isTokenExpired as jest.Mock).mockReturnValue(true);

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));
    expect(result.current.state.isAuthenticated).toBe(false);
  });

  // loadEvents

  it('handles valid token and loads events and calendars', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue({ accessToken: 'token', expiresAt: Date.now() + 10000, tokenType: 'Bearer' });
    (isTokenExpired as jest.Mock).mockReturnValue(false);
    (loadUserFromStorage as jest.Mock).mockResolvedValue(null);
    (fetchCalendarEvents as jest.Mock).mockResolvedValue([mockEvent]);
    (fetchUserProfile as jest.Mock).mockResolvedValue(mockUser);
    (fetchCalendarList as jest.Mock).mockResolvedValue(mockCalendars);

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isAuthenticated).toBe(true));

    expect(result.current.state.user).toEqual(mockUser);
    expect(result.current.state.events.length).toBeGreaterThan(0);
    expect(result.current.state.calendars).toEqual(mockCalendars);
    expect(result.current.state.selectedCalendarId).toBe('primary');
  });

  it('handles valid token with existing user from storage', async () => {
    const savedUser = { name: 'Cached', email: 'cached@mail.com', picture: 'pic2' };
    (loadTokenFromStorage as jest.Mock).mockResolvedValue({ accessToken: 'token', expiresAt: Date.now() + 10000, tokenType: 'Bearer' });
    (isTokenExpired as jest.Mock).mockReturnValue(false);
    (loadUserFromStorage as jest.Mock).mockResolvedValue(savedUser);
    (fetchCalendarEvents as jest.Mock).mockResolvedValue([mockEvent]);
    (fetchCalendarList as jest.Mock).mockResolvedValue(mockCalendars);

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isAuthenticated).toBe(true));

    expect(result.current.state.user).toEqual(savedUser);
    expect(fetchUserProfile).not.toHaveBeenCalled();
    expect(result.current.state.calendars).toEqual(mockCalendars);
  });

  it('handles error in loadEvents', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue({ accessToken: 'token', expiresAt: Date.now() + 10000, tokenType: 'Bearer' });
    (isTokenExpired as jest.Mock).mockReturnValue(false);
    (loadUserFromStorage as jest.Mock).mockResolvedValue(null);
    (fetchCalendarEvents as jest.Mock).mockRejectedValue(new Error('fetch fail'));
    (fetchUserProfile as jest.Mock).mockResolvedValue(mockUser);
    (fetchCalendarList as jest.Mock).mockResolvedValue(mockCalendars);

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.error).toBe('fetch fail'));
    expect(result.current.state.isLoading).toBe(false);
  });

  it('handles non-Error throw in loadEvents', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue({ accessToken: 'token', expiresAt: Date.now() + 10000, tokenType: 'Bearer' });
    (isTokenExpired as jest.Mock).mockReturnValue(false);
    (loadUserFromStorage as jest.Mock).mockResolvedValue(null);
    (fetchCalendarEvents as jest.Mock).mockRejectedValue('string error');
    (fetchUserProfile as jest.Mock).mockResolvedValue(mockUser);
    (fetchCalendarList as jest.Mock).mockResolvedValue(mockCalendars);

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.error).toBe('Failed to load events'));
  });

  // connect / disconnect

  it('connect sets loading', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue(null);
    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    await act(async () => {
      await result.current.connect();
    });
    expect(result.current.state.isLoading).toBe(true);
  });

  it('disconnect resets full state including calendars', async () => {
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
    expect(result.current.state.calendars).toEqual([]);
    expect(result.current.state.selectedCalendarId).toBe('primary');
  });

  // selectCalendar

  it('selectCalendar does nothing if no token', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue(null);
    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    await act(async () => {
      await result.current.selectCalendar('work@example.com');
    });

    expect(fetchCalendarEvents).not.toHaveBeenCalled();
  });

  it('selectCalendar re-fetches events with new calendarId', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue({ accessToken: 'token', expiresAt: Date.now() + 10000, tokenType: 'Bearer' });
    (isTokenExpired as jest.Mock).mockReturnValue(false);
    (loadUserFromStorage as jest.Mock).mockResolvedValue(mockUser);
    (fetchCalendarEvents as jest.Mock).mockResolvedValue([mockEvent]);
    (fetchCalendarList as jest.Mock).mockResolvedValue(mockCalendars);

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.selectCalendar('work@example.com');
    });

    await waitFor(() => expect(result.current.state.selectedCalendarId).toBe('work@example.com'));
    expect(fetchCalendarEvents).toHaveBeenCalledWith('token', 'work@example.com');
  });

  it('selectCalendar updates selectedCalendarId in state', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue({ accessToken: 'token', expiresAt: Date.now() + 10000, tokenType: 'Bearer' });
    (isTokenExpired as jest.Mock).mockReturnValue(false);
    (loadUserFromStorage as jest.Mock).mockResolvedValue(mockUser);
    (fetchCalendarEvents as jest.Mock).mockResolvedValue([]);
    (fetchCalendarList as jest.Mock).mockResolvedValue(mockCalendars);

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.selectCalendar('work@example.com');
    });

    await waitFor(() => expect(result.current.state.selectedCalendarId).toBe('work@example.com'));
  });

  // OAuth responses

  it('handles successful OAuth response and loads calendars', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue(null);
    (fetchCalendarEvents as jest.Mock).mockResolvedValue([mockEvent]);
    (fetchUserProfile as jest.Mock).mockResolvedValue(mockUser);
    (fetchCalendarList as jest.Mock).mockResolvedValue(mockCalendars);

    mockResponse = {
      type: 'success',
      authentication: { accessToken: 'new-token', expiresIn: 3600 },
    };

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isAuthenticated).toBe(true));

    expect(saveTokenToStorage).toHaveBeenCalled();
    expect(result.current.state.user).toEqual(mockUser);
    expect(result.current.state.calendars).toEqual(mockCalendars);
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

  it('handles cancelled OAuth response', async () => {
    (loadTokenFromStorage as jest.Mock).mockResolvedValue(null);
    mockResponse = { type: 'cancel' };

    const { result } = renderHook(() => useGoogleCalendar());
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));
    expect(result.current.state.error).toBe(null);
  });
});

describe('extractRoom', () => {
  it('extracts room correctly for standard formats', () => {
    expect(extractRoom('H 353')).toBe('H353');
    expect(extractRoom('B-101')).toBe('B-101');
    expect(extractRoom('XYZ123')).toBe('XYZ123');
  });

  it('returns empty string for invalid input', () => {
    expect(extractRoom('NoRoomHere')).toBe('');
    expect(extractRoom('')).toBe('');
  });
});

describe('mapToClassEvent', () => {
  it('maps a GoogleCalendarEvent to a ClassEvent', () => {
    const googleEvent: GoogleCalendarEvent = {
      id: '1',
      summary: 'SOEN 345',
      location: 'H 353',
      start: { dateTime: '2026-03-07T10:00:00Z' },
      end: { dateTime: '2026-03-07T11:00:00Z' },
    };
    const classEvent = mapToClassEvent(googleEvent, 0);
    expect(classEvent.title).toBe('SOEN 345');
    expect(classEvent.building).toBe('H');
    expect(classEvent.room).toBe('353');
    expect(classEvent.color).toBeDefined();
  });

  it('handles missing location', () => {
    const googleEvent: GoogleCalendarEvent = {
      id: '3',
      summary: 'COMP 346',
      location: undefined,
      start: { dateTime: '2026-03-07T10:00:00Z' },
      end: { dateTime: '2026-03-07T11:00:00Z' },
    };
    const classEvent = mapToClassEvent(googleEvent, 0);
    expect(classEvent.location).toBe('');
    expect(classEvent.building).toBe('');
  });
});

describe('filterValidClassEvents', () => {
  const makeEvent = (title: string): ClassEvent => ({
    id: '1', title, location: '', building: '', room: '',
    startTime: new Date(), endTime: new Date(), dayOfWeek: 1, color: '#000',
  });

  it('keeps events matching code + number (SOEN 345, SOEN345, SOEN-345)', () => {
    expect(filterValidClassEvents([makeEvent('SOEN 345 LEC')])).toHaveLength(1);
    expect(filterValidClassEvents([makeEvent('SOEN345')])).toHaveLength(1);
    expect(filterValidClassEvents([makeEvent('SOEN-345')])).toHaveLength(1);
  });

  it('filters out events with no class code', () => {
    expect(filterValidClassEvents([makeEvent('Team Meeting')])).toHaveLength(0);
  });

  it('filters out events with a code but no number', () => {
    expect(filterValidClassEvents([makeEvent('SOEN Tutorial')])).toHaveLength(0);
  });
});

describe('validateEventBuilding', () => {
  const makeEvent = (building: string): ClassEvent => ({
    id: '1', title: 'SOEN 345', location: `${building} 100`,
    building, room: '100', startTime: new Date(), endTime: new Date(), dayOfWeek: 1, color: '#000',
  });

  it('returns true for a known building', () => {
    expect(validateEventBuilding(makeEvent('H'))).toBe(true);
  });

  it('returns false for an unknown building', () => {
    expect(validateEventBuilding(makeEvent('UNKN'))).toBe(false);
  });
});
});
