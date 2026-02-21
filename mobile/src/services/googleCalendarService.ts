export interface GoogleCalendar {
  id: string;
  summary: string;
  backgroundColor: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

export async function fetchCalendarList(token: string): Promise<GoogleCalendar[]> {
  const response = await fetch(`${CALENDAR_API_BASE}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch calendar list: ${response.status}`);
  }

  const data = await response.json();
  return (data.items ?? []) as GoogleCalendar[];
}

export async function fetchEventsForWeek(
  token: string,
  calendarId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: weekStart.toISOString(),
    timeMax: weekEnd.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const response = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch events for calendar ${calendarId}: ${response.status}`);
  }

  const data = await response.json();
  return (data.items ?? []) as GoogleCalendarEvent[];
}
