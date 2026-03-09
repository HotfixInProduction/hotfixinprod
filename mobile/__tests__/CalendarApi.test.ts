import { fetchUserProfile, fetchCalendarEvents, fetchCalendarList, GOOGLE_CALENDAR_SCOPES } from '../src/models/CalendarApi';

describe('CalendarApi', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should export GOOGLE_CALENDAR_SCOPES', () => {
    expect(Array.isArray(GOOGLE_CALENDAR_SCOPES)).toBe(true);
    expect(GOOGLE_CALENDAR_SCOPES.length).toBeGreaterThan(0);
  });

  // fetchUserProfile

  it('fetchUserProfile throws error on bad response', async () => {
    (globalThis.fetch as jest.Mock) = jest.fn(() => Promise.resolve({ ok: false, status: 401 }));
    await expect(fetchUserProfile('token')).rejects.toThrow('Profile API error: 401');
  });

  it('fetchUserProfile returns user data', async () => {
    (globalThis.fetch as jest.Mock) = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({ name: 'Test', email: 'test@mail.com', picture: 'pic' }),
    }));
    const user = await fetchUserProfile('token');
    expect(user).toEqual({ name: 'Test', email: 'test@mail.com', picture: 'pic' });
  });

  it('fetchUserProfile handles missing fields with empty string fallbacks', async () => {
    (globalThis.fetch as jest.Mock) = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({}),
    }));
    const user = await fetchUserProfile('token');
    expect(user).toEqual({ name: '', email: '', picture: '' });
  });

  // fetchCalendarList

  it('fetchCalendarList throws error on bad response', async () => {
    (globalThis.fetch as jest.Mock) = jest.fn(() => Promise.resolve({ ok: false, status: 403 }));
    await expect(fetchCalendarList('token')).rejects.toThrow('CalendarList API error: 403');
  });

  it('fetchCalendarList returns list of calendars', async () => {
    const mockCalendars = [
      { id: 'primary', summary: 'My Calendar', backgroundColor: '#4A90E2', primary: true },
      { id: 'work@example.com', summary: 'Work', backgroundColor: '#E94B3C' },
    ];
    (globalThis.fetch as jest.Mock) = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({ items: mockCalendars }),
    }));
    const result = await fetchCalendarList('token');
    expect(result).toEqual(mockCalendars);
  });

  it('fetchCalendarList returns empty array when items is missing', async () => {
    (globalThis.fetch as jest.Mock) = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({}),
    }));
    const result = await fetchCalendarList('token');
    expect(result).toEqual([]);
  });

  it('fetchCalendarList sends Authorization header', async () => {
    const mockFetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({ items: [] }),
    }));
    (globalThis.fetch as jest.Mock) = mockFetch;
    await fetchCalendarList('my-token');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      expect.objectContaining({
        headers: { Authorization: 'Bearer my-token' },
      })
    );
  });

  // fetchCalendarEvents

  it('fetchCalendarEvents throws error on bad response', async () => {
    (globalThis.fetch as jest.Mock) = jest.fn(() => Promise.resolve({ ok: false, status: 403 }));
    await expect(fetchCalendarEvents('token')).rejects.toThrow('Calendar API error: 403');
  });

  it('fetchCalendarEvents returns events with dateTime (filters out all-day)', async () => {
    const items = [
      { id: '1', start: { dateTime: '2026-03-10T10:00:00' }, end: { dateTime: '2026-03-10T11:00:00' } },
      { id: '2', start: { date: '2026-03-10' }, end: { date: '2026-03-10' } }, // all-day, should be filtered
    ];
    (globalThis.fetch as jest.Mock) = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({ items }),
    }));
    const events = await fetchCalendarEvents('token');
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('1');
  });

  it('fetchCalendarEvents returns empty array when items is missing', async () => {
    (globalThis.fetch as jest.Mock) = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({}),
    }));
    const events = await fetchCalendarEvents('token');
    expect(events).toEqual([]);
  });

  it('fetchCalendarEvents defaults to primary calendar', async () => {
    const mockFetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({ items: [] }),
    }));
    (globalThis.fetch as jest.Mock) = mockFetch;
    await fetchCalendarEvents('token');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/calendars/primary/events'),
      expect.any(Object)
    );
  });

  it('fetchCalendarEvents uses provided calendarId', async () => {
    const mockFetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({ items: [] }),
    }));
    (globalThis.fetch as jest.Mock) = mockFetch;
    await fetchCalendarEvents('token', 'work@example.com');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('work@example.com')),
      expect.any(Object)
    );
  });

  it('fetchCalendarEvents sends Authorization header', async () => {
    const mockFetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({ items: [] }),
    }));
    (globalThis.fetch as jest.Mock) = mockFetch;
    await fetchCalendarEvents('my-token');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { Authorization: 'Bearer my-token' },
      })
    );
  });
});