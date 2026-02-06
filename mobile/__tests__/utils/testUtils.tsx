import { AppState } from 'react-native';

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

// Mock modules setup functions
export const setupLocationMocks = () => {
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
};

export const setupMapMocks = () => {
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
};

export const setupSafeAreaMocks = () => {
  jest.mock('react-native-safe-area-context', () => {
    const { View } = require('react-native');
    return {
      SafeAreaView: (props: any) => <View {...props} />,
      SafeAreaProvider: (props: any) => <View {...props} />,
    };
  });
};

export const setupVectorIconsMocks = () => {
  jest.mock('@expo/vector-icons', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
      MaterialIcons: (props: any) => <Text {...props}>{props.name}</Text>,
    };
  }, { virtual: true });
};

export const setupBuildingPolygonMock = () => {
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
  jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({
    remove: defaultAppStateRemove,
  }) as any);
  return defaultAppStateRemove;
};

// Test data reset helper
export const resetAllMocks = () => {
  jest.clearAllMocks();
  mockRequestForegroundPermissions.mockResolvedValue({ status: 'granted' });
  mockGetCurrentPosition.mockResolvedValue({
    coords: { latitude: 45.5, longitude: -73.58 },
  });
  mockOpenSettings.mockClear();
};
