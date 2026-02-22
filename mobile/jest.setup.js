import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      androidClientId: 'test-android-client-id',
      iosClientId: 'test-ios-client-id',
    },
  },
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'com.concordia.hotfixinprod:/oauth2redirect'),
}));

jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
}));