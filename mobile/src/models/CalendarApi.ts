import { GoogleCalendarEvent, GoogleUser } from '../types/calendar';

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
];

export async function fetchUserProfile(accessToken: string): Promise<GoogleUser> {
  const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Profile API error: ${res.status}`);
  const data = await res.json();
  return { name: data.name ?? '', email: data.email ?? '', picture: data.picture ?? '' };
}

export async function fetchCalendarEvents(accessToken: string): Promise<GoogleCalendarEvent[]> {
  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
      `?timeMin=${encodeURIComponent(timeMin)}` +
      `&timeMax=${encodeURIComponent(timeMax)}` +
      `&singleEvents=true&orderBy=startTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);
  const data = await res.json();
  return (data.items ?? []) as GoogleCalendarEvent[];
}
