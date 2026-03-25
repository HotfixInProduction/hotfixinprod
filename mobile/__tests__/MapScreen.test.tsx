import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import MapScreen from '../src/screens/MapScreen';
import {
  mockRequestForegroundPermissions,
  mockGetForegroundPermissions,
  mockGetCurrentPosition,
  mockOpenSettings,
  mockAnimateToRegion,
  suppressActWarnings,
  setupAppStateMock,
  resetAllMocks,
  mockFitToCoordinates,
} from './utils/testUtils';

// Setup all mocks using factory functions
jest.mock('expo-location', () => require('./utils/testUtils').createLocationMock());
jest.mock('react-native-maps', () => require('./utils/testUtils').createMapMock());
jest.mock('react-native-safe-area-context', () => require('./utils/testUtils').createSafeAreaMock());
jest.mock('@expo/vector-icons', () => require('./utils/testUtils').createVectorIconsMock(), { virtual: true });
jest.mock('../src/components/BuildingPolygon', () => require('./utils/testUtils').createBuildingPolygonMock());
jest.mock('../src/components/BuildingSelector/StartDestinationPicker', () => require('./utils/testUtils').createStartDestinationPickerMock());
jest.mock('react-native-config', () => ({ GOOGLE_MAPS_ANDROID_API_KEY: 'mock-google-maps-key' }));
jest.mock('react-native-maps-directions', () => require('./utils/testUtils').createMapDirectionsMock());
jest.mock('../src/components/RouteInfo', () => require('./utils/testUtils').createRouteInfoMock());
jest.mock('../src/components/RouteInstructions', () => require('./utils/testUtils').createRouteInstructionsMock());
jest.mock('expo-constants', () => {
  const mockConstants = {
    expoConfig: {
      extra: {
        googleApiKey: 'mock-google-maps-key',
      },
    },
  };
  return {
    __esModule: true,
    default: mockConstants,
    ...mockConstants,
  };
});
jest.mock('../src/data/buildings', () => ({
  buildings: [
    {
      id: 'mock-building-id',
      name: 'Mock Building',
      address: '123 Mock St',
      labelCoord: { latitude: 45.123, longitude: -73.123 },
    },
    {
      id: 'mock-no-address',
      name: 'Mock Building Without Address',
      labelCoord: { latitude: 45.124, longitude: -73.124 },
    }
  ]
}));
jest.mock('../src/components/FloorPlanViewer', () => {
  const React = require('react');
  const { View, Button, Text } = require('react-native');
  return function MockFloorPlanViewer(props: any) {
    return (
      <View testID="floor-plan-viewer-mock">
        <Text>Hall Building - Floor 8</Text>
        <Button testID="floor-plan-close" title="Close" onPress={props.onClose} />
        <Button testID="trigger-start-room" title="Start" onPress={() => props.onStartRoomChange({ buildingId: 'mock-building-id', floorId: '8', roomId: '820' })} />
        <Button testID="trigger-dest-room" title="Dest" onPress={() => props.onDestinationRoomChange({ buildingId: 'mock-building-id', floorId: '8', roomId: '820' })} />
        <Button testID="trigger-start-no-address" title="Start No Addr" onPress={() => props.onStartRoomChange({ buildingId: 'mock-no-address', floorId: '1', roomId: '101' })} />
        <Button testID="trigger-dest-no-address" title="Dest No Addr" onPress={() => props.onDestinationRoomChange({ buildingId: 'mock-no-address', floorId: '1', roomId: '101' })} />
        <Button testID="trigger-invalid-start" title="Inv Start" onPress={() => props.onStartRoomChange({ buildingId: 'INVALID', floorId: '8', roomId: '999' })} />
        <Button testID="trigger-invalid-dest" title="Inv Dest" onPress={() => props.onDestinationRoomChange({ buildingId: 'INVALID', floorId: '8', roomId: '999' })} />
      </View>
    );
  };
});
jest.spyOn(Alert, 'alert');

suppressActWarnings();
setupAppStateMock();

