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

jest.mock('../src/components/BuildingSelector/InlineRoomSelector', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  return function MockInlineRoomSelector(props: any) {
    return (
      <View testID={`inline-room-selector-${props.label.toLowerCase()}`}>
        <Text>{props.label} Inline Room Selector</Text>
        <Text testID={`inline-room-selector-building-${props.label.toLowerCase()}`}>
          {String(props.buildingId)}
        </Text>
      </View>
    );
  };
});

describe('StartDestinationPicker', () => {

  const createMockPlace = (
      name: string,
      address: string,
      lat: number = 40.7128,
      lng: number = -74.006
    ) => ({
      name,
      address,
      location: { lat, lng },
    });

    const createProps = (overrides: any = {}) => ({
      locations: {
        userLocation: null,
        start: null,
        destination: null,
        setStart: jest.fn(),
        setDestination: jest.fn(),
        ...(overrides.locations ?? {}),
      },
      route: {
        transportMode: 'DRIVING' as const,
        setInstructions: jest.fn(),
        setDirectionsGoogle: jest.fn(),
        setRouteInfo: jest.fn(),
        ...(overrides.route ?? {}),
      },
      ...(overrides.mapSelection ? { mapSelection: overrides.mapSelection } : {}),
      ...(overrides.roomSelection ? { roomSelection: overrides.roomSelection } : {}),
      ...(overrides.accessibility ? { accessibility: overrides.accessibility } : {}),
      ...(overrides.directionsAction ? { directionsAction: overrides.directionsAction } : {}),
    });
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

  const selectPlace = async (onSelect: (place: any) => void, place: any) => {
    await act(async () => {
      onSelect(place);
    });
  };

  const setupLocationMock = (coords: { latitude: number; longitude: number }) => {
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({ coords });
  };

  const pressCurrentLocationButton = async (getByText: any) => {
    const currentLocationButton = getByText('Current Location');
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

  it('passes correct placeholder for start building selector', () => {
    render(<StartDestinationPicker {...createProps()} />);
    const calls = (BuildingSelector as jest.Mock).mock.calls;
    const startCall = calls.find(call => call[0].placeholder === 'Select start building');
    expect(startCall).toBeDefined();
    expect(startCall[0].placeholder).toBe('Select start building');
  });

  it('passes correct placeholder for destination building selector', () => {
    render(<StartDestinationPicker {...createProps()} />);
    const calls = (BuildingSelector as jest.Mock).mock.calls;
    const destCall = calls.find(call => call[0].placeholder === 'Select destination building');
    expect(destCall).toBeDefined();
    expect(destCall[0].placeholder).toBe('Select destination building');
  });

  it('handles start building selection', async () => {
    const mockSetStart = jest.fn();
    render(<StartDestinationPicker {...createProps({ locations: { setStart: mockSetStart,},})} />);

    const onSelectStart = getStartSelector();
    const mockPlace = createMockPlace('Start Building', '123 Start St');

    await selectPlace(onSelectStart, mockPlace);

    expect(mockSetStart).toHaveBeenCalledWith(mockPlace);
  });

  it('handles destination building selection', async () => {
    const mockSetDestination = jest.fn();
    render(<StartDestinationPicker {...createProps({ locations: { setDestination: mockSetDestination,},})} />);

    const onSelectDest = getDestinationSelector();
    const mockPlace = createMockPlace('Destination Building', '456 Dest Ave', 41.8781, -87.6298);

    await selectPlace(onSelectDest, mockPlace);

    expect(mockSetDestination).toHaveBeenCalledWith(mockPlace);
  });

  it('logs start building selection in useEffect', async () => {
    const mockSetStart = jest.fn();
    render(<StartDestinationPicker {...createProps({ locations: { setStart: mockSetStart } })} />);
    const onSelectStart = getStartSelector();
    const mockPlace = createMockPlace('Start Building', '123 Start St');

    await selectPlace(onSelectStart, mockPlace);

    await waitFor(() => {
      expect(mockSetStart).toHaveBeenCalledWith(mockPlace);
    });
  });

  it('logs destination building selection in useEffect', async () => {
    const mockSetDestination = jest.fn();
    render(<StartDestinationPicker {...createProps({ locations: { setDestination: mockSetDestination } })} />);
    const onSelectDest = getDestinationSelector();
    const mockPlace = createMockPlace('Destination Building', '456 Dest Ave', 41.8781, -87.6298);

    await selectPlace(onSelectDest, mockPlace);

    await waitFor(() => {
      expect(mockSetDestination).toHaveBeenCalledWith(mockPlace);
    });
  });

  it('does not show selected text when no building is selected', () => {
    const { queryByText } = render(<StartDestinationPicker {...createProps()} />);
    expect(queryByText(/^Selected:/)).toBeNull();
  });

  it('handles multiple selections for start building', async () => {
    const mockSetStart = jest.fn();
    render(<StartDestinationPicker {...createProps({ locations: { setStart: mockSetStart } })} />);

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
    render(<StartDestinationPicker {...createProps({ locations: { setStart: mockSetStart, setDestination: mockSetDestination } })} />);

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

  it('shows Current Location button when userLocation is provided', () => {
    const userLocation = { latitude: 45.5, longitude: -73.6 };
    const { getByText } = render(<StartDestinationPicker {...createProps({ locations: { userLocation } })} />);
    expect(getByText('Current Location')).toBeTruthy();
  });

  it('does not show Current Location button when userLocation is null', () => {
    const { queryByText } = render(<StartDestinationPicker {...createProps()} />);
    expect(queryByText('Current Location')).toBeNull();
  });

  it('handles Use Current Location button press - finds nearest building', async () => {
    const userLocation = { latitude: 45.497, longitude: -73.579 };
    setupLocationMock(userLocation);
    const mockSetStart = jest.fn();

    const { getByText } = render(<StartDestinationPicker {...createProps({ locations: { userLocation, setStart: mockSetStart } })} />);
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

    const { getByText } = render(<StartDestinationPicker {...createProps({ locations: { userLocation, setStart: mockSetStart } })} />);
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

    const { getByText } = render(<StartDestinationPicker {...createProps({ locations: { userLocation, setStart: mockSetStart } })} />);
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

    const { getByText } = render(<StartDestinationPicker {...createProps({ locations: { userLocation, setStart: mockSetStart } })} />);
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

    const { queryByText } = render(<StartDestinationPicker {...createProps()} />);
    // Wait for component to render - no Use Current Location button should appear
    expect(queryByText('Use Current Location')).toBeNull();
  });

  it('shows clear button when start building is selected', async () => {
    const mockPlace = createMockPlace('Start Building', '123 Start St');
    const { UNSAFE_getAllByType } = render(<StartDestinationPicker {...createProps({ locations: { start: mockPlace } })} />);

    await waitFor(() => {
      const TouchableOpacity = require('react-native').TouchableOpacity;
      const clearButtons = UNSAFE_getAllByType(TouchableOpacity);
      expect(clearButtons.length).toBeGreaterThan(0);
    });
  });

  it('clears start building when clear button is pressed', async () => {
    const mockSetStart = jest.fn();
    const { getByTestId } = render(<StartDestinationPicker {...createProps({ locations: { start: createMockPlace('Start Building', '123 Start St'), setStart: mockSetStart } })} />);

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
    const { UNSAFE_getAllByType } = render(<StartDestinationPicker {...createProps({ locations: { destination: mockPlace } })} />);

    await waitFor(() => {
      const TouchableOpacity = require('react-native').TouchableOpacity;
      const clearButtons = UNSAFE_getAllByType(TouchableOpacity);
      expect(clearButtons.length).toBeGreaterThan(0);
    });
  });

  it('clears destination building when clear button is pressed', async () => {
    const mockSetDestination = jest.fn();
    const { getByTestId } = render(<StartDestinationPicker {...createProps({ locations: { start: createMockPlace('Start Building', '123 Start St'), destination: createMockPlace('Destination Building', '456 Dest Ave', 41.8781, -87.6298), setDestination: mockSetDestination } })} />);

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
    render(<StartDestinationPicker {...createProps({ locations: { userLocation } })} />);

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

    const { getByText, UNSAFE_getByType } = render(<StartDestinationPicker {...createProps({ locations: { userLocation } })} />);
    const currentLocationButton = getByText('Current Location');

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
    render(<StartDestinationPicker {...createProps({ locations: { start: mockPlace } })} />);

    await waitFor(() => {
      const calls = (BuildingSelector as jest.Mock).mock.calls;
      const callWithValue = calls.find(call => call[0].value === 'Test Building');
      expect(callWithValue).toBeDefined();
    });
  });

  it('passes value prop to BuildingSelector for destination building', async () => {
    const mockPlace = createMockPlace('Test Destination', '456 Test Ave', 41.8781, -87.6298);
    render(<StartDestinationPicker {...createProps({ locations: { destination: mockPlace } })} />);

    await waitFor(() => {
      const calls = (BuildingSelector as jest.Mock).mock.calls;
      const callWithValue = calls.find(call => call[0].value === 'Test Destination');
      expect(callWithValue).toBeDefined();
    });
  });

  it('renders MaterialIcons for clear buttons', async () => {
    const { UNSAFE_getAllByType } = render(<StartDestinationPicker {...createProps({ locations: { start: createMockPlace('Test Building', '123 Test St') } })} />);

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
    const { UNSAFE_getAllByType } = render(<StartDestinationPicker {...createProps({ locations: { userLocation } })} />);

    const MaterialIcons = require('@expo/vector-icons').MaterialIcons;
    const icons = UNSAFE_getAllByType(MaterialIcons);
    // Check that my-location icon is present
    const locationIcon = icons.find((icon: any) => icon.props.name === 'my-location');
    expect(locationIcon).toBeDefined();
  });

  it('renders Room Selection Mode toggle', () => {
    const { getByText } = render(<StartDestinationPicker {...createProps()} />);
    expect(getByText('Room Selection Mode')).toBeTruthy();
  });

  it('renders Accessibility Mode toggle when setEnabled is provided', () => {
    const mockSetEnableAccessibility = jest.fn();
    const { getByText } = render(
      <StartDestinationPicker
        {...createProps({ accessibility: { enabled: false, setEnabled: mockSetEnableAccessibility } })}
      />
    );
    expect(getByText('Accessibility Mode')).toBeTruthy();
  });

  it('does not render Accessibility Mode toggle when setEnabled is not provided', () => {
    const { queryByText } = render(
      <StartDestinationPicker
        {...createProps({ accessibility: { enabled: false } })}
      />
    );
    expect(queryByText('Accessibility Mode')).toBeNull();
  });

  it('calls setEnableAccessibility when Accessibility toggle is changed', async () => {
    const mockSetEnableAccessibility = jest.fn();
    const { getAllByRole } = render(
      <StartDestinationPicker
        {...createProps({ accessibility: { enabled: false, setEnabled: mockSetEnableAccessibility } })}
      />
    );

    // The second switch is the Accessibility toggle (first is Room Selection Mode)
    const allToggles = getAllByRole('switch');
    
    await act(async () => {
      fireEvent(allToggles[1], 'valueChange', true);
    });

    expect(mockSetEnableAccessibility).toHaveBeenCalledWith(true);
  });

  it('renders Accessibility Mode toggle with active styling when enabled', () => {
    const mockSetEnableAccessibility = jest.fn();
    const { getByText } = render(
      <StartDestinationPicker
        {...createProps({ accessibility: { enabled: true, setEnabled: mockSetEnableAccessibility } })}
      />
    );
    expect(getByText('Accessibility Mode')).toBeTruthy();
  });

  describe('Select on Map buttons', () => {
    const createMapSelectionProps = (target: 'start' | 'destination' | null = null) =>
      createProps({
        mapSelection: {
          target,
          setTarget: jest.fn(),
        },
      });

    it('renders Select on Map button for start when setMapSelectionTarget is provided', () => {
      const { getByTestId } = render(<StartDestinationPicker {...createMapSelectionProps()} />);
      expect(getByTestId('select-start-on-map')).toBeTruthy();
    });

    it('renders Select on Map button for destination when setMapSelectionTarget is provided', () => {
      const { getByTestId } = render(<StartDestinationPicker {...createMapSelectionProps()} />);
      expect(getByTestId('select-destination-on-map')).toBeTruthy();
    });

    it('does not render Select on Map buttons when setMapSelectionTarget is not provided', () => {
      const { queryByTestId } = render(<StartDestinationPicker {...createProps()} />);
      expect(queryByTestId('select-start-on-map')).toBeNull();
      expect(queryByTestId('select-destination-on-map')).toBeNull();
    });

    it('calls setMapSelectionTarget with "start" when start Select on Map is pressed', async () => {
      const props = createMapSelectionProps();
      const { getByTestId } = render(<StartDestinationPicker {...props} />);

      await act(async () => {
        fireEvent.press(getByTestId('select-start-on-map'));
      });

      expect(props.mapSelection.setTarget).toHaveBeenCalledWith('start');
    });

    it('calls setMapSelectionTarget with "destination" when destination Select on Map is pressed', async () => {
      const props = createMapSelectionProps();
      const { getByTestId } = render(<StartDestinationPicker {...props} />);

      await act(async () => {
        fireEvent.press(getByTestId('select-destination-on-map'));
      });

      expect(props.mapSelection.setTarget).toHaveBeenCalledWith('destination');
    });

    it('shows active state for start when mapSelectionTarget is "start"', () => {
      const { getByText } = render(
        <StartDestinationPicker {...createMapSelectionProps('start')} />
      );
      expect(getByText('Selecting...')).toBeTruthy();
    });

    it('shows active state for destination when mapSelectionTarget is "destination"', () => {
      const { getAllByText } = render(
        <StartDestinationPicker {...createMapSelectionProps('destination')} />
      );
      // One "Select on Map" for start, one "Selecting..." for destination
      expect(getAllByText('Select on Map').length).toBe(1);
      expect(getAllByText('Selecting...').length).toBe(1);
    });

    it('toggles off when pressing active Select on Map button', async () => {
      const props = createMapSelectionProps('start');
      const { getByTestId } = render(
        <StartDestinationPicker {...props} />
      );

      await act(async () => {
        fireEvent.press(getByTestId('select-start-on-map'));
      });

      expect(props.mapSelection.setTarget).toHaveBeenCalledWith(null);
    });

    it('toggles off destination when pressing active destination Select on Map button', async () => {
      const props = createMapSelectionProps('destination');
      const { getByTestId } = render(
        <StartDestinationPicker {...props} />
      );

      await act(async () => {
        fireEvent.press(getByTestId('select-destination-on-map'));
      });

      expect(props.mapSelection.setTarget).toHaveBeenCalledWith(null);
    });

    it('shows active state for start with special styling', () => {
      const { getByTestId } = render(
        <StartDestinationPicker {...createMapSelectionProps('start')} />
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

    const { getByText } = render(<StartDestinationPicker {...createProps({ locations: { userLocation, setStart: mockSetStart } })} />);
    await pressCurrentLocationButton(getByText);

    await waitFor(() => {
      expect(mockSetStart).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Only Street',
      }));
    });
  });
  it('renders room selection mode toggle', () => {
    const { getByText } = render(<StartDestinationPicker {...createProps()} />);
    expect(getByText('Room Selection Mode')).toBeTruthy();
  });

  it('calls setEnableRoomSelection when toggle is changed', async () => {
    const mockSetEnableRoomSelection = jest.fn();
    const { getByRole } = render(
      <StartDestinationPicker
        {...createProps({ roomSelection: { enabled: false, setEnabled: mockSetEnableRoomSelection } })}
      />
    );

    const toggle = getByRole('switch');

    await act(async () => {
      fireEvent(toggle, 'valueChange', true);
    });

    expect(mockSetEnableRoomSelection).toHaveBeenCalledWith(true);
  });

  it('renders InlineRoomSelector components when room selection mode is enabled', () => {
    const { getByTestId } = render(
      <StartDestinationPicker
        {...createProps({ roomSelection: { enabled: true, setStartSelection: jest.fn(), setDestinationSelection: jest.fn() } })}
      />
    );

    expect(getByTestId('inline-room-selector-start')).toBeTruthy();
    expect(getByTestId('inline-room-selector-destination')).toBeTruthy();
  });

  it('does not render InlineRoomSelector components when room selection mode is disabled', () => {
    const { queryByTestId } = render(
      <StartDestinationPicker
        {...createProps({ roomSelection: { enabled: false, setStartSelection: jest.fn(), setDestinationSelection: jest.fn() } })}
      />
    );

    expect(queryByTestId('inline-room-selector-start')).toBeNull();
    expect(queryByTestId('inline-room-selector-destination')).toBeNull();
  });

  it('initializes start room selection when selecting a start building in room mode', async () => {
    const mockSetStart = jest.fn();
    const mockSetStartRoomSelection = jest.fn();

    render(
      <StartDestinationPicker
        {...createProps({ locations: { setStart: mockSetStart }, roomSelection: { enabled: true, setStartSelection: mockSetStartRoomSelection } })}
      />
    );

    const onSelectStart = getStartSelector();
    const mockPlace = createMockPlace('Hall Building', '1455 De Maisonneuve Blvd. W.');

    await selectPlace(onSelectStart, mockPlace);

    expect(mockSetStart).toHaveBeenCalledWith(mockPlace);
    expect(mockSetStartRoomSelection).toHaveBeenCalledWith({
      buildingId: 'Hall Building',
      floor: '',
      room: '',
    });
  });

  it('initializes destination room selection when selecting a destination building in room mode', async () => {
    const mockSetDestination = jest.fn();
    const mockSetDestinationRoomSelection = jest.fn();

    render(
      <StartDestinationPicker
        {...createProps({ locations: { setDestination: mockSetDestination }, roomSelection: { enabled: true, setDestinationSelection: mockSetDestinationRoomSelection } })}
      />
    );

    const onSelectDest = getDestinationSelector();
    const mockPlace = createMockPlace('EV Building', '1515 St. Catherine St. W.');

    await selectPlace(onSelectDest, mockPlace);

    expect(mockSetDestination).toHaveBeenCalledWith(mockPlace);
    expect(mockSetDestinationRoomSelection).toHaveBeenCalledWith({
      buildingId: 'EV Building',
      floor: '',
      room: '',
    });
  });

  it('clears start room selection when start building is cleared via selector in room mode', async () => {
    const mockSetStart = jest.fn();
    const mockSetStartRoomSelection = jest.fn();

    render(
      <StartDestinationPicker
        {...createProps({ locations: { setStart: mockSetStart }, roomSelection: { enabled: true, setStartSelection: mockSetStartRoomSelection } })}
      />
    );

    const onSelectStart = getStartSelector();

    await selectPlace(onSelectStart, null);

    expect(mockSetStart).toHaveBeenCalledWith(null);
    expect(mockSetStartRoomSelection).toHaveBeenCalledWith(null);
  });

  it('clears destination room selection when destination building is cleared via selector in room mode', async () => {
    const mockSetDestination = jest.fn();
    const mockSetDestinationRoomSelection = jest.fn();

    render(
      <StartDestinationPicker
        {...createProps({ locations: { setDestination: mockSetDestination }, roomSelection: { enabled: true, setDestinationSelection: mockSetDestinationRoomSelection } })}
      />
    );

    const onSelectDest = getDestinationSelector();

    await selectPlace(onSelectDest, null);

    expect(mockSetDestination).toHaveBeenCalledWith(null);
    expect(mockSetDestinationRoomSelection).toHaveBeenCalledWith(null);
  });
  it('clear start button also clears start room selection', async () => {
    const mockSetStart = jest.fn();
    const mockSetStartRoomSelection = jest.fn();

    const { getByTestId } = render(
      <StartDestinationPicker
        {...createProps({ locations: { start: createMockPlace('Start Building', '123 Start St'), setStart: mockSetStart }, roomSelection: { enabled: false, setStartSelection: mockSetStartRoomSelection } })}
      />
    );

    await act(async () => {
      fireEvent.press(getByTestId('clear-start-button'));
    });

    expect(mockSetStart).toHaveBeenCalledWith(null);
    expect(mockSetStartRoomSelection).toHaveBeenCalledWith(null);
  });

  it('clear destination button also clears destination room selection', async () => {
    const mockSetDestination = jest.fn();
    const mockSetDestinationRoomSelection = jest.fn();

    const { getByTestId } = render(
      <StartDestinationPicker
        {...createProps({ locations: { destination: createMockPlace('Destination Building', '456 Dest Ave'), setDestination: mockSetDestination }, roomSelection: { enabled: false, setDestinationSelection: mockSetDestinationRoomSelection } })}
      />
    );

    await act(async () => {
      fireEvent.press(getByTestId('clear-destination-button'));
    });

    expect(mockSetDestination).toHaveBeenCalledWith(null);
    expect(mockSetDestinationRoomSelection).toHaveBeenCalledWith(null);
  });

  it('renders View Directions button as disabled when canShowDirectionsAction is false', () => {
    const { getByTestId } = render(
      <StartDestinationPicker
        {...createProps({ directionsAction: { canShow: false, onShow: jest.fn() } })}
      />
    );

    const button = getByTestId('view-directions-button');
    expect(button).toBeTruthy();
    // Button should be disabled
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('renders View Directions button as enabled when canShowDirectionsAction is true', () => {
    const { getByTestId } = render(
      <StartDestinationPicker
        {...createProps({ directionsAction: { canShow: true, onShow: jest.fn() } })}
      />
    );

    const button = getByTestId('view-directions-button');
    expect(button).toBeTruthy();
    // Button should be enabled
    expect(button.props.accessibilityState.disabled).toBe(false);
  });

  it('does not render View Directions button when onShowDirections is missing', () => {
    const { queryByTestId } = render(
      <StartDestinationPicker
        {...createProps({ directionsAction: { canShow: true } })}
      />
    );

    expect(queryByTestId('view-directions-button')).toBeNull();
  });

  it('calls onShowDirections when View Directions button is pressed', async () => {
    const mockOnShowDirections = jest.fn();
    const { getByTestId } = render(
      <StartDestinationPicker
        {...createProps({ directionsAction: { canShow: true, onShow: mockOnShowDirections } })}
      />
    );

    await act(async () => {
      fireEvent.press(getByTestId('view-directions-button'));
    });

    expect(mockOnShowDirections).toHaveBeenCalled();
  });
});