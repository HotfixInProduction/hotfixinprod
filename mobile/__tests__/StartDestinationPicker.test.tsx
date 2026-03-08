import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import StartDestinationPicker from '../src/components/BuildingSelector/StartDestinationPicker';
import BuildingSelector from '../src/components/BuildingSelector/BuildingSelector';
import * as Location from 'expo-location';

// Mock expo-location
jest.mock('expo-location', () => ({
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

// mock this library sice not compatible with Node.js
jest.mock('react-native-config', () => ({
  GOOGLE_MAPS_ANDROID_API_KEY: 'fake-key',
}));

// Mock BuildingSelector component
jest.mock('../src/components/BuildingSelector/BuildingSelector', () => require('./utils/testUtils').createBuildingSelectorMock());

// Mock buildings data
jest.mock('../src/data/buildings', () => ({
  buildings: [
    {
      id: 'Hall Building',
      address: '1455 De Maisonneuve Blvd. W.',
      labelCoord: { latitude: 45.497, longitude: -73.579 }
    },
    {
      id: 'EV Building',
      address: '1515 St. Catherine St. W.',
      labelCoord: { latitude: 45.495, longitude: -73.578 }
    }
  ]
}));

describe('StartDestinationPicker', () => {
  // Helper functions to reduce code duplication
  const getStartSelector = () => {
    const calls = (BuildingSelector as jest.Mock).mock.calls;
    const startCall = calls.find(call => call[0].placeholder === 'Select start building');
    return startCall[0].onSelect;
  };

  const getDestinationSelector = () => {
    const calls = (BuildingSelector as jest.Mock).mock.calls;
    const destCall = calls.find(call => call[0].placeholder === 'Select destination building');
    return destCall[0].onSelect;
  };

  const createMockPlace = (name: string, address: string, lat: number = 40.7128, lng: number = -74.006) => ({
    name,
    address,
    location: { lat, lng },
  });

  const selectPlace = async (onSelect: (place: any) => void, place: any) => {
    await act(async () => {
      onSelect(place);
    });
  };

  const setupLocationMock = (coords: { latitude: number; longitude: number }) => {
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({ coords });
  };

  const pressCurrentLocationButton = async (getByText: any) => {
    const currentLocationButton = getByText('Use Current Location');
    await act(async () => {
      fireEvent.press(currentLocationButton);
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    (Location.getCurrentPositionAsync as jest.Mock).mockClear();
    (Location.reverseGeocodeAsync as jest.Mock).mockClear();
  });

  const defaultStartDestProps = {
    userLocation: null,
    start: null,
    destination: null,
    setStart: jest.fn(),
    setDestination: jest.fn(),
    setInstructions: jest.fn(),
    transportMode: 'DRIVING' as const,
    setDirectionsGoogle: jest.fn(),
    setRouteInfo: jest.fn()
  };

  it('passes correct placeholder for start building selector', () => {
    render(<StartDestinationPicker {...defaultStartDestProps} />);
    const calls = (BuildingSelector as jest.Mock).mock.calls;
    const startCall = calls.find(call => call[0].placeholder === 'Select start building');
    expect(startCall).toBeDefined();
    expect(startCall[0].placeholder).toBe('Select start building');
  });

  it('passes correct placeholder for destination building selector', () => {
    render(<StartDestinationPicker {...defaultStartDestProps} />);
    const calls = (BuildingSelector as jest.Mock).mock.calls;
    const destCall = calls.find(call => call[0].placeholder === 'Select destination building');
    expect(destCall).toBeDefined();
    expect(destCall[0].placeholder).toBe('Select destination building');
  });

  it('handles start building selection', async () => {
    const mockSetStart = jest.fn();
    render(<StartDestinationPicker {...defaultStartDestProps} setStart={mockSetStart} />);

    const onSelectStart = getStartSelector();
    const mockPlace = createMockPlace('Start Building', '123 Start St');

    await selectPlace(onSelectStart, mockPlace);

    expect(mockSetStart).toHaveBeenCalledWith(mockPlace);
  });

  it('handles destination building selection', async () => {
    const mockSetDestination = jest.fn();
    render(<StartDestinationPicker {...defaultStartDestProps} setDestination={mockSetDestination} />);

    const onSelectDest = getDestinationSelector();
    const mockPlace = createMockPlace('Destination Building', '456 Dest Ave', 41.8781, -87.6298);

    await selectPlace(onSelectDest, mockPlace);

    expect(mockSetDestination).toHaveBeenCalledWith(mockPlace);
  });

  it('logs start building selection in useEffect', async () => {
    const mockSetStart = jest.fn();
    render(<StartDestinationPicker {...defaultStartDestProps} setStart={mockSetStart} />);
    const onSelectStart = getStartSelector();
    const mockPlace = createMockPlace('Start Building', '123 Start St');

    await selectPlace(onSelectStart, mockPlace);

    await waitFor(() => {
      expect(mockSetStart).toHaveBeenCalledWith(mockPlace);
    });
  });

  it('logs destination building selection in useEffect', async () => {
    const mockSetDestination = jest.fn();
    render(<StartDestinationPicker {...defaultStartDestProps} setDestination={mockSetDestination} />);
    const onSelectDest = getDestinationSelector();
    const mockPlace = createMockPlace('Destination Building', '456 Dest Ave', 41.8781, -87.6298);

    await selectPlace(onSelectDest, mockPlace);

    await waitFor(() => {
      expect(mockSetDestination).toHaveBeenCalledWith(mockPlace);
    });
  });

  it('does not show selected text when no building is selected', () => {
    const { queryByText } = render(<StartDestinationPicker {...defaultStartDestProps} />);
    expect(queryByText(/^Selected:/)).toBeNull();
  });

  it('handles multiple selections for start building', async () => {
    const mockSetStart = jest.fn();
    render(<StartDestinationPicker {...defaultStartDestProps} setStart={mockSetStart} />);

    const onSelectStart = getStartSelector();

    const mockPlace1 = createMockPlace('First Building', '123 First St');
    await selectPlace(onSelectStart, mockPlace1);

    expect(mockSetStart).toHaveBeenNthCalledWith(1, mockPlace1);

    const mockPlace2 = createMockPlace('Second Building', '456 Second St', 41.8781, -87.6298);
    await selectPlace(onSelectStart, mockPlace2);

    expect(mockSetStart).toHaveBeenNthCalledWith(2, mockPlace2);
  });

  it('handles independent selections for start and destination', async () => {
    const mockSetStart = jest.fn();
    const mockSetDestination = jest.fn();
    render(<StartDestinationPicker {...defaultStartDestProps} setStart={mockSetStart} setDestination={mockSetDestination} />);

    const onSelectStart = getStartSelector();
    const onSelectDest = getDestinationSelector();

    const startPlace = createMockPlace('Start Building', '123 Start St');
    const destPlace = createMockPlace('Destination Building', '456 Dest Ave', 41.8781, -87.6298);

    await act(async () => {
      onSelectStart(startPlace);
      onSelectDest(destPlace);
    });

    expect(mockSetStart).toHaveBeenCalledWith(startPlace);
    expect(mockSetDestination).toHaveBeenCalledWith(destPlace);
  });

  it('does not fetch instructions when googleMapsApiKey is missing', async () => {
    const start = { name: "Hall Building", address: "1455 De Maisonneuve Blvd. W.", location: { lat: 45.497285416040164, lng: -73.57897485280246 } }
    const destination = { name: "Hall Building", address: "1455 De Maisonneuve Blvd. W.", location: { lat: 45.497285416040164, lng: -73.57897485280246 } }

    // Temporarily set the API key to undefined
    const Config = require('react-native-config');
    const originalKey = Config.GOOGLE_MAPS_ANDROID_API_KEY;
    Config.GOOGLE_MAPS_ANDROID_API_KEY = undefined;

    globalThis.fetch = jest.fn();
    const mockSetInstructions = jest.fn();

    const { rerender } = render(<StartDestinationPicker {...defaultStartDestProps} start={null} destination={null} setInstructions={mockSetInstructions} />);

    // Now set start and destination which should trigger the useEffect
    rerender(<StartDestinationPicker {...defaultStartDestProps} start={start} destination={destination} setInstructions={mockSetInstructions} />);

    await waitFor(() => {
      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(mockSetInstructions).not.toHaveBeenCalled();
    }, { timeout: 1000 });

    // Restore original key
    Config.GOOGLE_MAPS_ANDROID_API_KEY = originalKey;
  });

  it('shows Use Current Location button when userLocation is provided', () => {
    const userLocation = { latitude: 45.5, longitude: -73.6 };
    const { getByText } = render(<StartDestinationPicker {...defaultStartDestProps} userLocation={userLocation} />);
    expect(getByText('Use Current Location')).toBeTruthy();
  });

  it('does not show Use Current Location button when userLocation is null', () => {
    const { queryByText } = render(<StartDestinationPicker {...defaultStartDestProps} />);
    expect(queryByText('Use Current Location')).toBeNull();
  });

  it('handles Use Current Location button press - finds nearest building', async () => {
    const userLocation = { latitude: 45.497, longitude: -73.579 };
    setupLocationMock(userLocation);
    const mockSetStart = jest.fn();

    const { getByText } = render(<StartDestinationPicker {...defaultStartDestProps} userLocation={userLocation} setStart={mockSetStart} />);
    await pressCurrentLocationButton(getByText);

    await waitFor(() => {
      expect(mockSetStart).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Hall Building',
      }));
    });
  });

  it('handles Use Current Location button press - uses reverse geocoding when far from buildings', async () => {
    const userLocation = { latitude: 40.7128, longitude: -74.006 };
    setupLocationMock(userLocation);
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([{
      street: 'Broadway',
      city: 'New York',
      region: 'NY',
      name: 'Times Square'
    }]);
    const mockSetStart = jest.fn();

    const { getByText } = render(<StartDestinationPicker {...defaultStartDestProps} userLocation={userLocation} setStart={mockSetStart} />);
    await pressCurrentLocationButton(getByText);

    await waitFor(() => {
      expect(mockSetStart).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Broadway',
      }));
    });
  });

  it('handles Use Current Location button press - fallback to coordinates when reverse geocoding fails', async () => {
    const userLocation = { latitude: 40.7128, longitude: -74.006 };
    setupLocationMock(userLocation);
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([]);
    const mockSetStart = jest.fn();

    const { getByText } = render(<StartDestinationPicker {...defaultStartDestProps} userLocation={userLocation} setStart={mockSetStart} />);
    await pressCurrentLocationButton(getByText);

    await waitFor(() => {
      expect(mockSetStart).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Current Location',
      }));
    });
  });

  it('handles Use Current Location button press - error handling with fallback', async () => {
    const userLocation = { latitude: 40.7128, longitude: -74.006 };
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(new Error('Location error'));
    console.error = jest.fn();
    const mockSetStart = jest.fn();

    const { getByText } = render(<StartDestinationPicker {...defaultStartDestProps} userLocation={userLocation} setStart={mockSetStart} />);
    await pressCurrentLocationButton(getByText);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Error getting location name:', expect.any(Error));
      expect(mockSetStart).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Current Location',
      }));
    });
  });

  it('handles Use Current Location button press - error handling without fallback', async () => {
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(new Error('Location error'));
    console.error = jest.fn();

    const { queryByText } = render(<StartDestinationPicker {...defaultStartDestProps} />);
    // Wait for component to render - no Use Current Location button should appear
    expect(queryByText('Use Current Location')).toBeNull();
  });

  it('shows clear button when start building is selected', async () => {
    const mockPlace = createMockPlace('Start Building', '123 Start St');
    const { UNSAFE_getAllByType } = render(<StartDestinationPicker {...defaultStartDestProps} start={mockPlace} />);

    await waitFor(() => {
      const TouchableOpacity = require('react-native').TouchableOpacity;
      const clearButtons = UNSAFE_getAllByType(TouchableOpacity);
      expect(clearButtons.length).toBeGreaterThan(0);
    });
  });

  it('clears start building when clear button is pressed', async () => {
    const mockSetStart = jest.fn();
    const { getByTestId } = render(<StartDestinationPicker {...defaultStartDestProps} setStart={mockSetStart} start={createMockPlace('Start Building', '123 Start St')} />);

    const clearButton = getByTestId('clear-start-button');

    await act(async () => {
      fireEvent.press(clearButton);
    });

    await waitFor(() => {
      expect(mockSetStart).toHaveBeenCalledWith(null);
    });
  });

  it('shows clear button when destination building is selected', async () => {
    const mockPlace = createMockPlace('Destination Building', '456 Dest Ave', 41.8781, -87.6298);
    const { UNSAFE_getAllByType } = render(<StartDestinationPicker {...defaultStartDestProps} destination={mockPlace} />);

    await waitFor(() => {
      const TouchableOpacity = require('react-native').TouchableOpacity;
      const clearButtons = UNSAFE_getAllByType(TouchableOpacity);
      expect(clearButtons.length).toBeGreaterThan(0);
    });
  });

  it('clears destination building when clear button is pressed', async () => {
    const mockSetDestination = jest.fn();
    const { getByTestId } = render(<StartDestinationPicker {...defaultStartDestProps} setDestination={mockSetDestination} start={createMockPlace('Start Building', '123 Start St')} destination={createMockPlace('Destination Building', '456 Dest Ave', 41.8781, -87.6298)} />);

    const destinationClearButton = getByTestId('clear-destination-button');

    await act(async () => {
      fireEvent.press(destinationClearButton);
    });

    await waitFor(() => {
      expect(mockSetDestination).toHaveBeenCalledWith(null);
    });
  });

  it('passes userLocation prop to BuildingSelector components', () => {
    const userLocation = { latitude: 45.5, longitude: -73.6 };
    render(<StartDestinationPicker {...defaultStartDestProps} userLocation={userLocation} />);

    const calls = (BuildingSelector as jest.Mock).mock.calls;
    calls.forEach(call => {
      expect(call[0].userLocation).toEqual(userLocation);
    });
  });

  it('shows loading indicator when fetching current location', async () => {
    const userLocation = { latitude: 45.5, longitude: -73.6 };
    let resolveLocation: any;
    const locationPromise = new Promise((resolve) => {
      resolveLocation = resolve;
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockReturnValue(locationPromise);

    const { getByText, UNSAFE_getByType } = render(<StartDestinationPicker {...defaultStartDestProps} userLocation={userLocation} />);
    const currentLocationButton = getByText('Use Current Location');

    await act(async () => {
      fireEvent.press(currentLocationButton);
    });

    // Check if ActivityIndicator is shown
    const ActivityIndicator = require('react-native').ActivityIndicator;
    await waitFor(() => {
      expect(() => UNSAFE_getByType(ActivityIndicator)).not.toThrow();
    });

    // Resolve the promise
    await act(async () => {
      resolveLocation({
        coords: {
          latitude: 45.497,
          longitude: -73.579,
        }
      });
    });
  });

  it('passes value prop to BuildingSelector for start building', async () => {
    const mockPlace = createMockPlace('Test Building', '123 Test St');
    render(<StartDestinationPicker {...defaultStartDestProps} start={mockPlace} />);

    await waitFor(() => {
      const calls = (BuildingSelector as jest.Mock).mock.calls;
      const callWithValue = calls.find(call => call[0].value === 'Test Building');
      expect(callWithValue).toBeDefined();
    });
  });

  it('passes value prop to BuildingSelector for destination building', async () => {
    const mockPlace = createMockPlace('Test Destination', '456 Test Ave', 41.8781, -87.6298);
    render(<StartDestinationPicker {...defaultStartDestProps} destination={mockPlace} />);

    await waitFor(() => {
      const calls = (BuildingSelector as jest.Mock).mock.calls;
      const callWithValue = calls.find(call => call[0].value === 'Test Destination');
      expect(callWithValue).toBeDefined();
    });
  });

  it('renders MaterialIcons for clear buttons', async () => {
    const { UNSAFE_getAllByType } = render(<StartDestinationPicker {...defaultStartDestProps} start={createMockPlace('Test Building', '123 Test St')} />);

    await waitFor(() => {
      const MaterialIcons = require('@expo/vector-icons').MaterialIcons;
      const icons = UNSAFE_getAllByType(MaterialIcons);
      expect(icons.length).toBeGreaterThan(0);
      const closeIcon = icons.find((icon: any) => icon.props.name === 'close');
      expect(closeIcon).toBeDefined();
    });
  });

  it('renders MaterialIcons for current location button', () => {
    const userLocation = { latitude: 45.5, longitude: -73.6 };
    const { UNSAFE_getAllByType } = render(<StartDestinationPicker {...defaultStartDestProps} userLocation={userLocation} />);

    const MaterialIcons = require('@expo/vector-icons').MaterialIcons;
    const icons = UNSAFE_getAllByType(MaterialIcons);
    // Check that my-location icon is present
    const locationIcon = icons.find((icon: any) => icon.props.name === 'my-location');
    expect(locationIcon).toBeDefined();
  });

  it('renders selected text with proper styling', async () => {
    const mockPlace = createMockPlace('Styled Building', '789 Style Ave');
    const { getByText } = render(<StartDestinationPicker {...defaultStartDestProps} start={mockPlace} />);

    await waitFor(() => {
      const selectedText = getByText('Selected: Styled Building');
      expect(selectedText).toBeTruthy();
      expect(selectedText.props.style).toBeDefined();
    });
  });

  it('renders all label texts', () => {
    const { getByText } = render(<StartDestinationPicker {...defaultStartDestProps} />);

    expect(getByText('Start Building')).toBeTruthy();
    expect(getByText('Destination Building')).toBeTruthy();
  });

  describe('Select on Map buttons', () => {
    const mapSelectionProps = {
      ...defaultStartDestProps,
      mapSelectionTarget: null as 'start' | 'destination' | null,
      setMapSelectionTarget: jest.fn(),
    };

    beforeEach(() => {
      mapSelectionProps.setMapSelectionTarget = jest.fn();
    });

    it('renders Select on Map button for start when setMapSelectionTarget is provided', () => {
      const { getByTestId } = render(<StartDestinationPicker {...mapSelectionProps} />);
      expect(getByTestId('select-start-on-map')).toBeTruthy();
    });

    it('renders Select on Map button for destination when setMapSelectionTarget is provided', () => {
      const { getByTestId } = render(<StartDestinationPicker {...mapSelectionProps} />);
      expect(getByTestId('select-destination-on-map')).toBeTruthy();
    });

    it('does not render Select on Map buttons when setMapSelectionTarget is not provided', () => {
      const { queryByTestId } = render(<StartDestinationPicker {...defaultStartDestProps} />);
      expect(queryByTestId('select-start-on-map')).toBeNull();
      expect(queryByTestId('select-destination-on-map')).toBeNull();
    });

    it('calls setMapSelectionTarget with "start" when start Select on Map is pressed', async () => {
      const { getByTestId } = render(<StartDestinationPicker {...mapSelectionProps} />);

      await act(async () => {
        fireEvent.press(getByTestId('select-start-on-map'));
      });

      expect(mapSelectionProps.setMapSelectionTarget).toHaveBeenCalledWith('start');
    });

    it('calls setMapSelectionTarget with "destination" when destination Select on Map is pressed', async () => {
      const { getByTestId } = render(<StartDestinationPicker {...mapSelectionProps} />);

      await act(async () => {
        fireEvent.press(getByTestId('select-destination-on-map'));
      });

      expect(mapSelectionProps.setMapSelectionTarget).toHaveBeenCalledWith('destination');
    });

    it('shows active state for start when mapSelectionTarget is "start"', () => {
      const { getByText } = render(
        <StartDestinationPicker {...mapSelectionProps} mapSelectionTarget="start" />
      );
      expect(getByText('Selecting on map...')).toBeTruthy();
    });

    it('shows active state for destination when mapSelectionTarget is "destination"', () => {
      const { getAllByText } = render(
        <StartDestinationPicker {...mapSelectionProps} mapSelectionTarget="destination" />
      );
      // One "Select on Map" for start, one "Selecting on map..." for destination
      expect(getAllByText('Select on Map').length).toBe(1);
      expect(getAllByText('Selecting on map...').length).toBe(1);
    });

    it('toggles off when pressing active Select on Map button', async () => {
      const { getByTestId } = render(
        <StartDestinationPicker {...mapSelectionProps} mapSelectionTarget="start" />
      );

      await act(async () => {
        fireEvent.press(getByTestId('select-start-on-map'));
      });

      expect(mapSelectionProps.setMapSelectionTarget).toHaveBeenCalledWith(null);
    });

    it('shows active state for start with special styling', () => {
      const { getByTestId } = render(
        <StartDestinationPicker {...mapSelectionProps} mapSelectionTarget="start" />
      );
      const startButton = getByTestId('select-start-on-map');
      // Verify it has the active style (backgroundColor: #912338)
      expect(startButton.props.style).toMatchObject(expect.objectContaining({ backgroundColor: '#912338' }));
    });
  });

  it('handles reverse geocoding with only street name', async () => {
    const userLocation = { latitude: 40.7128, longitude: -74.006 };
    setupLocationMock(userLocation);
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([{
      street: 'Only Street',
      city: 'New York',
    }]);
    const mockSetStart = jest.fn();

    const { getByText } = render(<StartDestinationPicker {...defaultStartDestProps} userLocation={userLocation} setStart={mockSetStart} />);
    await pressCurrentLocationButton(getByText);

    await waitFor(() => {
      expect(mockSetStart).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Only Street',
      }));
    });
  });
});