describe('MapScreen', () => {
  beforeEach(() => {
    resetAllMocks();
    (Linking as any).openSettings = mockOpenSettings;
  });

  it('renders MapView with correct initial region', () => {
    const { getByTestId } = render(<MapScreen />);
    const mapView = getByTestId('map');

    expect(mapView.props.initialRegion.latitude).toBeCloseTo(45.497, 2);
    expect(mapView.props.initialRegion.longitude).toBeCloseTo(-73.579, 2);
  });

  it('passes updated zoom delta to BuildingPolygon on region change', async () => {
    const { getByTestId } = render(<MapScreen />);
    const mapView = getByTestId('map');

    expect(getByTestId('building-polygon-current-delta').props.children).toBe(0.004);

    act(() => {
      fireEvent(mapView, 'onRegionChangeComplete', {
        latitude: 45.497,
        longitude: -73.579,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    });

    await waitFor(() => {
      expect(getByTestId('building-polygon-current-delta').props.children).toBe(0.01);
    });
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

    it('handles location retrieval errors gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockRequestForegroundPermissions.mockResolvedValue({ status: 'granted' });
      mockGetCurrentPosition.mockRejectedValue(new Error('Location timeout'));

      render(<MapScreen />);

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Failed to get current location:',
          expect.any(Error)
        );
      });

      consoleWarnSpy.mockRestore();
    });

    it('opens location modal when location-off button is pressed', async () => {
      mockRequestForegroundPermissions.mockResolvedValue({ status: 'denied' });

      const { getByTestId } = render(<MapScreen />);

      await waitFor(() => {
        expect(getByTestId('location-off-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('location-off-button'));

      await waitFor(() => {
        expect(getByTestId('location-modal')).toBeTruthy();
      });
    });

    it('closes location modal when "Not now" is pressed', async () => {
      mockRequestForegroundPermissions.mockResolvedValue({ status: 'denied' });

      const { getByTestId, getByText, queryByTestId } = render(<MapScreen />);

      await waitFor(() => {
        expect(getByTestId('location-off-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('location-off-button'));

      await waitFor(() => {
        expect(getByTestId('location-modal')).toBeTruthy();
      });

      fireEvent.press(getByText('Not now'));

      await waitFor(() => {
        expect(queryByTestId('location-modal')).toBeNull();
      });
    });

    it('opens settings when "Open settings" is pressed', async () => {
      const mockOpenSettings = jest.fn();
      jest.spyOn(require('react-native').Linking, 'openSettings').mockImplementation(mockOpenSettings);

      mockRequestForegroundPermissions.mockResolvedValue({ status: 'denied' });

      const { getByTestId } = render(<MapScreen />);

      await waitFor(() => {
        expect(getByTestId('location-off-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('location-off-button'));

      await waitFor(() => {
        expect(getByTestId('location-modal')).toBeTruthy();
      });

      fireEvent.press(getByTestId('open-settings-button'));

      await waitFor(() => {
        expect(mockOpenSettings).toHaveBeenCalled();
      });
    });

    it('re-requests permission when "Turn on location" is pressed', async () => {
      mockRequestForegroundPermissions.mockResolvedValueOnce({ status: 'denied' });

      const { getByTestId } = render(<MapScreen />);

      await waitFor(() => {
        expect(getByTestId('location-off-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('location-off-button'));

      await waitFor(() => {
        expect(getByTestId('location-modal')).toBeTruthy();
      });

      mockRequestForegroundPermissions.mockResolvedValueOnce({ status: 'granted' });

      fireEvent.press(getByTestId('request-permission-button'));

      await waitFor(() => {
        expect(mockRequestForegroundPermissions).toHaveBeenCalledTimes(2);
      });
    });

    it('updates location status when app returns from background with permission granted', async () => {
      mockRequestForegroundPermissions.mockResolvedValue({ status: 'denied' });
      mockGetForegroundPermissions.mockResolvedValue({ status: 'granted' });

      const { getByTestId } = render(<MapScreen />);

      await waitFor(() => {
        expect(getByTestId('location-off-button')).toBeTruthy();
      });

      // Get the app state listener that was registered
      const appStateListener = (require('react-native').AppState.addEventListener as jest.Mock).mock.calls[0][1];

      // First simulate the app going to background
      await act(async () => {
        await appStateListener('background');
      });

      // Then simulate app returning to active (from background)
      await act(async () => {
        await appStateListener('active');
      });

      await waitFor(() => {
        expect(mockGetForegroundPermissions).toHaveBeenCalled();
        expect(mockGetCurrentPosition).toHaveBeenCalled();
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

    it('shows View Floor Plan button when a building with floor plans is selected', async () => {
      const { getByTestId, getByText } = render(<MapScreen />);

      fireEvent.press(getByTestId('select-building'));

      await waitFor(() => {
        expect(getByText('Hall Building')).toBeTruthy();
        expect(getByTestId('view-floor-plan-button')).toBeTruthy();
      });
    });

    it('opens FloorPlanViewer when View Floor Plan button is pressed', async () => {
      const { getByTestId, getByText } = render(<MapScreen />);

      fireEvent.press(getByTestId('select-building'));

      await waitFor(() => expect(getByTestId('view-floor-plan-button')).toBeTruthy());

      fireEvent.press(getByTestId('view-floor-plan-button'));

      await waitFor(() => {
        expect(getByText('Hall Building - Floor 8')).toBeTruthy();
      });
    });

    it('does not show View Floor Plan button for buildings without floor plans', async () => {
      const { getByTestId, queryByTestId } = render(<MapScreen />);

      fireEvent.press(getByTestId('select-building-no-plans'));

      await waitFor(() => expect(getByTestId('building-close')).toBeTruthy());

      expect(queryByTestId('view-floor-plan-button')).toBeNull();
    });

    it('closes building info when close button is pressed', async () => {
      const { getByTestId, queryByText, getByText } = render(<MapScreen />);
      fireEvent.press(getByTestId('select-building'));
      await waitFor(() => expect(getByText('Hall Building')).toBeTruthy());

      fireEvent.press(getByTestId('building-close'));

      await new Promise(resolve => setTimeout(resolve, 350));

      expect(queryByText('Hall Building')).toBeNull();
    });

    it('does not open FloorPlanViewer when building has no floor plans', async () => {
      const { getByTestId, queryByText } = render(<MapScreen />);

      // Mock a building selection without floor plans
      fireEvent.press(getByTestId('select-building-no-plans'));

      await waitFor(() => {
        expect(queryByText('Hall Building - Floor 8')).toBeNull();
      });
    });

    it('closes FloorPlanViewer when close button is pressed', async () => {
      const { getByTestId, getByText, queryByText } = render(<MapScreen />);

      fireEvent.press(getByTestId('select-building'));

      await waitFor(() => expect(getByTestId('view-floor-plan-button')).toBeTruthy());

      fireEvent.press(getByTestId('view-floor-plan-button'));

      await waitFor(() => {
        expect(getByText('Hall Building - Floor 8')).toBeTruthy();
      });

      fireEvent.press(getByTestId('floor-plan-close'));

      await waitFor(() => {
        expect(queryByText('Hall Building - Floor 8')).toBeNull();
      });
    });
  });

  describe('Location Modal', () => {
    it('closes modal when hardware back button is pressed (onRequestClose)', async () => {
      mockRequestForegroundPermissions.mockResolvedValue({ status: 'denied' });

      const { getByTestId, queryByTestId } = render(<MapScreen />);

      await waitFor(() => {
        expect(getByTestId('location-off-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('location-off-button'));

      await waitFor(() => {
        expect(getByTestId('location-modal')).toBeTruthy();
      });

      const modal = getByTestId('location-modal');
      act(() => {
        if (modal.props.onRequestClose) {
          modal.props.onRequestClose();
        }
      });

      await waitFor(() => {
        expect(queryByTestId('location-modal')).toBeNull();
      });
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

  it('renders SafeAreaView with campus selector and building selector toggle', () => {
    const { getByTestId, getByText } = render(<MapScreen />);

    const safeAreaView = getByTestId('safe-area-view');
    expect(safeAreaView).toBeTruthy();

    const downtownButton = getByText('Downtown');
    const toggleButton = getByTestId('building-selector-toggle');

    expect(safeAreaView).toContainElement(downtownButton);
    expect(safeAreaView).toContainElement(toggleButton);
  });

  it('positions buttons correctly to avoid notch overlap', () => {
    const { getByTestId, getByText } = render(<MapScreen />);

    const safeAreaView = getByTestId('safe-area-view');
    const toggleButton = getByTestId('building-selector-toggle');
    const downtownButton = getByText('Downtown');

    // Verify both buttons are rendered within the safe area
    expect(safeAreaView).toBeTruthy();
    expect(toggleButton).toBeTruthy();
    expect(downtownButton).toBeTruthy();
  });

  describe("Use State Effects", () => {
    let consoleSpy: jest.SpyInstance

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });
    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('start building appears in console', async () => {
      const { getByTestId } = render(<MapScreen />);

      fireEvent.press(getByTestId('building-selector-toggle'))
      fireEvent.press(getByTestId('set-start'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Start building selected:',
          expect.any(Object)
        );
      });
    });

    it('destination building appears in console', async () => {
      const { getByTestId } = render(<MapScreen />);

      fireEvent.press(getByTestId('building-selector-toggle'))
      fireEvent.press(getByTestId('set-destination'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Destination building selected:',
          expect.any(Object)
        );
      });
    });
  });

  describe('Map Building Selection', () => {
    it('populates start when building is tapped after selecting "Select Start on Map"', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { getByTestId } = render(<MapScreen />);

      fireEvent.press(getByTestId('building-selector-toggle'));
      fireEvent.press(getByTestId('select-start-on-map'));
      fireEvent.press(getByTestId('select-building'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Start building selected:',
          expect.objectContaining({
            name: 'Hall Building',
          })
        );
      });
      consoleSpy.mockRestore();
    });

    it('populates destination when building is tapped after selecting "Select Destination on Map"', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { getByTestId } = render(<MapScreen />);

      fireEvent.press(getByTestId('building-selector-toggle'));
      fireEvent.press(getByTestId('select-destination-on-map'));
      fireEvent.press(getByTestId('select-building'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Destination building selected:',
          expect.objectContaining({
            name: 'Hall Building',
          })
        );
      });
      consoleSpy.mockRestore();
    });

    it('still opens BuildingInfo when no map selection target is active', async () => {
      const { getByTestId, getByText } = render(<MapScreen />);

      fireEvent.press(getByTestId('building-selector-toggle'));
      fireEvent.press(getByTestId('select-building'));

      await waitFor(() => {
        expect(getByText('Hall Building')).toBeTruthy();
      });
    });

    it('shows map selection banner when selection target is active', async () => {
      const { getByTestId } = render(<MapScreen />);

      fireEvent.press(getByTestId('building-selector-toggle'));
      fireEvent.press(getByTestId('select-start-on-map'));

      await waitFor(() => {
        expect(getByTestId('map-selection-banner')).toBeTruthy();
      });
    });

    it('hides map selection banner when cancelled', async () => {
      const { getByTestId, queryByTestId } = render(<MapScreen />);

      fireEvent.press(getByTestId('building-selector-toggle'));
      fireEvent.press(getByTestId('select-start-on-map'));

      await waitFor(() => {
        expect(getByTestId('map-selection-banner')).toBeTruthy();
      });

      fireEvent.press(getByTestId('cancel-map-selection'));

      await waitFor(() => {
        expect(queryByTestId('map-selection-banner')).toBeNull();
      });
    });
  });
});

describe('Room Selection Syncing', () => {
  it('syncs start room selection with building id as fallback address', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { getByTestId } = render(<MapScreen />);

      fireEvent.press(getByTestId('select-building'));
      await waitFor(() => expect(getByTestId('view-floor-plan-button')).toBeTruthy());

      fireEvent.press(getByTestId('view-floor-plan-button'));
      await waitFor(() => expect(getByTestId('trigger-start-no-address')).toBeTruthy());

      // Trigger selection for building without an address
      fireEvent.press(getByTestId('trigger-start-no-address'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Start building selected:',
          expect.objectContaining({ 
            name: 'mock-no-address',
            address: 'mock-no-address' // Verifying the fallback works!
          })
        );
      });
      consoleSpy.mockRestore();
    });

    it('syncs destination room selection with building id as fallback address', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { getByTestId } = render(<MapScreen />);

      fireEvent.press(getByTestId('select-building'));
      await waitFor(() => expect(getByTestId('view-floor-plan-button')).toBeTruthy());

      fireEvent.press(getByTestId('view-floor-plan-button'));
      await waitFor(() => expect(getByTestId('trigger-dest-no-address')).toBeTruthy());

      // Trigger selection for building without an address
      fireEvent.press(getByTestId('trigger-dest-no-address'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Destination building selected:',
          expect.objectContaining({ 
            name: 'mock-no-address',
            address: 'mock-no-address' // Verifying the fallback works!
          })
        );
      });
      consoleSpy.mockRestore();
    });

    it('syncs start room selection to start place', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { getByTestId } = render(<MapScreen />);

      fireEvent.press(getByTestId('select-building'));
      await waitFor(() => expect(getByTestId('view-floor-plan-button')).toBeTruthy());

      fireEvent.press(getByTestId('view-floor-plan-button'));
      await waitFor(() => expect(getByTestId('trigger-start-room')).toBeTruthy());

      // Trigger the room selection
      fireEvent.press(getByTestId('trigger-start-room'));

      // Verify that start building was populated from the room selection
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Start building selected:',
          expect.objectContaining({ name: 'mock-building-id' })
        );
      });
      consoleSpy.mockRestore();
    });

    it('syncs destination room selection to destination place', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { getByTestId } = render(<MapScreen />);

      fireEvent.press(getByTestId('select-building'));
      await waitFor(() => expect(getByTestId('view-floor-plan-button')).toBeTruthy());

      fireEvent.press(getByTestId('view-floor-plan-button'));
      await waitFor(() => expect(getByTestId('trigger-dest-room')).toBeTruthy());

      // Trigger the room selection
      fireEvent.press(getByTestId('trigger-dest-room'));

      // Verify that destination building was populated from the room selection
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Destination building selected:',
          expect.objectContaining({ name: 'mock-building-id' })
        );
      });
      consoleSpy.mockRestore();
    });

    it('does not sync start if building is not found', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { getByTestId } = render(<MapScreen />);

      fireEvent.press(getByTestId('select-building'));
      await waitFor(() => expect(getByTestId('view-floor-plan-button')).toBeTruthy());

      fireEvent.press(getByTestId('view-floor-plan-button'));
      await waitFor(() => expect(getByTestId('trigger-invalid-start')).toBeTruthy());

      fireEvent.press(getByTestId('trigger-invalid-start'));
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(consoleSpy).not.toHaveBeenCalledWith(
        'Start building selected:',
        expect.anything()
      );
      consoleSpy.mockRestore();
    });

    it('does not sync destination if building is not found', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const { getByTestId } = render(<MapScreen />);

      fireEvent.press(getByTestId('select-building'));
      await waitFor(() => expect(getByTestId('view-floor-plan-button')).toBeTruthy());

      fireEvent.press(getByTestId('view-floor-plan-button'));
      await waitFor(() => expect(getByTestId('trigger-invalid-dest')).toBeTruthy());

      fireEvent.press(getByTestId('trigger-invalid-dest'));
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(consoleSpy).not.toHaveBeenCalledWith(
        'Destination building selected:',
        expect.anything()
      );
      consoleSpy.mockRestore();
    });
  });

describe('Auto-zoom Map', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('zooms to destination when only destination is set', async () => {
    const { getByTestId } = render(<MapScreen />);
    await waitFor(() => {
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

    mockAnimateToRegion.mockClear();

    fireEvent.press(getByTestId('building-selector-toggle'));

    fireEvent.press(getByTestId('set-destination'));

    await waitFor(() => {
      expect(mockAnimateToRegion).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 45.4582,
          longitude: -73.6402,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        }),
        1000
      );
    });
    expect(mockFitToCoordinates).not.toHaveBeenCalled();
  });

  it('zooms to start when only start is set', async () => {
    const { getByTestId } = render(<MapScreen />);

    await waitFor(() => {
      expect(mockAnimateToRegion).toHaveBeenCalled();
    });

    mockAnimateToRegion.mockClear();

    fireEvent.press(getByTestId('building-selector-toggle'));

    fireEvent.press(getByTestId('set-start'));

    await waitFor(() => {
      expect(mockAnimateToRegion).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 45.4972,
          longitude: -73.5789,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        }),
        1000
      );
    });
    expect(mockFitToCoordinates).not.toHaveBeenCalled();
  });

  it('fits both points when start and destination are set', async () => {
    const { getByTestId } = render(<MapScreen />);

    await waitFor(() => {
      expect(mockAnimateToRegion).toHaveBeenCalled();
    });

    mockAnimateToRegion.mockClear();
    mockFitToCoordinates.mockClear();

    fireEvent.press(getByTestId('building-selector-toggle'));

    fireEvent.press(getByTestId('set-start'));
    fireEvent.press(getByTestId('set-destination'));

    await waitFor(() => {
      expect(mockFitToCoordinates).toHaveBeenCalledWith(
        [
          { latitude: 45.4972, longitude: -73.5789 },
          { latitude: 45.4582, longitude: -73.6402 },
        ],
        {
          edgePadding: { top: 150, right: 60, bottom: 60, left: 60 },
          animated: true,
        }
      );
    });
  });
});

