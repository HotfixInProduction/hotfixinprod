import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleAuthToken, GoogleUser } from '../types/calendar';

const TOKEN_KEY = 'google_calendar_token';
const USER_KEY = 'google_calendar_user';

export function isTokenExpired(token: GoogleAuthToken): boolean {
  return Date.now() >= token.expiresAt;
}

export async function loadTokenFromStorage(): Promise<GoogleAuthToken | null> {
  try {
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as GoogleAuthToken) : null;
  } catch { return null; }
}

export async function saveTokenToStorage(token: GoogleAuthToken): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(token));
}

export async function clearTokenFromStorage(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function loadUserFromStorage(): Promise<GoogleUser | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as GoogleUser) : null;
  } catch { return null; }
}

export async function saveUserToStorage(user: GoogleUser): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearUserFromStorage(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}
