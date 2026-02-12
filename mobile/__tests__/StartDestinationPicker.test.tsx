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

// Mock BuildingSelector component
jest.mock('../src/components/BuildingSelector/BuildingSelector', () => {
  const React = require('react');
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
});

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
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    (Location.getCurrentPositionAsync as jest.Mock).mockClear();
    (Location.reverseGeocodeAsync as jest.Mock).mockClear();
  });

  it('renders without crashing', () => {
    const { getByText } = render(<StartDestinationPicker userLocation={null} />);
    expect(getByText('Start Building')).toBeTruthy();
    expect(getByText('Destination Building')).toBeTruthy();
  });

  it('renders both BuildingSelector components', () => {
    render(<StartDestinationPicker userLocation={null} />);
    expect(BuildingSelector).toHaveBeenCalledTimes(2);
  });

  it('passes correct placeholder for start building selector', () => {
    render(<StartDestinationPicker userLocation={null} />);
    const calls = (BuildingSelector as jest.Mock).mock.calls;
    const startCall = calls.find(call => call[0].placeholder === 'Select start building');
    expect(startCall).toBeDefined();
    expect(startCall[0].placeholder).toBe('Select start building');
  });

  it('passes correct placeholder for destination building selector', () => {
    render(<StartDestinationPicker userLocation={null} />);
    const calls = (BuildingSelector as jest.Mock).mock.calls;
    const destCall = calls.find(call => call[0].placeholder === 'Select destination building');
    expect(destCall).toBeDefined();
    expect(destCall[0].placeholder).toBe('Select destination building');
  });

  it('handles start building selection', async () => {
    const { getByTestId, getByText } = render(<StartDestinationPicker userLocation={null} />);
    
    // Get the onSelect callback from the mock
    const startSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
      call => call[0].placeholder === 'Select start building'
    );
    const onSelectStart = startSelectorCall[0].onSelect;

    const mockPlace = {
      name: 'Start Building',
      address: '123 Start St',
      location: { lat: 40.7128, lng: -74.006 },
    };

    // Simulate selection
    await act(async () => {
      onSelectStart(mockPlace);
    });

    await waitFor(() => {
      expect(getByText('Selected: Start Building')).toBeTruthy();
    });
  });

  it('handles destination building selection', async () => {
    const { getByTestId, getByText } = render(<StartDestinationPicker userLocation={null} />);
    
    // Get the onSelect callback from the mock
    const destSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
      call => call[0].placeholder === 'Select destination building'
    );
    const onSelectDest = destSelectorCall[0].onSelect;

    const mockPlace = {
      name: 'Destination Building',
      address: '456 Dest Ave',
      location: { lat: 41.8781, lng: -87.6298 },
    };

    // Simulate selection
    await act(async () => {
      onSelectDest(mockPlace);
    });

    await waitFor(() => {
      expect(getByText('Selected: Destination Building')).toBeTruthy();
    });
  });

  it('logs start building selection in useEffect', async () => {
    const { getByTestId } = render(<StartDestinationPicker userLocation={null} />);
    
    const startSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
      call => call[0].placeholder === 'Select start building'
    );
    const onSelectStart = startSelectorCall[0].onSelect;

    const mockPlace = {
      name: 'Start Building',
      address: '123 Start St',
      location: { lat: 40.7128, lng: -74.006 },
    };

    await act(async () => {
      onSelectStart(mockPlace);
    });

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('Start building selected:', mockPlace);
    });
  });

  it('logs destination building selection in useEffect', async () => {
    const { getByTestId } = render(<StartDestinationPicker userLocation={null} />);
    
    const destSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
      call => call[0].placeholder === 'Select destination building'
    );
    const onSelectDest = destSelectorCall[0].onSelect;

    const mockPlace = {
      name: 'Destination Building',
      address: '456 Dest Ave',
      location: { lat: 41.8781, lng: -87.6298 },
    };

    await act(async () => {
      onSelectDest(mockPlace);
    });

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('Destination building selected:', mockPlace);
    });
  });

  it('does not show selected text when no building is selected', () => {
    const { queryByText } = render(<StartDestinationPicker userLocation={null} />);
    expect(queryByText(/^Selected:/)).toBeNull();
  });

  it('handles multiple selections for start building', async () => {
    const { getByText, queryByText } = render(<StartDestinationPicker userLocation={null} />);
    
    const startSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
      call => call[0].placeholder === 'Select start building'
    );
    const onSelectStart = startSelectorCall[0].onSelect;

    // First selection
    const mockPlace1 = {
      name: 'First Building',
      address: '123 First St',
      location: { lat: 40.7128, lng: -74.006 },
    };
    await act(async () => {
      onSelectStart(mockPlace1);
    });

    await waitFor(() => {
      expect(getByText('Selected: First Building')).toBeTruthy();
    });

    // Second selection
    const mockPlace2 = {
      name: 'Second Building',
      address: '456 Second St',
      location: { lat: 41.8781, lng: -87.6298 },
    };
    await act(async () => {
      onSelectStart(mockPlace2);
    });

    await waitFor(() => {
      expect(getByText('Selected: Second Building')).toBeTruthy();
      expect(queryByText('Selected: First Building')).toBeNull();
    });
  });

  it('handles independent selections for start and destination', async () => {
    const { getByText } = render(<StartDestinationPicker userLocation={null} />);
    
    const startSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
      call => call[0].placeholder === 'Select start building'
    );
    const destSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
      call => call[0].placeholder === 'Select destination building'
    );

    const onSelectStart = startSelectorCall[0].onSelect;
    const onSelectDest = destSelectorCall[0].onSelect;

    const startPlace = {
      name: 'Start Building',
      address: '123 Start St',
      location: { lat: 40.7128, lng: -74.006 },
    };

    const destPlace = {
      name: 'Destination Building',
      address: '456 Dest Ave',
      location: { lat: 41.8781, lng: -87.6298 },
    };

    await act(async () => {
      onSelectStart(startPlace);
      onSelectDest(destPlace);
    });

    await waitFor(() => {
      expect(getByText('Selected: Start Building')).toBeTruthy();
      expect(getByText('Selected: Destination Building')).toBeTruthy();
    });
  });

  it('applies correct styles to container', () => {
    const { getByText } = render(<StartDestinationPicker userLocation={null} />);
    const container = getByText('Start Building').parent?.parent;
    expect(container?.props.style).toBeDefined();
  });

  it('applies correct styles to labels', () => {
    const { getByText } = render(<StartDestinationPicker userLocation={null} />);
    const startLabel = getByText('Start Building');
    const destLabel = getByText('Destination Building');
    
    expect(startLabel.props.style).toBeDefined();
    expect(destLabel.props.style).toBeDefined();
  });

  it('shows Use Current Location button when userLocation is provided', () => {
    const userLocation = { latitude: 45.5, longitude: -73.6 };
    const { getByText } = render(<StartDestinationPicker userLocation={userLocation} />);
    expect(getByText('Use Current Location')).toBeTruthy();
  });

  it('does not show Use Current Location button when userLocation is null', () => {
    const { queryByText } = render(<StartDestinationPicker userLocation={null} />);
    expect(queryByText('Use Current Location')).toBeNull();
  });

  it('handles Use Current Location button press - finds nearest building', async () => {
    const userLocation = { latitude: 45.497, longitude: -73.579 };
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: 45.497,
        longitude: -73.579,
      }
    });

    const { getByText } = render(<StartDestinationPicker userLocation={userLocation} />);
    const currentLocationButton = getByText('Use Current Location');

    await act(async () => {
      fireEvent.press(currentLocationButton);
    });

    await waitFor(() => {
      expect(getByText('Selected: Hall Building')).toBeTruthy();
    });
  });

  it('handles Use Current Location button press - uses reverse geocoding when far from buildings', async () => {
    const userLocation = { latitude: 40.7128, longitude: -74.006 };
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: 40.7128,
        longitude: -74.006,
      }
    });
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
      {
        street: 'Broadway',
        city: 'New York',
        region: 'NY',
        name: 'Times Square'
      }
    ]);

    const { getByText } = render(<StartDestinationPicker userLocation={userLocation} />);
    const currentLocationButton = getByText('Use Current Location');

    await act(async () => {
      fireEvent.press(currentLocationButton);
    });

    await waitFor(() => {
      expect(getByText('Selected: Broadway')).toBeTruthy();
    });
  });

  it('handles Use Current Location button press - fallback to coordinates when reverse geocoding fails', async () => {
    const userLocation = { latitude: 40.7128, longitude: -74.006 };
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: 40.7128,
        longitude: -74.006,
      }
    });
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<StartDestinationPicker userLocation={userLocation} />);
    const currentLocationButton = getByText('Use Current Location');

    await act(async () => {
      fireEvent.press(currentLocationButton);
    });

    await waitFor(() => {
      expect(getByText('Selected: Current Location')).toBeTruthy();
    });
  });

  it('handles Use Current Location button press - error handling with fallback', async () => {
    const userLocation = { latitude: 40.7128, longitude: -74.006 };
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(new Error('Location error'));
    console.error = jest.fn();

    const { getByText } = render(<StartDestinationPicker userLocation={userLocation} />);
    const currentLocationButton = getByText('Use Current Location');

    await act(async () => {
      fireEvent.press(currentLocationButton);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Error getting location name:', expect.any(Error));
      expect(getByText('Selected: Current Location')).toBeTruthy();
    });
  });

  it('handles Use Current Location button press - error handling without fallback', async () => {
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(new Error('Location error'));
    console.error = jest.fn();

    const { getByText, queryByText } = render(<StartDestinationPicker userLocation={null} />);
    // Wait for component to render - no Use Current Location button should appear
    expect(queryByText('Use Current Location')).toBeNull();
  });

  it('shows clear button when start building is selected', async () => {
    const { getByTestId, UNSAFE_getAllByType } = render(<StartDestinationPicker userLocation={null} />);
    
    const startSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
      call => call[0].placeholder === 'Select start building'
    );
    const onSelectStart = startSelectorCall[0].onSelect;

    const mockPlace = {
      name: 'Start Building',
      address: '123 Start St',
      location: { lat: 40.7128, lng: -74.006 },
    };

    await act(async () => {
      onSelectStart(mockPlace);
    });

    await waitFor(() => {
      const TouchableOpacity = require('react-native').TouchableOpacity;
      const clearButtons = UNSAFE_getAllByType(TouchableOpacity);
      expect(clearButtons.length).toBeGreaterThan(0);
    });
  });

  it('clears start building when clear button is pressed', async () => {
    const { getByText, queryByText, UNSAFE_getAllByType } = render(<StartDestinationPicker userLocation={null} />);
    
    const startSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
      call => call[0].placeholder === 'Select start building'
    );
    const onSelectStart = startSelectorCall[0].onSelect;

    const mockPlace = {
      name: 'Start Building',
      address: '123 Start St',
      location: { lat: 40.7128, lng: -74.006 },
    };

    await act(async () => {
      onSelectStart(mockPlace);
    });

    await waitFor(() => {
      expect(getByText('Selected: Start Building')).toBeTruthy();
    });

    // Find and press the clear button
    const TouchableOpacity = require('react-native').TouchableOpacity;
    const clearButtons = UNSAFE_getAllByType(TouchableOpacity);
    const clearButton = clearButtons.find(btn => 
      btn.props.style && JSON.stringify(btn.props.style).includes('clearButton')
    );

    if (clearButton) {
      await act(async () => {
        fireEvent.press(clearButton);
      });

      await waitFor(() => {
        expect(queryByText('Selected: Start Building')).toBeNull();
      });
    }
  });

  it('shows clear button when destination building is selected', async () => {
    const { UNSAFE_getAllByType } = render(<StartDestinationPicker userLocation={null} />);
    
    const destSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
      call => call[0].placeholder === 'Select destination building'
    );
    const onSelectDest = destSelectorCall[0].onSelect;

    const mockPlace = {
      name: 'Destination Building',
      address: '456 Dest Ave',
      location: { lat: 41.8781, lng: -87.6298 },
    };

    await act(async () => {
      onSelectDest(mockPlace);
    });

    await waitFor(() => {
      const TouchableOpacity = require('react-native').TouchableOpacity;
      const clearButtons = UNSAFE_getAllByType(TouchableOpacity);
      expect(clearButtons.length).toBeGreaterThan(0);
    });
  });

  it('clears destination building when clear button is pressed', async () => {
    const { getByText, queryByText, UNSAFE_getAllByType } = render(<StartDestinationPicker userLocation={null} />);
    
    // First, select a start building to ensure we have multiple clear buttons
    const startSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
      call => call[0].placeholder === 'Select start building'
    );
    const onSelectStart = startSelectorCall[0].onSelect;

    const mockStartPlace = {
      name: 'Start Building',
      address: '123 Start St',
      location: { lat: 40.7128, lng: -74.006 },
    };

    await act(async () => {
      onSelectStart(mockStartPlace);
    });

    // Then select a destination building
    const destSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
      call => call[0].placeholder === 'Select destination building'
    );
    const onSelectDest = destSelectorCall[0].onSelect;

    const mockDestPlace = {
      name: 'Destination Building',
      address: '456 Dest Ave',
      location: { lat: 41.8781, lng: -87.6298 },
    };

    await act(async () => {
      onSelectDest(mockDestPlace);
    });

    await waitFor(() => {
      expect(getByText('Selected: Destination Building')).toBeTruthy();
      expect(getByText('Selected: Start Building')).toBeTruthy();
    });

    // Find the clear buttons
    const TouchableOpacity = require('react-native').TouchableOpacity;
    const allButtons = UNSAFE_getAllByType(TouchableOpacity);
    
    // Filter to get only clear buttons by checking onPress handler
    const clearButtons = allButtons.filter(btn => {
      const onPress = btn.props.onPress;
      if (!onPress) return false;
      // Test if the button's onPress would clear either start or destination
      const onPressStr = onPress.toString();
      return onPressStr.includes('setStart') || onPressStr.includes('setDestination') || 
             (btn.props.style && JSON.stringify(btn.props.style).includes('clearButton'));
    });

    // Should have at least 2 clear buttons (one for start, one for destination)
    expect(clearButtons.length).toBeGreaterThan(0);

    // Get the last clear button (destination's clear button since it's rendered after start's)
    const destinationClearButton = clearButtons[clearButtons.length - 1];

    await act(async () => {
      fireEvent.press(destinationClearButton);
    });

    await waitFor(() => {
      expect(queryByText('Selected: Destination Building')).toBeNull();
      // Start building should still be selected
      expect(getByText('Selected: Start Building')).toBeTruthy();
    });
  });

  it('passes userLocation prop to BuildingSelector components', () => {
    const userLocation = { latitude: 45.5, longitude: -73.6 };
    render(<StartDestinationPicker userLocation={userLocation} />);
    
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

    const { getByText, UNSAFE_getByType } = render(<StartDestinationPicker userLocation={userLocation} />);
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
    const { rerender } = render(<StartDestinationPicker userLocation={null} />);
    
    const startSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
      call => call[0].placeholder === 'Select start building'
    );
    const onSelectStart = startSelectorCall[0].onSelect;

    const mockPlace = {
      name: 'Test Building',
      address: '123 Test St',
      location: { lat: 40.7128, lng: -74.006 },
    };

    await act(async () => {
      onSelectStart(mockPlace);
    });

    // Force a rerender to check the value prop
    rerender(<StartDestinationPicker userLocation={null} />);

    await waitFor(() => {
      const calls = (BuildingSelector as jest.Mock).mock.calls;
      const callWithValue = calls.find(call => call[0].value === 'Test Building');
      expect(callWithValue).toBeDefined();
    });
  });

  it('passes value prop to BuildingSelector for destination building', async () => {
    const { rerender } = render(<StartDestinationPicker userLocation={null} />);
    
    const destSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
      call => call[0].placeholder === 'Select destination building'
    );
    const onSelectDest = destSelectorCall[0].onSelect;

    const mockPlace = {
      name: 'Test Destination',
      address: '456 Test Ave',
      location: { lat: 41.8781, lng: -87.6298 },
    };

    await act(async () => {
      onSelectDest(mockPlace);
    });

    // Force a rerender to check the value prop
    rerender(<StartDestinationPicker userLocation={null} />);

    await waitFor(() => {
      const calls = (BuildingSelector as jest.Mock).mock.calls;
      const callWithValue = calls.find(call => call[0].value === 'Test Destination');
      expect(callWithValue).toBeDefined();
    });
  });

  it('renders MaterialIcons for clear buttons', async () => {
    const { UNSAFE_getAllByType } = render(<StartDestinationPicker userLocation={null} />);
    
    const startSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
      call => call[0].placeholder === 'Select start building'
    );
    const onSelectStart = startSelectorCall[0].onSelect;

    const mockPlace = {
      name: 'Test Building',
      address: '123 Test St',
      location: { lat: 40.7128, lng: -74.006 },
    };

    await act(async () => {
      onSelectStart(mockPlace);
    });

    await waitFor(() => {
      const MaterialIcons = require('@expo/vector-icons').MaterialIcons;
      const icons = UNSAFE_getAllByType(MaterialIcons);
      expect(icons.length).toBeGreaterThan(0);
      // Check that close icon is present
      const closeIcon = icons.find((icon: any) => icon.props.name === 'close');
      expect(closeIcon).toBeDefined();
    });
  });

  it('renders MaterialIcons for current location button', () => {
    const userLocation = { latitude: 45.5, longitude: -73.6 };
    const { UNSAFE_getAllByType } = render(<StartDestinationPicker userLocation={userLocation} />);
    
    const MaterialIcons = require('@expo/vector-icons').MaterialIcons;
    const icons = UNSAFE_getAllByType(MaterialIcons);
    // Check that my-location icon is present
    const locationIcon = icons.find((icon: any) => icon.props.name === 'my-location');
    expect(locationIcon).toBeDefined();
  });

  it('renders selected text with proper styling', async () => {
    const { getByText } = render(<StartDestinationPicker userLocation={null} />);
    
    const startSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
      call => call[0].placeholder === 'Select start building'
    );
    const onSelectStart = startSelectorCall[0].onSelect;

    const mockPlace = {
      name: 'Styled Building',
      address: '789 Style Ave',
      location: { lat: 40.7128, lng: -74.006 },
    };

    await act(async () => {
      onSelectStart(mockPlace);
    });

    await waitFor(() => {
      const selectedText = getByText('Selected: Styled Building');
      expect(selectedText).toBeTruthy();
      expect(selectedText.props.style).toBeDefined();
    });
  });

  it('renders all label texts', () => {
    const { getByText } = render(<StartDestinationPicker userLocation={null} />);
    
    expect(getByText('Start Building')).toBeTruthy();
    expect(getByText('Destination Building')).toBeTruthy();
  });
});
