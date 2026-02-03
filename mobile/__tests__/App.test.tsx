import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Linking, AppState } from 'react-native';
import App from '../App';

// Create mocks before jest.mock
const mockRequestForegroundPermissions = jest.fn().mockResolvedValue({ status: 'granted' });
const mockGetCurrentPosition = jest.fn().mockResolvedValue({
  coords: { latitude: 45.5, longitude: -73.58 },
});
const mockGetForegroundPermissions = jest.fn().mockResolvedValue({ status: 'granted' });
const mockOpenSettings = jest.fn();

// Mock Expo Location to avoid hitting native APIs during tests
jest.mock('expo-location', () => {
  return {
    requestForegroundPermissionsAsync: (...args: any[]) => mockRequestForegroundPermissions(...args),
    getCurrentPositionAsync: (...args: any[]) => mockGetCurrentPosition(...args),
    getForegroundPermissionsAsync: (...args: any[]) => mockGetForegroundPermissions(...args),
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
    const { getByTestId } = render(<App />);
    expect(getByTestId('map-view')).toBeTruthy();
  });

  it('renders MapView with correct initial region', () => {
    const { getByTestId } = render(<App />);
    const mapView = getByTestId('map-view');
    
    expect(mapView.props.initialRegion.latitude).toBeCloseTo(45.497, 2);
    expect(mapView.props.initialRegion.longitude).toBeCloseTo(-73.579, 2);
  });

  it('renders both campus selector buttons', () => {
    const { getByText } = render(<App />);
    
    expect(getByText('Downtown')).toBeTruthy();
    expect(getByText('Loyola')).toBeTruthy();
  });

  it('renders with Downtown campus selected by default', () => {
    const { getByText } = render(<App />);
    const downtownButton = getByText('Downtown');
    
    expect(downtownButton.props.style).toContainEqual(
      expect.objectContaining({ color: '#FFFFFF' })
    );
  });

  describe('Location Permissions', () => {
    it('requests location permission on mount', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(mockRequestForegroundPermissions).toHaveBeenCalled();
      });
    });

    it('animates to user location when permission is granted', async () => {
      mockRequestForegroundPermissions.mockResolvedValue({ status: 'granted' });
      mockGetCurrentPosition.mockResolvedValue({
        coords: { latitude: 45.5, longitude: -73.58 },
      });

      render(<App />);

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

      render(<App />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Location needed',
          'Please allow location so we can show where you are on the map.'
        );
        expect(mockGetCurrentPosition).not.toHaveBeenCalled();
      });
    });

    it('does not call getCurrentPosition when permission is not granted', async () => {
      mockRequestForegroundPermissions.mockResolvedValue({ status: 'denied' });

      render(<App />);

      await waitFor(() => {
        expect(mockRequestForegroundPermissions).toHaveBeenCalled();
      });

      expect(mockGetCurrentPosition).not.toHaveBeenCalled();
    });

    it('shows location-off button when permission is denied', async () => {
      mockRequestForegroundPermissions.mockResolvedValue({ status: 'denied' });

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('location-off-button')).toBeTruthy();
      });
    });

  it('opens modal and can re-request permission', async () => {
    mockRequestForegroundPermissions.mockResolvedValueOnce({ status: 'denied' });
    const { getByTestId, queryByText } = render(<App />);

      await waitFor(() => {
        expect(getByTestId('location-off-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('location-off-button'));
      expect(queryByText('Location is off')).toBeTruthy();

      mockRequestForegroundPermissions.mockResolvedValueOnce({ status: 'granted' });
      fireEvent.press(getByTestId('request-permission-button'));

      await waitFor(() => {
        expect(mockRequestForegroundPermissions).toHaveBeenCalledTimes(2);
        expect(mockGetCurrentPosition).toHaveBeenCalled();
      });
    });

  it('opens device settings from modal', async () => {
    mockRequestForegroundPermissions.mockResolvedValue({ status: 'denied' });
    const { getByTestId, queryByText } = render(<App />);

      await waitFor(() => getByTestId('location-off-button'));

      fireEvent.press(getByTestId('location-off-button'));
      fireEvent.press(getByTestId('open-settings-button'));

    expect(mockOpenSettings).toHaveBeenCalled();
    expect(queryByText('Location is off')).toBeNull();
  });

    it('closes modal when tapping Not now', async () => {
      mockRequestForegroundPermissions.mockResolvedValue({ status: 'denied' });
      const { getByTestId, queryByText, getByText } = render(<App />);

      await waitFor(() => getByTestId('location-off-button'));
      fireEvent.press(getByTestId('location-off-button'));
      fireEvent.press(getByText('Not now'));

      expect(queryByText('Location is off')).toBeNull();
    });

    it('closes modal when onRequestClose is triggered', async () => {
      mockRequestForegroundPermissions.mockResolvedValue({ status: 'denied' });
      const { getByTestId, queryByText } = render(<App />);

      await waitFor(() => getByTestId('location-off-button'));
      fireEvent.press(getByTestId('location-off-button'));

      fireEvent(getByTestId('location-modal'), 'onRequestClose');

      expect(queryByText('Location is off')).toBeNull();
    });

    it('hides location-off icon after returning to foreground with permission granted', async () => {
      mockRequestForegroundPermissions.mockResolvedValue({ status: 'denied' });
      mockGetForegroundPermissions.mockResolvedValue({ status: 'granted' });
      (AppState as any).currentState = 'background';

      let appStateCallback: ((state: string) => void) | undefined;
      const removeListener = jest.fn();
      (AppState.addEventListener as jest.Mock).mockImplementationOnce((_, cb: any) => {
        appStateCallback = cb;
        return { remove: removeListener } as any;
      });

      const { getByTestId, queryByTestId } = render(<App />);

      await waitFor(() => getByTestId('location-off-button'));
      fireEvent.press(getByTestId('location-off-button'));

      await act(async () => {
        appStateCallback?.('active');
      });

      await waitFor(() => expect(mockGetForegroundPermissions).toHaveBeenCalled());
      await waitFor(() => expect(queryByTestId('location-off-button')).toBeNull());

    });

    it.each([
      ['timeout error', 'Location request timed out'],
      ['generic error', 'Failed to get location'],
      ['location services disabled after permission granted', 'Location services are disabled'],
      ['network error', 'Network error'],
    ])('handles getCurrentPositionAsync %s gracefully', async (scenario, errorMessage) => {
      mockRequestForegroundPermissions.mockResolvedValue({ status: 'granted' });
      mockGetCurrentPosition.mockRejectedValue(new Error(errorMessage));

      const { getByTestId } = render(<App />);

      await waitFor(() => {
        expect(mockGetCurrentPosition).toHaveBeenCalled();
      });

      // App should still render without crashing
      expect(getByTestId('map-view')).toBeTruthy();
      // animateToRegion should not be called when location fails
      expect(mockAnimateToRegion).not.toHaveBeenCalled();
    });
  });

  describe('Campus Selection', () => {
    it('switches to Loyola campus when button is pressed', async () => {
      const { getByText } = render(<App />);
      
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
      const { getByText } = render(<App />);
      
      // First switch to Loyola
      const loyolaButton = getByText('Loyola');
      fireEvent.press(loyolaButton);

      mockAnimateToRegion.mockClear();
      
      // Then switch back to Downtown
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

    it('updates selected campus state when switching campuses', () => {
      const { getByText } = render(<App />);
      
      const loyolaButton = getByText('Loyola');
      fireEvent.press(loyolaButton);

      // Check if Loyola now has active styling
      expect(loyolaButton.props.style).toContainEqual(
        expect.objectContaining({ color: '#FFFFFF' })
      );
    });
  });

  describe('MapView Configuration', () => {
    it('enables user location display', () => {
      const { getByTestId } = render(<App />);
      const mapView = getByTestId('map-view');
      
      expect(mapView.props.showsUserLocation).toBe(true);
    });

    it('enables my location button', () => {
      const { getByTestId } = render(<App />);
      const mapView = getByTestId('map-view');
      
      expect(mapView.props.showsMyLocationButton).toBe(true);
    });

    it('sets correct map padding', () => {
      const { getByTestId } = render(<App />);
      const mapView = getByTestId('map-view');
      
      expect(mapView.props.mapPadding).toEqual({
        top: 100,
        right: 20,
        bottom: 0,
        left: 20,
      });
    });
  });
});
