// Shared calendar types used across Model, ViewModel, and View layers

export interface ClassEvent {
  id: string;
  title: string;
  location: string;
  building: string;
  room: string;
  startTime: Date;
  endTime: Date;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
  color: string;
}

export interface GoogleAuthToken {
  accessToken: string;
  expiresAt: number; // Unix ms timestamp
  tokenType: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  location?: string;
  colorId?: string;
  start: { dateTime: string };
  end: { dateTime: string };
}

export interface GoogleCalendarListEntry {
  id: string;
  summary: string;       // calendar display name
  backgroundColor: string;
  primary?: boolean;
}

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

export interface GoogleCalendarState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: GoogleAuthToken | null;
  user: GoogleUser | null;
  events: ClassEvent[];
  calendars: GoogleCalendarListEntry[];
  selectedCalendarId: string;
}