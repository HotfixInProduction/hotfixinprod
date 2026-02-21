import { useState, useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClassEvent } from '../types/ClassEvent';
import {
  fetchCalendarList,
  fetchEventsForWeek,
  GoogleCalendar,
  GoogleCalendarEvent,
} from '../services/googleCalendarService';

const STORAGE_TOKEN_KEY = '@gcal_token';
const STORAGE_SELECTED_CALENDARS_KEY = '@gcal_selected_calendars';

const CALENDAR_COLORS = [
  '#4A90E2', '#E94B3C', '#50C878', '#F39C12',
  '#9B59B6', '#1ABC9C', '#E67E22', '#34495E',
];

function mapGoogleEventToClassEvent(
  event: GoogleCalendarEvent,
  calendarColor: string,
  index: number
): ClassEvent | null {
  const startDateTime = event.start.dateTime ?? event.start.date;
  const endDateTime = event.end.dateTime ?? event.end.date;

  if (!startDateTime || !endDateTime) return null;

  const startTime = new Date(startDateTime);
  const endTime = new Date(endDateTime);

  // Skip all-day events (date-only, no time component)
  if (!event.start.dateTime) return null;

  return {
    id: event.id,
    title: event.summary ?? 'Untitled Event',
    location: event.location ?? '',
    building: '',
    room: '',
    startTime,
    endTime,
    dayOfWeek: startTime.getDay(),
    color: calendarColor,
  };
}

function getWeekBounds(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

export interface UseGoogleCalendarResult {
  isConnected: boolean;
  isLoading: boolean;
  calendars: GoogleCalendar[];
  selectedCalendarIds: string[];
  events: ClassEvent[];
  showCalendarPicker: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleCalendar: (id: string) => void;
  confirmSelection: () => Promise<void>;
  openCalendarPicker: () => void;
  closeCalendarPicker: () => void;
}

export function useGoogleCalendar(): UseGoogleCalendarResult {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  // Configure GoogleSignin once on mount
  // WEB_CLIENT_ID: get this from Firebase Console → Project Settings → General
  // → Your apps → Web app → App ID, OR from Google Cloud Console → OAuth 2.0
  // Client IDs → Web client (auto created by Google Service) → Client ID
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID_FROM_FIREBASE', // <-- replace this
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
  }, []);

  // Load persisted token and selected calendars on mount
  useEffect(() => {
    async function loadPersistedState() {
      const [storedToken, storedCalendars] = await Promise.all([
        AsyncStorage.getItem(STORAGE_TOKEN_KEY),
        AsyncStorage.getItem(STORAGE_SELECTED_CALENDARS_KEY),
      ]);

      if (storedToken) {
        setToken(storedToken);
        if (storedCalendars) {
          const ids: string[] = JSON.parse(storedCalendars);
          setSelectedCalendarIds(ids);
        }
      }
    }

    loadPersistedState();
  }, []);

  // Fetch events whenever token or selectedCalendarIds change
  useEffect(() => {
    if (token && selectedCalendarIds.length > 0) {
      refreshEvents(token, selectedCalendarIds);
    } else {
      setEvents([]);
    }
  }, [token, selectedCalendarIds]);

  async function handleTokenReceived(accessToken: string) {
    setIsLoading(true);
    try {
      await AsyncStorage.setItem(STORAGE_TOKEN_KEY, accessToken);
      setToken(accessToken);

      const calendarList = await fetchCalendarList(accessToken);
      setCalendars(calendarList);
      setShowCalendarPicker(true);
    } catch (error) {
      console.error('Failed to fetch calendars:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshEvents(accessToken: string, calendarIds: string[]) {
    setIsLoading(true);
    try {
      const { weekStart, weekEnd } = getWeekBounds();
      const allEvents: ClassEvent[] = [];

      for (const calendarId of calendarIds) {
        const calendar = calendars.find((c) => c.id === calendarId);
        const color =
          calendar?.backgroundColor ??
          CALENDAR_COLORS[calendarIds.indexOf(calendarId) % CALENDAR_COLORS.length];

        const rawEvents = await fetchEventsForWeek(accessToken, calendarId, weekStart, weekEnd);
        rawEvents.forEach((event, index) => {
          const mapped = mapGoogleEventToClassEvent(event, color, index);
          if (mapped) allEvents.push(mapped);
        });
      }

      setEvents(allEvents);
    } catch (error) {
      console.error('Failed to refresh events:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function connect() {
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const { accessToken } = await GoogleSignin.getTokens();
      if (accessToken) {
        await handleTokenReceived(accessToken);
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
    }
  }

  async function disconnect() {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_TOKEN_KEY),
      AsyncStorage.removeItem(STORAGE_SELECTED_CALENDARS_KEY),
    ]);
    setToken(null);
    setCalendars([]);
    setSelectedCalendarIds([]);
    setEvents([]);
    try {
      await auth().signOut();
      await GoogleSignin.signOut();
    } catch {}
  }

  function toggleCalendar(id: string) {
    setSelectedCalendarIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function confirmSelection() {
    await AsyncStorage.setItem(
      STORAGE_SELECTED_CALENDARS_KEY,
      JSON.stringify(selectedCalendarIds)
    );
    setShowCalendarPicker(false);
    if (token) {
      refreshEvents(token, selectedCalendarIds);
    }
  }

  function openCalendarPicker() {
    if (token && calendars.length === 0) {
      setIsLoading(true);
      fetchCalendarList(token)
        .then((list) => {
          setCalendars(list);
          setShowCalendarPicker(true);
        })
        .catch((err) => console.error('Failed to fetch calendars:', err))
        .finally(() => setIsLoading(false));
    } else {
      setShowCalendarPicker(true);
    }
  }

  function closeCalendarPicker() {
    setShowCalendarPicker(false);
  }

  return {
    isConnected: token !== null,
    isLoading,
    calendars,
    selectedCalendarIds,
    events,
    showCalendarPicker,
    connect,
    disconnect,
    toggleCalendar,
    confirmSelection,
    openCalendarPicker,
    closeCalendarPicker,
  };
}
