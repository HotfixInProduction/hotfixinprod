import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

import {
  GoogleCalendarState,
  GoogleAuthToken,
  GoogleCalendarEvent,
  GoogleUser,
  ClassEvent,
} from '../types/calendar';
import { GOOGLE_CALENDAR_SCOPES, fetchCalendarEvents, fetchUserProfile } from '../models/CalendarApi';
import {
  loadTokenFromStorage,
  saveTokenToStorage,
  clearTokenFromStorage,
  isTokenExpired,
  saveUserToStorage,
  loadUserFromStorage,
  clearUserFromStorage,
} from '../models/CalendarStorage';

WebBrowser.maybeCompleteAuthSession();

const EVENT_COLORS = ['#4A90E2', '#E94B3C', '#50C878', '#F39C12', '#9B59B6'];

function mapToClassEvent(event: GoogleCalendarEvent, index: number): ClassEvent {
  const startDate = new Date(event.start.dateTime);
  const endDate = new Date(event.end.dateTime);
  const locationParts = (event.location ?? '').split(' ');
  return {
    id: event.id,
    title: event.summary ?? 'No Title',
    location: event.location ?? '',
    building: locationParts[0] ?? '',
    room: locationParts[1] ?? '',
    startTime: startDate,
    endTime: endDate,
    dayOfWeek: startDate.getDay(),
    color: EVENT_COLORS[index % EVENT_COLORS.length],
  };
}

export function useGoogleCalendar() {
  const [state, setState] = useState<GoogleCalendarState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    token: null,
    user: null,
    events: [],
  });

  const redirectUri = makeRedirectUri({
    native: 'com.concordia.hotfixinprod:/oauth2redirect',
  });

  const googleConfig = {
    androidClientId: Constants.expoConfig?.extra?.androidClientId,
    iosClientId: Constants.expoConfig?.extra?.iosClientId,
    redirectUri,
    scopes: GOOGLE_CALENDAR_SCOPES,
  };

  const [, response, promptAsync] = (googleConfig.androidClientId && googleConfig.iosClientId)
    ? Google.useAuthRequest(googleConfig)
    : [null, null, async () => { console.warn('Google Auth Client IDs are not configured.'); }];

  useEffect(() => {
    (async () => {
      const stored = await loadTokenFromStorage();
      if (stored && !isTokenExpired(stored)) {
        const savedUser = await loadUserFromStorage();
        await loadEvents(stored, savedUser);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { accessToken, expiresIn } = response.authentication!;
      const token: GoogleAuthToken = {
        accessToken,
        expiresAt: Date.now() + (expiresIn ?? 3600) * 1000,
        tokenType: 'Bearer',
      };
      saveTokenToStorage(token);
      loadEvents(token, null);
    } else if (response?.type === 'error') {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: response.error?.message ?? 'Authentication failed',
      }));
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      setState(prev => ({ ...prev, isLoading: false, error: null }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  async function loadEvents(token: GoogleAuthToken, existingUser: GoogleUser | null) {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const [raw, user] = await Promise.all([
        fetchCalendarEvents(token.accessToken),
        existingUser ? Promise.resolve(existingUser) : fetchUserProfile(token.accessToken),
      ]);
      if (!existingUser) saveUserToStorage(user);
      const events: ClassEvent[] = raw.map(mapToClassEvent);
      setState({ isAuthenticated: true, isLoading: false, error: null, token, user, events });
    } catch (err: unknown) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load events',
      }));
    }
  }

  async function connect() {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    await promptAsync();
  }

  async function disconnect() {
    await Promise.all([clearTokenFromStorage(), clearUserFromStorage()]);
    setState({ isAuthenticated: false, isLoading: false, error: null, token: null, user: null, events: [] });
  }

  return { state, connect, disconnect };
}