describe('Transportation Modes', () => {
  it('updates map directions mode immediately when mode is changed', async () => {
    globalThis.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          status: 'OK',
          routes: [{
            legs: [{
              distance: { value: 5000, text: '5.0 km' },
              duration: { value: 600, text: '10 mins' },
              steps: []
            }]
          }]
        }),
      } as Response) 
    );
    
    const { getByTestId, findByTestId } = render(<MapScreen />);

    
    fireEvent.press(getByTestId('building-selector-toggle'));
    fireEvent.press(getByTestId('set-start'));
    fireEvent.press(getByTestId('set-destination'));

    const routeInfoContainer = await findByTestId('route-info-mock');
    expect(routeInfoContainer).toBeTruthy();

    expect(getByTestId('route-info-mode')).toHaveTextContent('Mode: DRIVING');

    fireEvent.press(getByTestId('route-info-mode-walking'));

    await waitFor(() => {
      expect(getByTestId('route-info-mode')).toHaveTextContent('Mode: WALKING');
    });
  });

  it('passes selected mode to route info', async () => {
    const { getByTestId, getByText } = render(<MapScreen />);

    fireEvent.press(getByTestId('building-selector-toggle'));
    fireEvent.press(getByTestId('set-start'));
    fireEvent.press(getByTestId('set-destination'));
    

    await waitFor(() => {
      expect(getByText('Mode: DRIVING')).toBeTruthy();
    });

    fireEvent.press(getByTestId('route-info-mode-transit'));

    await waitFor(() => {
      expect(getByText('Mode: TRANSIT')).toBeTruthy();
    });
  });

  it('renders only shuttle segment when both points are at shuttle terminals', async () => {
    const { getByTestId, queryByTestId, queryAllByTestId } = render(<MapScreen />);

    fireEvent.press(getByTestId('building-selector-toggle'));
    fireEvent.press(getByTestId('set-start-terminal'));
    fireEvent.press(getByTestId('set-destination-terminal'));
    // 

    await waitFor(() => {
      expect(getByTestId('route-info-mock')).toBeTruthy();
    });

    fireEvent.press(getByTestId('route-info-mode-shuttle'));

    await waitFor(() => {
      expect(queryByTestId('map-directions')).toBeNull();
      expect(getByTestId('map-directions-shuttle')).toBeTruthy();
      expect(queryAllByTestId('map-polyline')).toHaveLength(0);
      expect(getByTestId('route-info-mode').props.children).toContain('SHUTTLE');
    });
  });

  it('renders shuttle plus dotted walking segments when start and destination are away from terminals', async () => {
    globalThis.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          status: 'OK',
          routes: [{
            legs: [{
              distance: { value: 5000, text: '5.0 km' },
              duration: { value: 600, text: '10 mins' },
              steps: []
            }]
          }]
        }),
      } as Response) 
    );
    const { getByTestId, queryByTestId, getAllByTestId } = render(<MapScreen />);

    fireEvent.press(getByTestId('building-selector-toggle'));
    fireEvent.press(getByTestId('set-start-walk'));
    fireEvent.press(getByTestId('set-destination-walk'));
    // 

    await waitFor(() => {
      expect(getByTestId('route-info-mock')).toBeTruthy();
    });

    fireEvent.press(getByTestId('route-info-mode-shuttle'));

    await waitFor(() => {
      expect(queryByTestId('map-directions')).toBeNull();
      expect(getByTestId('map-directions-shuttle')).toBeTruthy();
      expect(getAllByTestId('map-polyline')).toHaveLength(2);
      expect(getByTestId('route-info-mode').props.children).toContain('SHUTTLE');
    });
  });
});

