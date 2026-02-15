import { AppState } from 'react-native';
import React from 'react';

// Create mock functions
export const mockRequestForegroundPermissions = jest.fn().mockResolvedValue({ status: 'granted' });
export const mockGetForegroundPermissions = jest.fn().mockResolvedValue({ status: 'granted' });
export const mockGetCurrentPosition = jest.fn().mockResolvedValue({
  coords: { latitude: 45.5, longitude: -73.58 },
});
export const mockWatchPositionAsync = jest.fn().mockResolvedValue({
  remove: jest.fn(),
});
export const mockOpenSettings = jest.fn();
export const mockAnimateToRegion = jest.fn();
export const mockFitToCoordinates = jest.fn();

// Mock data
export const mockBuilding = {
  id: 'Hall Building',
  address: '1455 De Maisonneuve Blvd. W.',
  floorPlans: {
    '8': '<svg>Mock SVG</svg>'
  }
};

export const mockBuildingNoPlans = {
  id: 'Library Building',
  address: '1400 De Maisonneuve Blvd. W.'
};

// Mock factory functions - these create the actual mock implementations
export const createLocationMock = () => ({
  requestForegroundPermissionsAsync: (...args: any[]) => mockRequestForegroundPermissions(...args),
  getForegroundPermissionsAsync: (...args: any[]) => mockGetForegroundPermissions(...args),
  getCurrentPositionAsync: (...args: any[]) => mockGetCurrentPosition(...args),
  watchPositionAsync: (...args: any[]) => mockWatchPositionAsync(...args),
  Accuracy: {
    High: 4,
  },
});

export const createMapMock = () => {
  const { View } = require('react-native');

  const MockMapView = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      animateToRegion: mockAnimateToRegion,
      fitToCoordinates: mockFitToCoordinates,
    }));
    return <View testID="map-view" {...props}>{props.children}</View>;
  });

  const MockPolygon = (props: any) => <View {...props} />;

  const MockMarker = (props: any) => <View {...props} />;

  return {
    __esModule: true,
    default: MockMapView,
    Polygon: MockPolygon,
    Marker: MockMarker,
  };
};

export const createSafeAreaMock = () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: (props: any) => <View {...props} />,
    SafeAreaProvider: (props: any) => <View {...props} />,
  };
};

export const createVectorIconsMock = () => {
  const { Text } = require('react-native');
  return {
    MaterialIcons: (props: any) => <Text {...props}>{props.name}</Text>,
  };
};

export const createBuildingPolygonMock = () => {
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
};

export const createStartDestinationPickerMock = () => {
  const { View, TouchableOpacity, Text } = require('react-native');

  const mockStart = {
    id: 'start-place',
    location: { lat: 45.4972, lng: -73.5789 },
  };

  const mockDestination = {
    id: 'destination-place',
    location: { lat: 45.4582, lng: -73.6402 },
  };

  return ({ setStart, setDestination }: any) => (
    <View testID="start-destination-picker-mock">
      <TouchableOpacity testID="set-start" onPress={() => setStart(mockStart)}>
        <Text>Set Start</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="set-destination" onPress={() => setDestination(mockDestination)}>
        <Text>Set Destination</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="clear-start" onPress={() => setStart(null)}>
        <Text>Clear Start</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="clear-destination" onPress={() => setDestination(null)}>
        <Text>Clear Destination</Text>
      </TouchableOpacity>
    </View>
  );
};

export const createMapDirectionsMock = () => {
  const { View, TouchableOpacity } = require('react-native');
  return (props: any) => (
    <View testID="map-directions">
      <TouchableOpacity 
        testID="trigger-directions-ready" 
        onPress={() => props.onReady({
          distance: 12.5,
          duration: 25,
          coordinates: []
        })} 
      />
    </View>
  );
};

export const createNavigationMock = () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }: any) => (
      React.createElement('View', { testID: 'navigation-container' }, children)
    ),
  };
};

export const createBottomTabsMock = () => {
  const Tab = {
    Navigator: ({ children, screenOptions }: any) => {
      // Render the navigator with test ID
      return React.createElement(
        'View',
        { testID: 'tab-navigator' },
        // Call screenOptions for each route to test icon rendering
        React.Children.map(children, (child: any) => {
          if (child?.props?.name) {
            const routeName = child.props.name;
            const options = typeof screenOptions === 'function'
              ? screenOptions({ route: { name: routeName } })
              : screenOptions;

            // Render the tab icon
            if (options?.tabBarIcon) {
              const icon = options.tabBarIcon({ focused: false, color: '#666', size: 24 });
              // Clone the icon to add testID based on route name
              const iconWithTestId = React.cloneElement(icon, {
                testID: `icon-${routeName.toLowerCase()}`,
              });

              return React.createElement(
                'View',
                { key: routeName },
                iconWithTestId,
                React.createElement('Text', {}, routeName),
                child.props.component ? React.createElement(child.props.component) : null
              );
            }
          }
          return child;
        })
      );
    },
    Screen: ({ name, component }: any) =>
      React.createElement('View', { testID: `screen-${name}` }, null),
  };

  return {
    createBottomTabNavigator: () => Tab,
  };
};

// Test setup utilities
export const suppressActWarnings = () => {
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
};

export const setupAppStateMock = () => {
  const defaultAppStateRemove = jest.fn();
  // Mock currentState as a string
  (AppState as any).currentState = 'active';
  jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({
    remove: defaultAppStateRemove,
  }) as any);
  return defaultAppStateRemove;
};

export const createRouteInfoMock = () => {
  const { View, TouchableOpacity, Text } = require('react-native');
  return ({ onClose, duration, distance }: any) => (
    <View testID="route-info-mock">
      <Text>Arrive at Destination</Text>
      <Text>{duration}</Text>
      <Text>{distance}</Text>
      <TouchableOpacity
        testID="route-info-close-button"
        onPress={onClose}
      >
        <Text>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

export const createBuildingSelectorMock = () => {
  const { View } = require('react-native');
  return jest.fn((props) => {
    return React.createElement(View, {
      testID: `building-selector-${props.placeholder}`,
      onPress: () => props.onSelect({
        name: 'Mock Building',
        address: '123 Mock St',
        location: { lat: 1, lng: 1 }
      })
    });
  });
};

// Test data reset helper
export const resetAllMocks = () => {
  jest.clearAllMocks();
  mockRequestForegroundPermissions.mockResolvedValue({ status: 'granted' });
  mockGetCurrentPosition.mockResolvedValue({
    coords: { latitude: 45.5, longitude: -73.58 },
  });
  mockOpenSettings.mockClear();
  mockAnimateToRegion.mockClear();
  mockFitToCoordinates.mockClear();
};
