
import { GoogleAuthToken, GoogleUser } from '../src/types/calendar';
import * as CalendarStorage from '../src/models/CalendarStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const token: GoogleAuthToken = { accessToken: 'abc', expiresAt: Date.now() + 10000, tokenType: 'Bearer' };
const user: GoogleUser = { name: 'Test', email: 'test@mail.com', picture: 'pic' };

describe('CalendarStorage', () => {
  it('isTokenExpired returns true if expired', () => {
    expect(CalendarStorage.isTokenExpired({ ...token, expiresAt: Date.now() - 1 })).toBe(true);
  });
  it('isTokenExpired returns false if not expired', () => {
    expect(CalendarStorage.isTokenExpired(token)).toBe(false);
  });

  it('loadTokenFromStorage returns token', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(token));
    const result = await CalendarStorage.loadTokenFromStorage();
    expect(result).toEqual(token);
  });
  it('loadTokenFromStorage returns null on error', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const result = await CalendarStorage.loadTokenFromStorage();
    expect(result).toBeNull();
  });

  it('saveTokenToStorage calls setItem', async () => {
    await CalendarStorage.saveTokenToStorage(token);
    expect((AsyncStorage.setItem as jest.Mock)).toHaveBeenCalled();
  });

  it('clearTokenFromStorage calls removeItem', async () => {
    await CalendarStorage.clearTokenFromStorage();
    expect((AsyncStorage.removeItem as jest.Mock)).toHaveBeenCalled();
  });

  it('loadUserFromStorage returns user', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(user));
    const result = await CalendarStorage.loadUserFromStorage();
    expect(result).toEqual(user);
  });
  it('loadUserFromStorage returns null on error', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const result = await CalendarStorage.loadUserFromStorage();
    expect(result).toBeNull();
  });

  it('saveUserToStorage calls setItem', async () => {
    await CalendarStorage.saveUserToStorage(user);
    expect((AsyncStorage.setItem as jest.Mock)).toHaveBeenCalled();
  });

  it('clearUserFromStorage calls removeItem', async () => {
    await CalendarStorage.clearUserFromStorage();
    expect((AsyncStorage.removeItem as jest.Mock)).toHaveBeenCalled();
  });
});