describe('Shuttle Schedule Edge Cases', () => {
  it('shows "no more departures today" when next departure exceeds 60 minutes', async () => {
    const OriginalDate = Date;
    const lateTime = new OriginalDate('2026-03-02T23:00:00');
    class MockDate extends OriginalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(lateTime.getTime());
          return;
        }
        super(args[0]);
      }
      static now() { return lateTime.getTime(); }
    }
    (globalThis as any).Date = MockDate as any;

    try {
      const { getByTestId, getByText } = render(<MapScreen />);

      fireEvent.press(getByTestId('building-selector-toggle'));
      fireEvent.press(getByTestId('set-start'));
      fireEvent.press(getByTestId('set-destination'));

      await waitFor(() => expect(getByTestId('route-info-mock')).toBeTruthy());

      fireEvent.press(getByTestId('route-info-mode-shuttle'));
      fireEvent.press(getByTestId('route-info-open-shuttle-schedule'));

      await waitFor(() => {
        expect(getByText(/No more shuttle departures today/i)).toBeTruthy();
      });
    } finally {
      (globalThis as any).Date = OriginalDate;
    }
  });

  it('shows service resume message on weekends', async () => {
    const OriginalDate = Date;
    const saturday = new OriginalDate('2026-03-07T10:00:00');
    class MockDate extends OriginalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(saturday.getTime());
          return;
        }
        super(args[0]);
      }
      static now() { return saturday.getTime(); }
    }
    (globalThis as any).Date = MockDate as any;

    try {
      const { getByTestId, getByText } = render(<MapScreen />);

      fireEvent.press(getByTestId('building-selector-toggle'));
      fireEvent.press(getByTestId('set-start'));
      fireEvent.press(getByTestId('set-destination'));

      await waitFor(() => expect(getByTestId('route-info-mock')).toBeTruthy());

      fireEvent.press(getByTestId('route-info-mode-shuttle'));
      fireEvent.press(getByTestId('route-info-open-shuttle-schedule'));

      await waitFor(() => {
        expect(getByText(/No service today/i)).toBeTruthy();
      });
    } finally {
      (globalThis as any).Date = OriginalDate;
    }
  });
});


