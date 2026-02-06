import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Linking, AppState } from 'react-native';
import App from '../App';
import BuildingInfo from '../src/components/BuildingInfo';

// Create mocks before jest.mock
const mockRequestForegroundPermissions = jest.fn().mockResolvedValue({ status: 'granted' });
const mockGetForegroundPermissions = jest.fn().mockResolvedValue({ status: 'granted' });
const mockGetCurrentPosition = jest.fn().mockResolvedValue({
  coords: { latitude: 45.5, longitude: -73.58 },
});
const mockWatchPositionAsync = jest.fn().mockResolvedValue({
  remove: jest.fn(),
});
const mockBuilding = {
  id: 'Hall Building',
  address: '1455 De Maisonneuve Blvd. W.',
  floorPlans: {
    '8': '<svg>Mock SVG</svg>'
  }
};

const mockBuildingNoPlans = {
  id: 'Library Building',
  address: '1400 De Maisonneuve Blvd. W.'
};

// Mock BuildingPolygon to simulate building selection
jest.mock('../src/components/BuildingPolygon', () => {
  const { View, TouchableOpacity, Text } = require('react-native');
  return ({ onSelectBuilding }: any) => (
    <View>
      <TouchableOpacity testID="select-building" onPress={() => onSelectBuilding(mockBuilding)}>
        <Text>Select With Plan</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="select-building-no-plans" onPress={() => onSelectBuilding(mockBuildingNoPlans)}>
        <Text>Select No Plans</Text>
      </TouchableOpacity>
    </View>
    
  );
});
const mockOpenSettings = jest.fn();

// Mock Expo Location to avoid hitting native APIs during tests
jest.mock('expo-location', () => {
  return {
    requestForegroundPermissionsAsync: (...args: any[]) => mockRequestForegroundPermissions(...args),
    getForegroundPermissionsAsync: (...args: any[]) => mockGetForegroundPermissions(...args),
    getCurrentPositionAsync: (...args: any[]) => mockGetCurrentPosition(...args),
    watchPositionAsync: (...args: any[]) => mockWatchPositionAsync(...args),
    Accuracy: {
      High: 4,
    },
  };
});

// Mock react-native-maps
const mockAnimateToRegion = jest.fn();
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockMapView = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      animateToRegion: mockAnimateToRegion,
    }));
    return <View testID="map-view" {...props}>{props.children}</View>;
  });

  const MockPolygon = (props: any) => <View {...props} />;

  return {
    __esModule: true,
    default: MockMapView,
    Polygon: MockPolygon,
  };
});

// Mock safe area context
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: (props: any) => <View {...props} />,
    SafeAreaProvider: (props: any) => <View {...props} />,
  };
});

// Mock vector icons to avoid loading native modules in tests
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialIcons: (props: any) => <Text {...props}>{props.name}</Text>,
  };
}, { virtual: true });

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }: any) => children,
  };
});

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Suppress React act warnings in test output (state updates happen inside async hooks)
const originalConsoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return;
    originalConsoleError(...args);
  });
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

const defaultAppStateRemove = jest.fn();
jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({
  remove: defaultAppStateRemove,
}) as any);

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestForegroundPermissions.mockResolvedValue({ status: 'granted' });
    mockGetCurrentPosition.mockResolvedValue({
      coords: { latitude: 45.5, longitude: -73.58 },
    });
    (Linking as any).openSettings = mockOpenSettings;
    mockOpenSettings.mockClear();
  });

  it('renders without crashing', () => {
    const result = render(<App />);
    expect(result).toBeTruthy();
  });

  describe('Display Building Info', () => {
    test('returns null when building is null', () => {
      const { queryByTestId } = render(
        <BuildingInfo building={null} onClose={() => { }} />
      );
      expect(queryByTestId('building-title')).toBeNull();
    })

    // no icons are displayed if a building does not have an accessible entrance, parking lots, and bike racks
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

    test('shows wheelchair icon if building entrance is accessible', () => {
      const b = { ...mockBuilding, isAccessible: true, hasParking: false, hasBikeRacks: false };
      const { getByTestId, queryByTestId } = render(
        <BuildingInfo building={b} onClose={() => { }} />
      );
      expect(getByTestId('icon-wheelchair')).toBeTruthy();
      expect(queryByTestId('icon-parking')).toBeNull();
      expect(queryByTestId('icon-bike')).toBeNull();
    })

    test('shows bike icon if bike racks are available', () => {
      const b = { ...mockBuilding, isAccessible: false, hasParking: false, hasBikeRacks: true };
      const { getByTestId, queryByTestId } = render(
        <BuildingInfo building={b} onClose={() => { }} />
      );
      expect(getByTestId('icon-bike')).toBeTruthy();
      expect(queryByTestId('icon-wheelchair')).toBeNull();
      expect(queryByTestId('icon-parking')).toBeNull();
    })

    // no columns are displayed if a building has no departments and services associated to it
    test('hides columns when no departments or services', () => {
      const b = { ...mockBuilding, departments: [], services: [] };
      const { queryByTestId, queryByText } = render(
        <BuildingInfo building={b} onClose={() => { }} />
      );
      expect(queryByTestId('departments-column')).toBeNull();
      expect(queryByTestId('services-column')).toBeNull();
      expect(queryByText('Departments')).toBeNull();
      expect(queryByText('Services')).toBeNull();
    })

    // if a building has services but no departments
    test('renders services column only', () => {
      const b = { ...mockBuilding, departments: [], services: ['IT Service'] };
      const { getByTestId, queryByTestId, getByText } = render(
        <BuildingInfo building={b} onClose={() => { }} />
      );
      expect(getByTestId('services-column')).toBeTruthy();
      expect(queryByTestId('departments-column')).toBeNull();
      expect(getByText('IT Service')).toBeTruthy();
    })

    test('renders multiple departments', () => {
      const b = { ...mockBuilding, departments: ['Economics', 'Political Science'] };
      const { getByText } = render(
        <BuildingInfo building={b} onClose={() => { }} />
      );
      expect(getByText('Economics')).toBeTruthy();
      expect(getByText('Political Science')).toBeTruthy();
    })
  })

});

