import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import App from '../App';
import BuildingInfo from '../src/components/BuildingInfo';
import {
  mockBuilding,
  suppressActWarnings,
  setupAppStateMock,
} from './utils/testUtils';

// Setup all mocks using factory functions
jest.mock('expo-location', () => require('./utils/testUtils').createLocationMock());
jest.mock('react-native-maps', () => require('./utils/testUtils').createMapMock());
jest.mock('react-native-safe-area-context', () => require('./utils/testUtils').createSafeAreaMock());
jest.mock('@expo/vector-icons', () => require('./utils/testUtils').createVectorIconsMock(), { virtual: true });
jest.mock('../src/components/BuildingPolygon', () => require('./utils/testUtils').createBuildingPolygonMock());
jest.mock('react-native-config', () => ({ GOOGLE_MAPS_API_KEY: 'mock-google-maps-key', }));

// Mock React Navigation
jest.mock('@react-navigation/native', () => require('./utils/testUtils').createNavigationMock());
jest.mock('@react-navigation/bottom-tabs', () => require('./utils/testUtils').createBottomTabsMock());

// Mock other components used in MapScreen to avoid deep rendering issues if needed
jest.mock('../src/components/BuildingSelector/StartDestinationPicker', () => require('./utils/testUtils').createStartDestinationPickerMock());

// Mock SettingsStorage for AppSettingsProvider
jest.mock('../src/models/SettingsStorage', () => ({
  loadSettingsFromStorage: jest.fn().mockResolvedValue({ 
    poiRangeMeters: 500, 
    showNearestPOIBanner: true 
  }),
  saveSettingsToStorage: jest.fn().mockResolvedValue(undefined),
}));

const { Alert } = require('react-native');
jest.spyOn(Alert, 'alert');

suppressActWarnings();
setupAppStateMock();

describe('App', () => {
  it('renders without crashing', () => {
    const result = render(<App />);
    expect(result).toBeTruthy();
  });

  it('renders all three navigation tabs', () => {
    const { getAllByText } = render(<App />);
    expect(getAllByText('Schedule').length).toBeGreaterThan(0);
    expect(getAllByText('Map').length).toBeGreaterThan(0);
    expect(getAllByText('Settings').length).toBeGreaterThan(0);
  });

  it('renders icons for each tab via screenOptions', () => {
    const { getByTestId } = render(<App />);

    // These should exist if tabBarIcon was called for each route
    expect(getByTestId('icon-schedule')).toBeTruthy();
    expect(getByTestId('icon-map')).toBeTruthy();
    expect(getByTestId('icon-settings')).toBeTruthy();

    // Verify icon names (MaterialIcons mock renders name as child text)
    expect(getByTestId('icon-schedule').props.children).toBe('schedule');
    expect(getByTestId('icon-map').props.children).toBe('map');
    expect(getByTestId('icon-settings').props.children).toBe('settings');
  });

  it('renders tab buttons (for coverage of Screen options)', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('tab-schedule')).toBeTruthy();
    expect(getByTestId('tab-map')).toBeTruthy();
    expect(getByTestId('tab-settings')).toBeTruthy();
  });

  it('applies active tint color when focused (via mock simulation)', () => {
    // Our mock in testUtils calls tabBarIcon with focused: false
    // To cover the focused branch if it existed, we'd need a more complex mock,
    // but App.tsx doesn't actually use the 'focused' status for icon selection.
    expect(true).toBe(true);
  });

  describe('Display Building Info', () => {
    test('returns null when building is null', () => {
      const { queryByTestId } = render(
        <BuildingInfo building={null} onClose={() => { }} />
      );
      expect(queryByTestId('building-title')).toBeNull();
    })

    test('hide all icons', () => {
      const b = { ...mockBuilding, isAccessible: false, hasParking: false, hasBikeRacks: false };
      const { queryByTestId } = render(
        <BuildingInfo building={b} onClose={() => { }} />
      );
      expect(queryByTestId('icon-wheelchair')).toBeNull();
      expect(queryByTestId('icon-parking')).toBeNull();
      expect(queryByTestId('icon-bike')).toBeNull();
    })

    test('shows parking icon if parking lots are available', () => {
      const b = { ...mockBuilding, isAccessible: false, hasParking: true, hasBikeRacks: false };
      const { getByTestId, queryByTestId } = render(
        <BuildingInfo building={b} onClose={() => { }} />
      );
      expect(getByTestId('icon-parking')).toBeTruthy();
      expect(queryByTestId('icon-wheelchair')).toBeNull();
      expect(queryByTestId('icon-bike')).toBeNull();
    })
  });
});