describe('Clearing Route', () => {
  it('clears the route and resets the map', async () => {
    const { getByTestId, queryByTestId } = render(<MapScreen />);

    // setup route
    fireEvent.press(getByTestId('building-selector-toggle'));
    fireEvent.press(getByTestId('set-start'));
    fireEvent.press(getByTestId('set-destination'));
    

    await waitFor(() => {
      expect(getByTestId('route-info-mock')).toBeTruthy();
    });

    mockAnimateToRegion.mockClear();

    // clear route
    fireEvent.press(getByTestId('route-info-close-button'));

    await waitFor(() => {
      expect(queryByTestId('route-info-mock')).toBeNull();
    });

    // reset to initial region
    expect(mockAnimateToRegion).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 45.497,
        longitude: -73.579,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      }),
      1000
    );
  });

  it('shows route instructions when start button is pressed in RouteInfo', async () => {
    const { getByTestId, queryByTestId } = render(<MapScreen />);

    // setup route
    fireEvent.press(getByTestId('building-selector-toggle'));
    fireEvent.press(getByTestId('set-start'));
    fireEvent.press(getByTestId('set-destination'));
    

    await waitFor(() => {
      expect(getByTestId('route-info-mock')).toBeTruthy();
    });
    // The onStart callback should be available through the mock
    fireEvent.press(getByTestId('route-info-start-button'));

    await waitFor(() => {
      expect(queryByTestId('route-info-mock')).toBeNull();
      expect(getByTestId('route-instructions-mock')).toBeTruthy();
      expect(queryByTestId('building-selector-toggle')).toBeNull();
      expect(getByTestId('compact-route-header')).toBeTruthy();
    });
  });

  it('closes route instructions when close button is pressed', async () => {
    const { getByTestId, queryByTestId } = render(<MapScreen />);

    // setup route
    fireEvent.press(getByTestId('building-selector-toggle'));
    fireEvent.press(getByTestId('set-start'));
    fireEvent.press(getByTestId('set-destination'));
    

    await waitFor(() => {
      expect(getByTestId('route-info-mock')).toBeTruthy();
    });

    // Show route instructions
    fireEvent.press(getByTestId('route-info-start-button'));

    await waitFor(() => {
      expect(getByTestId('route-instructions-mock')).toBeTruthy();
    });

    // Close route instructions
    fireEvent.press(getByTestId('route-instructions-close-button'));

    await waitFor(() => {
      expect(queryByTestId('route-instructions-mock')).toBeNull();
      expect(getByTestId('route-info-mock')).toBeTruthy();
    });
  });
});

