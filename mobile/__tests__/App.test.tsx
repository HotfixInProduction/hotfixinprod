import React from 'react';
import { render } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from '../App';
import BuildingInfo from '../src/components/BuildingInfo';
import {
  mockBuilding,
  suppressActWarnings,
  setupAppStateMock,
} from './utils/testUtils';

// Setup mocks
jest.mock('expo-location', () => {
  const {
    mockRequestForegroundPermissions,
    mockGetForegroundPermissions,
    mockGetCurrentPosition,
    mockWatchPositionAsync,
  } = require('./utils/testUtils');
  
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

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const { mockAnimateToRegion } = require('./utils/testUtils');

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

jest.mock('../src/components/BuildingPolygon', () => {
  const { View, TouchableOpacity, Text } = require('react-native');
  const { mockBuilding, mockBuildingNoPlans } = require('./utils/testUtils');
  
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

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: (props: any) => <View {...props} />,
    SafeAreaProvider: (props: any) => <View {...props} />,
  };
});

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

jest.spyOn(Alert, 'alert');

suppressActWarnings();
setupAppStateMock();

describe('App', () => {
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

