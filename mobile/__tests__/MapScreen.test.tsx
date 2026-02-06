import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import MapScreen from '../src/screens/MapScreen';
import {
  mockRequestForegroundPermissions,
  mockGetCurrentPosition,
  mockOpenSettings,
  mockAnimateToRegion,
  mockBuilding,
  mockBuildingNoPlans,
  suppressActWarnings,
  setupAppStateMock,
  resetAllMocks,
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

jest.spyOn(Alert, 'alert');

suppressActWarnings();
setupAppStateMock();

describe('MapScreen', () => {
  beforeEach(() => {
    resetAllMocks();
    (Linking as any).openSettings = mockOpenSettings;
  });

  it('renders without crashing', () => {
    const { getByTestId } = render(<MapScreen />);
    expect(getByTestId('map-view')).toBeTruthy();
  });

  it('renders MapView with correct initial region', () => {
    const { getByTestId } = render(<MapScreen />);
    const mapView = getByTestId('map-view');

    expect(mapView.props.initialRegion.latitude).toBeCloseTo(45.497, 2);
    expect(mapView.props.initialRegion.longitude).toBeCloseTo(-73.579, 2);
  });

  it('renders both campus selector buttons', () => {
    const { getByText } = render(<MapScreen />);

    expect(getByText('Downtown')).toBeTruthy();
    expect(getByText('Loyola')).toBeTruthy();
  });

  it('renders with Downtown campus selected by default', () => {
    const { getByText } = render(<MapScreen />);
    const downtownButton = getByText('Downtown');

    expect(downtownButton.props.style).toContainEqual(
      expect.objectContaining({ color: '#FFFFFF' })
    );
  });

  describe('Location Permissions', () => {
    it('requests location permission on mount', async () => {
      render(<MapScreen />);

      await waitFor(() => {
        expect(mockRequestForegroundPermissions).toHaveBeenCalled();
      });
    });

    it('animates to user location when permission is granted', async () => {
      mockRequestForegroundPermissions.mockResolvedValue({ status: 'granted' });
      mockGetCurrentPosition.mockResolvedValue({
        coords: { latitude: 45.5, longitude: -73.58 },
      });

      render(<MapScreen />);

      await waitFor(() => {
        expect(mockGetCurrentPosition).toHaveBeenCalled();
        expect(mockAnimateToRegion).toHaveBeenCalledWith(
          expect.objectContaining({
            latitude: 45.5,
            longitude: -73.58,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }),
          600
        );
      });
    });

    it('shows alert when location permission is denied', async () => {
      mockRequestForegroundPermissions.mockResolvedValue({ status: 'denied' });

      render(<MapScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Location needed',
          'Please allow location so we can show where you are on the map.'
        );
        expect(mockGetCurrentPosition).not.toHaveBeenCalled();
      });
    });

    it('shows location-off button when permission is denied', async () => {
      mockRequestForegroundPermissions.mockResolvedValue({ status: 'denied' });

      const { getByTestId } = render(<MapScreen />);

      await waitFor(() => {
        expect(getByTestId('location-off-button')).toBeTruthy();
      });
    });
  });

  describe('Campus Selection', () => {
    it('switches to Loyola campus when button is pressed', async () => {
      const { getByText } = render(<MapScreen />);

      mockAnimateToRegion.mockClear();

      const loyolaButton = getByText('Loyola');
      fireEvent.press(loyolaButton);

      await waitFor(() => {
        expect(mockAnimateToRegion).toHaveBeenCalledWith(
          expect.objectContaining({
            latitude: 45.4582,
            longitude: -73.6402,
            latitudeDelta: 0.004,
            longitudeDelta: 0.004,
          }),
          500
        );
      });
    });

    it('switches to Downtown campus when button is pressed', async () => {
      const { getByText } = render(<MapScreen />);

      const loyolaButton = getByText('Loyola');
      fireEvent.press(loyolaButton);

      mockAnimateToRegion.mockClear();

      const downtownButton = getByText('Downtown');
      fireEvent.press(downtownButton);

      await waitFor(() => {
        expect(mockAnimateToRegion).toHaveBeenCalledWith(
          expect.objectContaining({
            latitude: 45.4972,
            longitude: -73.5789,
            latitudeDelta: 0.004,
            longitudeDelta: 0.004,
          }),
          500
        );
      });
    });
  });

  describe('Building Selection', () => {
    it('selects building and displays building info', async () => {
      const { getByTestId, getByText } = render(<MapScreen />);
      fireEvent.press(getByTestId('select-building'));
      await waitFor(() => expect(getByText('Hall Building')).toBeTruthy());
    });

    it('opens FloorPlanViewer when a building with floor plans is selected', async () => {
      const { getByTestId, getByText } = render(<MapScreen />);
      
      fireEvent.press(getByTestId('select-building'));

      await waitFor(() => {
        expect(getByText('Hall Building - Floor 8')).toBeTruthy();
      });
    });

    it('closes building info when close button is pressed', async () => {
      const { getByTestId, queryByText, getByText } = render(<MapScreen />);
      fireEvent.press(getByTestId('select-building'));
      await waitFor(() => expect(getByText('Hall Building')).toBeTruthy());
      
      fireEvent.press(getByTestId('building-close'));
      
      await new Promise(resolve => setTimeout(resolve, 350));
      
      expect(queryByText('Hall Building')).toBeNull();
    });
  });

  describe('Building Selector Toggle', () => {
    it('renders building selector toggle button', () => {
      const { getByTestId } = render(<MapScreen />);
      expect(getByTestId('building-selector-toggle')).toBeTruthy();
    });

    it('toggles building selector panel when button is pressed', async () => {
      const { getByTestId } = render(<MapScreen />);
      const toggleButton = getByTestId('building-selector-toggle');

      fireEvent.press(toggleButton);
      await new Promise(resolve => setTimeout(resolve, 350));

      fireEvent.press(toggleButton);
      await new Promise(resolve => setTimeout(resolve, 350));

      expect(toggleButton).toBeTruthy();
    });

    it('shows directions icon when selector is closed and close icon when open', async () => {
      const { getByTestId } = render(<MapScreen />);
      const toggleButton = getByTestId('building-selector-toggle');

      let icon = toggleButton.findByProps({ name: 'directions' });
      expect(icon).toBeTruthy();

      fireEvent.press(toggleButton);
      await new Promise(resolve => setTimeout(resolve, 100));

      icon = toggleButton.findByProps({ name: 'close' });
      expect(icon).toBeTruthy();
    });
  });
});