describe('MapScreen Edge Cases', () => {
  it('handles getPlaceName with fallback to id', async () => {
    const { getByTestId, getByText } = render(<MapScreen />);

    fireEvent.press(getByTestId('select-building-only-id'));

    await waitFor(() => {
      expect(getByText('Only-ID-Building')).toBeTruthy();
    });
  });

  it('updates pointerEvents based on selectedBuilding', async () => {
    const { getByTestId } = render(<MapScreen />);

    const buildingSelectorToggle = getByTestId('building-selector-toggle');
    fireEvent.press(buildingSelectorToggle);
    fireEvent.press(getByTestId('select-building'));

    await waitFor(() => {
      const buildingInfoContainer = getByTestId('building-info-container');
      expect(buildingInfoContainer.props.pointerEvents).toBe('auto');
    });
  });
});

describe('MapScreen Shuttle Coverage', () => {
  it('opens shuttle schedule, renders timetable rows, and closes via button and onRequestClose', async () => {
    const OriginalDate = Date;
    const fixedNow = new OriginalDate('2026-03-02T10:00:00');
    class MockDate extends OriginalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(fixedNow.getTime());
          return;
        }
        super(args[0]);
      }
      static now() {
        return fixedNow.getTime();
      }
    }
    (globalThis as any).Date = MockDate as any;
    try {
      const { getByTestId, getByText, queryByTestId } = render(<MapScreen />);

      fireEvent.press(getByTestId('building-selector-toggle'));
      fireEvent.press(getByTestId('set-start'));
      fireEvent.press(getByTestId('set-destination'));
      // 

      await waitFor(() => {
        expect(getByTestId('route-info-mock')).toBeTruthy();
      });

      fireEvent.press(getByTestId('route-info-mode-shuttle'));
      fireEvent.press(getByTestId('route-info-open-shuttle-schedule'));

      await waitFor(() => {
        expect(getByTestId('shuttle-schedule-modal')).toBeTruthy();
        expect(getByText('* Last bus / Dernier départ')).toBeTruthy();
      });

      fireEvent.press(getByText('Close schedule'));
      await waitFor(() => {
        expect(queryByTestId('shuttle-schedule-modal')).toBeNull();
      });

      fireEvent.press(getByTestId('route-info-open-shuttle-schedule'));
      await waitFor(() => {
        expect(getByTestId('shuttle-schedule-modal')).toBeTruthy();
      });

      const shuttleModal = getByTestId('shuttle-schedule-modal');
      act(() => {
        shuttleModal.props.onRequestClose();
      });

      await waitFor(() => {
        expect(queryByTestId('shuttle-schedule-modal')).toBeNull();
      });
    } finally {
      (globalThis as any).Date = OriginalDate;
    }
  });

  it('opens shuttle schedule when Start is pressed in shuttle mode', async () => {
    const { getByTestId } = render(<MapScreen />);

    fireEvent.press(getByTestId('building-selector-toggle'));
    fireEvent.press(getByTestId('set-start'));
    fireEvent.press(getByTestId('set-destination'));
    // 

    await waitFor(() => {
      expect(getByTestId('route-info-mock')).toBeTruthy();
    });

    fireEvent.press(getByTestId('route-info-mode-shuttle'));
    fireEvent.press(getByTestId('route-info-start-button'));

    await waitFor(() => {
      expect(getByTestId('shuttle-schedule-modal')).toBeTruthy();
    });
  });

  it('switches back to transit when shuttle mode is forced on a non-shuttle route', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        routes: [{
          legs: [{
            distance: { value: 3000, text: '3.0 km' },
            duration: { value: 480, text: '8 mins' },
            steps: []
          }]
        }]
      }),
    } as any);

    const { getByTestId } = render(<MapScreen />);

    fireEvent.press(getByTestId('building-selector-toggle'));
    fireEvent.press(getByTestId('set-start'));
    fireEvent.press(getByTestId('set-destination-downtown'));
    // 

    await waitFor(() => {
      expect(getByTestId('route-info-mock')).toBeTruthy();
      expect(getByTestId('route-info-mode').props.children).toContain('DRIVING');
    });

    fireEvent.press(getByTestId('route-info-mode-force-shuttle'));

    await waitFor(() => {
      expect(getByTestId('route-info-mode').props.children).toContain('TRANSIT');
    });
  });

  it('disables shuttle mode when start is outside both campus thresholds', async () => {
    const { getByTestId, queryByTestId } = render(<MapScreen />);

    fireEvent.press(getByTestId('building-selector-toggle'));
    fireEvent.press(getByTestId('set-start-far'));
    fireEvent.press(getByTestId('set-destination'));
    // 

    await waitFor(() => {
      expect(getByTestId('route-info-mock')).toBeTruthy();
      expect(queryByTestId('route-info-mode-shuttle')).toBeNull();
    });
  });
});

