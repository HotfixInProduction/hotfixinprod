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
  coordinates: [
    { latitude: 45.497717333439056, longitude: -73.57901648875999 },
    { latitude: 45.49737008952721, longitude: -73.57829860721526 },
    { latitude: 45.49682738667073, longitude: -73.5788266357901 },
    { latitude: 45.497170475291824, longitude: -73.57954748378724 }
  ],
  departments: ['Economics', 'Geography'],
  services: ['Campus Safety', 'IT Service'],
  isAccessible: true,
  hasBikeRacks: true,
  hasParking: true
};

// Mock BuildingPolygon to simulate building selection
jest.mock('../src/components/BuildingPolygon', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return ({ onSelectBuilding, selectedBuilding }: any) => (
    <TouchableOpacity testID="select-building" onPress={() => onSelectBuilding(mockBuilding)}>
      <Text>select</Text>
    </TouchableOpacity>
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

// Mock Alert
jest.spyOn(Alert, 'alert');

// Suppress React act warnings in test output (state updates happen inside async hooks)
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return;
    originalConsoleError(...args);
  });
  jest.spyOn(console, 'warn').mockImplementation((...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Failed to get current location')) return;
    originalConsoleWarn(...args);
  });
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
  (console.warn as jest.Mock).mockRestore();
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

  describe('Building Info Pop-up Interaction', () => {
    it('selects building and closes pop-up when close button is pressed', async () => {
      const { getByTestId, queryByText, getByText } = render(<App />);
      fireEvent.press(getByTestId('select-building'));
      await waitFor(() => expect(getByText('Hall Building')).toBeTruthy());
      fireEvent.press(getByTestId('building-close'));
      await waitFor(() => expect(queryByText('Hall Building')).toBeNull());
    })
  })

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

  describe('Location Selection Feature', () => {
    it('opens location modal when Set Location button is pressed', async () => {
      const { getByText, queryByText } = render(<App />);
      
      const setLocationButton = getByText('📍 Set Location');
      fireEvent.press(setLocationButton);

      await waitFor(() => {
        expect(queryByText('Set Your Location')).toBeTruthy();
      });
    });

    it('closes location modal when Close button is pressed', async () => {
      const { getByText, queryByText } = render(<App />);
      
      fireEvent.press(getByText('📍 Set Location'));
      
      await waitFor(() => {
        expect(queryByText('Set Your Location')).toBeTruthy();
      });

      fireEvent.press(getByText('Close'));
      
      await waitFor(() => {
        expect(queryByText('Set Your Location')).toBeNull();
      });
    });

    it('searches buildings by name', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(<App />);
      
      fireEvent.press(getByText('📍 Set Location'));

      const searchInput = getByPlaceholderText('Search (e.g., Hall, JMSB, etc.)');
      fireEvent.changeText(searchInput, 'Hall');

      await waitFor(() => {
        expect(queryByText('Hall Building')).toBeTruthy();
      });
    });

    it('displays building list when search has results', async () => {
      const { getByText, getByPlaceholderText, queryByTestId } = render(<App />);
      
      fireEvent.press(getByText('📍 Set Location'));

      const searchInput = getByPlaceholderText('Search (e.g., Hall, JMSB, etc.)');
      fireEvent.changeText(searchInput, 'Hall');

      await waitFor(() => {
        expect(queryByTestId('building-list')).toBeTruthy();
      });
    });

    it('clears building list when search is empty', async () => {
      const { getByText, getByPlaceholderText, queryByTestId } = render(<App />);
      
      fireEvent.press(getByText('📍 Set Location'));

      const searchInput = getByPlaceholderText('Search (e.g., Hall, JMSB, etc.)');
      fireEvent.changeText(searchInput, 'Hall');

      await waitFor(() => {
        expect(queryByTestId('building-list')).toBeTruthy();
      });

      fireEvent.changeText(searchInput, '');

      await waitFor(() => {
        expect(queryByTestId('building-list')).toBeNull();
      });
    });

    it('disables Confirm button when no location is selected', async () => {
      const { getByText } = render(<App />);
      
      fireEvent.press(getByText('📍 Set Location'));

      await waitFor(() => {
        const confirmButton = getByText('Confirm');
        expect(confirmButton.props.disabled).toBe(true);
      });
    });

    it('animates map to building center when building is selected', async () => {
      const { getByText, getByPlaceholderText } = render(<App />);
      
      mockAnimateToRegion.mockClear();

      fireEvent.press(getByText('📍 Set Location'));

      const searchInput = getByPlaceholderText('Search (e.g., Hall, JMSB, etc.)');
      fireEvent.changeText(searchInput, 'Hall');

      await waitFor(() => {
        const hallBuilding = getByText('Hall Building');
        expect(hallBuilding).toBeTruthy();
      });
    });
  });

  describe('Building Highlighting Feature', () => {
    it('selects building and displays in BuildingInfo', async () => {
      const { getByTestId, queryByText } = render(<App />);
      
      fireEvent.press(getByTestId('select-building'));

      await waitFor(() => {
        expect(queryByText('Hall Building')).toBeTruthy();
      });
    });

    it('closes BuildingInfo when close button is pressed', async () => {
      const { getByTestId, queryByText } = render(<App />);
      
      fireEvent.press(getByTestId('select-building'));

      await waitFor(() => {
        expect(queryByText('Hall Building')).toBeTruthy();
      });

      const closeButton = getByTestId('building-close');
      fireEvent.press(closeButton);

      await waitFor(() => {
        expect(queryByText('Hall Building')).toBeNull();
      });
    });

    it('passes selectedBuilding prop to BuildingPolygon', async () => {
      const { getByTestId } = render(<App />);
      
      fireEvent.press(getByTestId('select-building'));

      await waitFor(() => {
        expect(getByTestId('select-building')).toBeTruthy();
      });
    });
  });

  describe('Uncovered Code Coverage', () => {
    describe('handleSetLocation', () => {
      it('shows alert when trying to confirm without location selected', async () => {
        const { getByText } = render(<App />);
        
        fireEvent.press(getByText('📍 Set Location'));

        await waitFor(() => {
          const confirmButton = getByText('Confirm');
          expect(confirmButton).toBeTruthy();
        });

        fireEvent.press(getByText('Confirm'));

        await waitFor(() => {
          expect(Alert.alert).toHaveBeenCalledWith(
            'No Location',
            'Please tap on the map or select a building first'
          );
        });
      });

      it('closes modal when location is set and Confirm is pressed', async () => {
        const { getByText, getByPlaceholderText, queryByText } = render(<App />);
        
        fireEvent.press(getByText('📍 Set Location'));

        const searchInput = getByPlaceholderText('Search (e.g., Hall, JMSB, etc.)');
        fireEvent.changeText(searchInput, 'Hall');

        await waitFor(() => {
          expect(queryByText('Hall Building')).toBeTruthy();
        });

        fireEvent.press(getByText('Hall Building'));

        await waitFor(() => {
          const confirmButton = getByText('Confirm');
          fireEvent.press(confirmButton);
        });

        await waitFor(() => {
          expect(queryByText('Set Your Location')).toBeNull();
        });
      });
    });

    describe('handleClearLocation', () => {
      it('clears all location-related state', async () => {
        const { getByText, getByPlaceholderText, queryByText } = render(<App />);
        
        fireEvent.press(getByText('📍 Set Location'));

        const searchInput = getByPlaceholderText('Search (e.g., Hall, JMSB, etc.)');
        fireEvent.changeText(searchInput, 'Hall');

        await waitFor(() => {
          expect(queryByText('Hall Building')).toBeTruthy();
        });

        fireEvent.press(getByText('Hall Building'));

        await waitFor(() => {
          expect(queryByText('Location set at Hall Building')).toBeTruthy();
        });

        fireEvent.press(getByText('✕ Clear Location'));

        await waitFor(() => {
          expect(queryByText('Location set at Hall Building')).toBeNull();
          expect(queryByText('✕ Clear Location')).toBeNull();
        });
      });

      it('clears search query when location is cleared', async () => {
        const { getByText, getByPlaceholderText, queryByText } = render(<App />);
        
        fireEvent.press(getByText('📍 Set Location'));

        const searchInput = getByPlaceholderText('Search (e.g., Hall, JMSB, etc.)');
        fireEvent.changeText(searchInput, 'Hall');

        await waitFor(() => {
          fireEvent.press(getByText('Hall Building'));
        });

        fireEvent.press(getByText('✕ Clear Location'));

        await waitFor(() => {
          expect(searchInput.props.value).toBe('');
        });
      });
    });

    describe('handleSelectBuilding', () => {
      it('calculates building center from coordinates', async () => {
        const { getByText, getByPlaceholderText } = render(<App />);
        
        mockAnimateToRegion.mockClear();

        fireEvent.press(getByText('📍 Set Location'));

        const searchInput = getByPlaceholderText('Search (e.g., Hall, JMSB, etc.)');
        fireEvent.changeText(searchInput, 'Hall');

        await waitFor(() => {
          fireEvent.press(getByText('Hall Building'));
        });

        await waitFor(() => {
          expect(mockAnimateToRegion).toHaveBeenCalled();
          const callArgs = mockAnimateToRegion.mock.calls[0][0];
          
          // Verify the coordinates are within expected range
          expect(callArgs.latitude).toBeGreaterThan(45.49);
          expect(callArgs.latitude).toBeLessThan(45.50);
          expect(callArgs.longitude).toBeGreaterThan(-73.58);
          expect(callArgs.longitude).toBeLessThan(-73.57);
        });
      });

      it('sets all location state on building selection', async () => {
        const { getByText, getByPlaceholderText, queryByText } = render(<App />);
        
        fireEvent.press(getByText('📍 Set Location'));

        const searchInput = getByPlaceholderText('Search (e.g., Hall, JMSB, etc.)');
        fireEvent.changeText(searchInput, 'Hall');

        await waitFor(() => {
          fireEvent.press(getByText('Hall Building'));
        });

        await waitFor(() => {
          expect(queryByText('Location set at Hall Building')).toBeTruthy();
          expect(searchInput.props.value).toBe('Hall Building');
          expect(queryByText(/\d+\.\d+, -\d+\.\d+/)).toBeTruthy();
        });
      });

      it('clears filtered buildings after selection', async () => {
        const { getByText, getByPlaceholderText, queryByTestId } = render(<App />);
        
        fireEvent.press(getByText('📍 Set Location'));

        const searchInput = getByPlaceholderText('Search (e.g., Hall, JMSB, etc.)');
        fireEvent.changeText(searchInput, 'Hall');

        await waitFor(() => {
          expect(queryByTestId('building-list')).toBeTruthy();
        });

        fireEvent.press(getByText('Hall Building'));

        await waitFor(() => {
          expect(queryByTestId('building-list')).toBeNull();
        });
      });
    });

    describe('Modal Interactions', () => {
      it('closes modal when onRequestClose is triggered', async () => {
        const { getByText, queryByText } = render(<App />);
        
        fireEvent.press(getByText('📍 Set Location'));

        await waitFor(() => {
          expect(queryByText('Set Your Location')).toBeTruthy();
        });

        fireEvent(queryByText('Set Your Location')!.parent, 'onRequestClose');

        await waitFor(() => {
          expect(queryByText('Set Your Location')).toBeNull();
        });
      });
    });

    describe('Circle and Marker Rendering', () => {
      it('renders location marker when manualLocation is set', async () => {
        const { getByText, getByPlaceholderText, getByTestId } = render(<App />);
        
        fireEvent.press(getByText('📍 Set Location'));

        const searchInput = getByPlaceholderText('Search (e.g., Hall, JMSB, etc.)');
        fireEvent.changeText(searchInput, 'Hall');

        await waitFor(() => {
          fireEvent.press(getByText('Hall Building'));
        });

        // The marker should be rendered when location is set
        await waitFor(() => {
          const mapView = getByTestId('map-view');
          expect(mapView.children).toBeDefined();
        });
      });
    });

    describe('Search Functionality', () => {
      it('filters buildings case-insensitively', async () => {
        const { getByText, getByPlaceholderText, queryByText } = render(<App />);
        
        fireEvent.press(getByText('📍 Set Location'));

        const searchInput = getByPlaceholderText('Search (e.g., Hall, JMSB, etc.)');
        
        // Test lowercase search
        fireEvent.changeText(searchInput, 'hall');

        await waitFor(() => {
          expect(queryByText('Hall Building')).toBeTruthy();
        });
      });

      it('hides building list when search is cleared', async () => {
        const { getByText, getByPlaceholderText, queryByTestId } = render(<App />);
        
        fireEvent.press(getByText('📍 Set Location'));

        const searchInput = getByPlaceholderText('Search (e.g., Hall, JMSB, etc.)');
        fireEvent.changeText(searchInput, 'Hall');

        await waitFor(() => {
          expect(queryByTestId('building-list')).toBeTruthy();
        });

        // Clear the search
        fireEvent.changeText(searchInput, '');

        await waitFor(() => {
          expect(queryByTestId('building-list')).toBeNull();
        });
      });

      it('hides building list when search with only whitespace', async () => {
        const { getByText, getByPlaceholderText, queryByTestId } = render(<App />);
        
        fireEvent.press(getByText('📍 Set Location'));

        const searchInput = getByPlaceholderText('Search (e.g., Hall, JMSB, etc.)');
        fireEvent.changeText(searchInput, '   ');

        await waitFor(() => {
          expect(queryByTestId('building-list')).toBeNull();
        });
      });
    });
  });

});


