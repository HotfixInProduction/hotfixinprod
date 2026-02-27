import { fetchUserProfile, fetchCalendarEvents, GOOGLE_CALENDAR_SCOPES } from '../src/models/CalendarApi';

describe('CalendarApi', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should export GOOGLE_CALENDAR_SCOPES', () => {
    expect(Array.isArray(GOOGLE_CALENDAR_SCOPES)).toBe(true);
    expect(GOOGLE_CALENDAR_SCOPES.length).toBeGreaterThan(0);
  });

  it('fetchUserProfile throws error on bad response', async () => {
    (global.fetch as jest.Mock) = jest.fn(() => Promise.resolve({ ok: false, status: 401 }));
    await expect(fetchUserProfile('token')).rejects.toThrow('Profile API error: 401');
  });

  it('fetchUserProfile returns user data', async () => {
    (global.fetch as jest.Mock) = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({ name: 'Test', email: 'test@mail.com', picture: 'pic' })
    }));
    const user = await fetchUserProfile('token');
    expect(user).toEqual({ name: 'Test', email: 'test@mail.com', picture: 'pic' });
  });

  it('fetchCalendarEvents throws error on bad response', async () => {
    (global.fetch as jest.Mock) = jest.fn(() => Promise.resolve({ ok: false, status: 403 }));
    await expect(fetchCalendarEvents('token')).rejects.toThrow('Calendar API error: 403');
  });

  it('fetchCalendarEvents returns events', async () => {
    (global.fetch as jest.Mock) = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({ items: [{ id: 1 }, { id: 2 }] })
    }));
    const events = await fetchCalendarEvents('token');
    expect(events).toEqual([{ id: 1 }, { id: 2 }]);
  });
});