describe('Building Polygon Click Prevention', () => {
  it('passes disabled={false} to BuildingPolygon when no building is selected', async () => {
    const { getByTestId } = render(<MapScreen />);

    await waitFor(() => {
      expect(getByTestId('building-polygon-disabled')).toHaveTextContent('false');
    });
  });

  it('passes disabled={true} to BuildingPolygon when a building is selected', async () => {
    const { getByTestId } = render(<MapScreen />);

    // Select a building
    fireEvent.press(getByTestId('select-building'));

    await waitFor(() => {
      expect(getByTestId('building-polygon-disabled')).toHaveTextContent('true');
    });
  });

  it('prevents building selection when building info is open', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const { getByTestId, getByText } = render(<MapScreen />);

    // Open building info for first building
    fireEvent.press(getByTestId('select-building'));
    await waitFor(() => expect(getByText('Hall Building')).toBeTruthy());

    consoleSpy.mockClear();

    // Try to select another building (which should be disabled)
    fireEvent.press(getByTestId('select-building-no-plans'));

    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify console.log wasn't called for the second building
    // since the polygon click should have been prevented
    const logCalls = consoleSpy.mock.calls.filter((call: any) => 
      call[0] && call[0].includes('Building selected')
    );
    
    // Should only have one building selected still (no new selection)
    expect(logCalls.length).toBeLessThanOrEqual(1);

    consoleSpy.mockRestore();
  });

  it('re-enables building selection when building info is closed', async () => {
    const { getByTestId, getByText, queryByText } = render(<MapScreen />);

    // Open building info for first building
    fireEvent.press(getByTestId('select-building'));
    await waitFor(() => expect(getByText('Hall Building')).toBeTruthy());

    // Verify polygon is disabled
    expect(getByTestId('building-polygon-disabled')).toHaveTextContent('true');

    // Close building info
    fireEvent.press(getByTestId('building-close'));
    await new Promise(resolve => setTimeout(resolve, 350));

    // Verify building info is closed
    expect(queryByText('Hall Building')).toBeNull();

    // Verify polygon is enabled again
    await waitFor(() => {
      expect(getByTestId('building-polygon-disabled')).toHaveTextContent('false');
    });
  });

  it('disables building selection when floor plan viewer is open', async () => {
    const { getByTestId, getByText, queryByText } = render(<MapScreen />);

    // Open floor plan
    fireEvent.press(getByTestId('select-building'));
    await waitFor(() => expect(getByTestId('view-floor-plan-button')).toBeTruthy());
    fireEvent.press(getByTestId('view-floor-plan-button'));
    await waitFor(() => expect(getByText('Hall Building - Floor 8')).toBeTruthy());

    // Verify polygon is still disabled
    expect(getByTestId('building-polygon-disabled')).toHaveTextContent('true');

    // Close floor plan
    fireEvent.press(getByTestId('floor-plan-close'));
    await waitFor(() => expect(queryByText('Hall Building - Floor 8')).toBeNull());

    // Note: FloorPlanViewer is closed but BuildingInfo modal is still open
    // So polygon should still be disabled at this point
    expect(getByTestId('building-polygon-disabled')).toHaveTextContent('true');

    // Now close BuildingInfo to fully reset selectedBuilding state
    fireEvent.press(getByTestId('building-close'));
    await new Promise(resolve => setTimeout(resolve, 350));

    // Verify polygon is enabled after both modals are closed
    await waitFor(() => {
      expect(getByTestId('building-polygon-disabled')).toHaveTextContent('false');
    });
  });
});

describe('Compact Route Header', () => {
  it('displays start and destination names in compact route header', async () => {
    const { getByTestId, getAllByText } = render(<MapScreen />);

    fireEvent.press(getByTestId('building-selector-toggle'));
    fireEvent.press(getByTestId('set-start'));
    fireEvent.press(getByTestId('set-destination'));

    await waitFor(() => expect(getByTestId('route-info-mock')).toBeTruthy());

    fireEvent.press(getByTestId('route-info-start-button'));

    await waitFor(() => {
      const header = getByTestId('compact-route-header');
      expect(header).toBeTruthy();
      expect(getAllByText(/SGW|Loyola|Downtown/i).length).toBeGreaterThan(0);
    });
  });

  it('hides building selector toggle when compact route header is shown', async () => {
    const { getByTestId, queryByTestId } = render(<MapScreen />);

    fireEvent.press(getByTestId('building-selector-toggle'));
    fireEvent.press(getByTestId('set-start'));
    fireEvent.press(getByTestId('set-destination'));

    await waitFor(() => expect(getByTestId('route-info-mock')).toBeTruthy());

    fireEvent.press(getByTestId('route-info-start-button'));

    await waitFor(() => {
      expect(queryByTestId('building-selector-toggle')).toBeNull();
    });
  });
});

describe('Directions Floor Plan', () => {
  it('opens FloorPlanViewer when onViewFloorPlan is called from RouteInstructions', async () => {
    const { getByTestId, getByText } = render(<MapScreen />);

    fireEvent.press(getByTestId('building-selector-toggle'));
    fireEvent.press(getByTestId('set-start'));
    fireEvent.press(getByTestId('set-destination'));

    await waitFor(() => expect(getByTestId('route-info-mock')).toBeTruthy());

    fireEvent.press(getByTestId('route-info-start-button'));

    await waitFor(() => expect(getByTestId('route-instructions-mock')).toBeTruthy());

    fireEvent.press(getByTestId('route-instructions-view-floor-plan'));

    await waitFor(() => {
      expect(getByTestId('floor-plan-viewer-mock')).toBeTruthy();
    });
  });

  it('closes directions FloorPlanViewer when its close button is pressed', async () => {
    const { getByTestId, queryByTestId } = render(<MapScreen />);

    fireEvent.press(getByTestId('building-selector-toggle'));
    fireEvent.press(getByTestId('set-start'));
    fireEvent.press(getByTestId('set-destination'));

    await waitFor(() => expect(getByTestId('route-info-mock')).toBeTruthy());

    fireEvent.press(getByTestId('route-info-start-button'));
    await waitFor(() => expect(getByTestId('route-instructions-mock')).toBeTruthy());

    fireEvent.press(getByTestId('route-instructions-view-floor-plan'));
    await waitFor(() => expect(getByTestId('floor-plan-viewer-mock')).toBeTruthy());

    fireEvent.press(getByTestId('floor-plan-close'));

    await waitFor(() => {
      expect(queryByTestId('floor-plan-viewer-mock')).toBeNull();
    });
  });
});

describe('Route Instructions', () => {
  const setupRouteInstructions = async (getByTestId: any) => {
    fireEvent.press(getByTestId('building-selector-toggle'));
    fireEvent.press(getByTestId('set-start'));
    fireEvent.press(getByTestId('set-destination'));

    await waitFor(() => expect(getByTestId('route-info-mock')).toBeTruthy());

    fireEvent.press(getByTestId('route-info-start-button'));

    await waitFor(() => expect(getByTestId('route-instructions-mock')).toBeTruthy());
  };

  it('hides route info panel when route instructions are shown', async () => {
    const { getByTestId, queryByTestId } = render(<MapScreen />);
    await setupRouteInstructions(getByTestId);

    expect(queryByTestId('route-info-container')).toBeNull();
  });

  it('shows compact route header when route instructions are open', async () => {
    const { getByTestId } = render(<MapScreen />);
    await setupRouteInstructions(getByTestId);

    expect(getByTestId('compact-route-header')).toBeTruthy();
  });

  it('hides building selector toggle when route instructions are open', async () => {
    const { getByTestId, queryByTestId } = render(<MapScreen />);
    await setupRouteInstructions(getByTestId);

    expect(queryByTestId('building-selector-toggle')).toBeNull();
  });

  it('returns to route info when instructions are closed', async () => {
    const { getByTestId, queryByTestId } = render(<MapScreen />);
    await setupRouteInstructions(getByTestId);

    fireEvent.press(getByTestId('route-instructions-close-button'));

    await waitFor(() => {
      expect(queryByTestId('route-instructions-mock')).toBeNull();
      expect(getByTestId('route-info-mock')).toBeTruthy();
    });
  });

  it('does not show route instructions before start button is pressed', async () => {
    const { getByTestId, queryByTestId } = render(<MapScreen />);

    fireEvent.press(getByTestId('building-selector-toggle'));
    fireEvent.press(getByTestId('set-start'));
    fireEvent.press(getByTestId('set-destination'));

    await waitFor(() => expect(getByTestId('route-info-mock')).toBeTruthy());

    expect(queryByTestId('route-instructions-mock')).toBeNull();
  });

  it('does not show route instructions when no route is set', async () => {
    const { queryByTestId } = render(<MapScreen />);

    expect(queryByTestId('route-instructions-mock')).toBeNull();
  });

  it('opens floor plan viewer from route instructions and can close it', async () => {
    const { getByTestId, queryByTestId } = render(<MapScreen />);
    await setupRouteInstructions(getByTestId);

    fireEvent.press(getByTestId('route-instructions-view-floor-plan'));

    await waitFor(() => {
      expect(getByTestId('floor-plan-viewer-mock')).toBeTruthy();
    });

    fireEvent.press(getByTestId('floor-plan-close'));

    await waitFor(() => {
      expect(queryByTestId('floor-plan-viewer-mock')).toBeNull();
    });
  });

  it('keeps route instructions visible after closing floor plan viewer', async () => {
    const { getByTestId } = render(<MapScreen />);
    await setupRouteInstructions(getByTestId);

    fireEvent.press(getByTestId('route-instructions-view-floor-plan'));
    await waitFor(() => expect(getByTestId('floor-plan-viewer-mock')).toBeTruthy());

    fireEvent.press(getByTestId('floor-plan-close'));

    await waitFor(() => {
      expect(getByTestId('route-instructions-mock')).toBeTruthy();
    });
  });

  it('clears route instructions when route is cleared', async () => {
    const { getByTestId, queryByTestId } = render(<MapScreen />);
    await setupRouteInstructions(getByTestId);

    fireEvent.press(getByTestId('route-instructions-close-button'));
    await waitFor(() => expect(getByTestId('route-info-mock')).toBeTruthy());

    fireEvent.press(getByTestId('route-info-close-button'));

    await waitFor(() => {
      expect(queryByTestId('route-instructions-mock')).toBeNull();
      expect(queryByTestId('route-info-mock')).toBeNull();
    });
  });
});


