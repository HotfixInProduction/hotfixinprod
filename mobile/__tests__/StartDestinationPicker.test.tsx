import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import StartDestinationPicker from '../src/components/BuildingSelector/StartDestinationPicker';
import BuildingSelector from '../src/components/BuildingSelector/BuildingSelector';

// mock this library sice not compatible with Node.js
jest.mock('react-native-config', () => ({
  GOOGLE_MAPS_ANDROID_API_KEY: 'fake-key',
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

// mock The confirm button
jest.mock("../src/components/confirmButton", () => {
  const React = require('react');
  const { TouchableOpacity } = require('react-native')

  return jest.fn((props) => (
    <TouchableOpacity 
      testID="confirm-button" 
      onPress={props.onPress} 
    />
  ));
});

describe('StartDestinationPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  it('renders without crashing', () => {
    const { getByText } = render(<StartDestinationPicker userLocation={null} start={null} destination={null} setStart={jest.fn()} setDestination={jest.fn()} setInstructions={jest.fn()} setConfirmRoute={jest.fn()} />);
    expect(getByText('Start Building')).toBeTruthy();
    expect(getByText('Destination Building')).toBeTruthy();
  });

  it('renders both BuildingSelector components', () => {
    render(<StartDestinationPicker userLocation={null} start={null} destination={null} setStart={jest.fn()} setDestination={jest.fn()} setInstructions={jest.fn()} setConfirmRoute={jest.fn()}/>);
    expect(BuildingSelector).toHaveBeenCalledTimes(2);
  });

  it('passes correct placeholder for start building selector', () => {
    render(<StartDestinationPicker userLocation={null} start={null} destination={null} setStart={jest.fn()} setDestination={jest.fn()} setInstructions={jest.fn()} setConfirmRoute={jest.fn()} />);
    const calls = (BuildingSelector as jest.Mock).mock.calls;
    const startCall = calls.find(call => call[0].placeholder === 'Select start building');
    expect(startCall).toBeDefined();
    expect(startCall[0].placeholder).toBe('Select start building');
  });

  it('passes correct placeholder for destination building selector', () => {
    render(<StartDestinationPicker userLocation={null} start={null} destination={null} setStart={jest.fn()} setDestination={jest.fn()} setInstructions={jest.fn()} setConfirmRoute={jest.fn()} />);
    const calls = (BuildingSelector as jest.Mock).mock.calls;
    const destCall = calls.find(call => call[0].placeholder === 'Select destination building');
    expect(destCall).toBeDefined();
    expect(destCall[0].placeholder).toBe('Select destination building');
  });

  // it('handles start building selection', async () => {
  //   const { getByTestId, getByText } = render(<StartDestinationPicker userLocation={null} start={null} destination={null} setStart={jest.fn()} setDestination={jest.fn()} setInstructions={jest.fn()} setConfirmRoute={jest.fn()} />);
    
  //   // Get the onSelect callback from the mock
  //   const startSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
  //     call => call[0].placeholder === 'Select start building'
  //   );
  //   const onSelectStart = startSelectorCall[0].onSelect;

  //   const mockPlace = {
  //     name: 'Start Building',
  //     address: '123 Start St',
  //     location: { lat: 40.7128, lng: -74.006 },
  //   };

  //   // Simulate selection
  //   await act(async () => {
  //     onSelectStart(mockPlace);
  //   });

  //   await waitFor(() => {
  //     expect(getByText('Selected: Start Building')).toBeTruthy();
  //   });
  // });

  // it('handles destination building selection', async () => {
  //   const { getByTestId, getByText } = render(<StartDestinationPicker userLocation={null} start={null} destination={null} setStart={jest.fn()} setDestination={jest.fn()} setInstructions={jest.fn()} setConfirmRoute={jest.fn()} />);
    
  //   // Get the onSelect callback from the mock
  //   const destSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
  //     call => call[0].placeholder === 'Select destination building'
  //   );
  //   const onSelectDest = destSelectorCall[0].onSelect;

  //   const mockPlace = {
  //     name: 'Destination Building',
  //     address: '456 Dest Ave',
  //     location: { lat: 41.8781, lng: -87.6298 },
  //   };

  //   // Simulate selection
  //   await act(async () => {
  //     onSelectDest(mockPlace);
  //   });

  //   await waitFor(() => {
  //     expect(getByText('Selected: Destination Building')).toBeTruthy();
  //   });
  // });

  // it('logs start building selection in useEffect', async () => {
  //   const { getByTestId } = render(<StartDestinationPicker userLocation={null} start={null} destination={null} setStart={jest.fn()} setDestination={jest.fn()} setInstructions={jest.fn()} setConfirmRoute={jest.fn()} />);
    
  //   const startSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
  //     call => call[0].placeholder === 'Select start building'
  //   );
  //   const onSelectStart = startSelectorCall[0].onSelect;

  //   const mockPlace = {
  //     name: 'Start Building',
  //     address: '123 Start St',
  //     location: { lat: 40.7128, lng: -74.006 },
  //   };

  //   await act(async () => {
  //     onSelectStart(mockPlace);
  //   });

  //   await waitFor(() => {
  //     expect(console.log).toHaveBeenCalledWith('Start building selected:', mockPlace);
  //   });
  // });

  // it('logs destination building selection in useEffect', async () => {
  //   const { getByTestId } = render(<StartDestinationPicker userLocation={null} start={null} destination={null} setStart={jest.fn()} setDestination={jest.fn()} setInstructions={jest.fn()} setConfirmRoute={jest.fn()} />);
    
  //   const destSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
  //     call => call[0].placeholder === 'Select destination building'
  //   );
  //   const onSelectDest = destSelectorCall[0].onSelect;

  //   const mockPlace = {
  //     name: 'Destination Building',
  //     address: '456 Dest Ave',
  //     location: { lat: 41.8781, lng: -87.6298 },
  //   };

  //   await act(async () => {
  //     onSelectDest(mockPlace);
  //   });

  //   await waitFor(() => {
  //     expect(console.log).toHaveBeenCalledWith('Destination building selected:', mockPlace);
  //   });
  // });

  // it('does not show selected text when no building is selected', () => {
  //   const { queryByText } = render(<StartDestinationPicker userLocation={null} start={null} destination={null} setStart={jest.fn()} setDestination={jest.fn()} setInstructions={jest.fn()} setConfirmRoute={jest.fn()} />);
  //   expect(queryByText(/^Selected:/)).toBeNull();
  // });

  // it('handles multiple selections for start building', async () => {
  //   const { getByText, queryByText } = render(<StartDestinationPicker userLocation={null} start={null} destination={null} setStart={jest.fn()} setDestination={jest.fn()} setInstructions={jest.fn()} setConfirmRoute={jest.fn()} />);
    
  //   const startSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
  //     call => call[0].placeholder === 'Select start building'
  //   );
  //   const onSelectStart = startSelectorCall[0].onSelect;

  //   // First selection
  //   const mockPlace1 = {
  //     name: 'First Building',
  //     address: '123 First St',
  //     location: { lat: 40.7128, lng: -74.006 },
  //   };
  //   await act(async () => {
  //     onSelectStart(mockPlace1);
  //   });

  //   await waitFor(() => {
  //     expect(getByText('Selected: First Building')).toBeTruthy();
  //   });

  //   // Second selection
  //   const mockPlace2 = {
  //     name: 'Second Building',
  //     address: '456 Second St',
  //     location: { lat: 41.8781, lng: -87.6298 },
  //   };
  //   await act(async () => {
  //     onSelectStart(mockPlace2);
  //   });

  //   await waitFor(() => {
  //     expect(getByText('Selected: Second Building')).toBeTruthy();
  //     expect(queryByText('Selected: First Building')).toBeNull();
  //   });
  // });

  // it('handles independent selections for start and destination', async () => {
  //   const { getByText } = render(<StartDestinationPicker userLocation={null} start={null} destination={null} setStart={jest.fn()} setDestination={jest.fn()} setInstructions={jest.fn()} setConfirmRoute={jest.fn()} />);
    
  //   const startSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
  //     call => call[0].placeholder === 'Select start building'
  //   );
  //   const destSelectorCall = (BuildingSelector as jest.Mock).mock.calls.find(
  //     call => call[0].placeholder === 'Select destination building'
  //   );

  //   const onSelectStart = startSelectorCall[0].onSelect;
  //   const onSelectDest = destSelectorCall[0].onSelect;

  //   const startPlace = {
  //     name: 'Start Building',
  //     address: '123 Start St',
  //     location: { lat: 40.7128, lng: -74.006 },
  //   };

  //   const destPlace = {
  //     name: 'Destination Building',
  //     address: '456 Dest Ave',
  //     location: { lat: 41.8781, lng: -87.6298 },
  //   };

  //   await act(async () => {
  //     onSelectStart(startPlace);
  //     onSelectDest(destPlace);
  //   });

  //   await waitFor(() => {
  //     expect(getByText('Selected: Start Building')).toBeTruthy();
  //     expect(getByText('Selected: Destination Building')).toBeTruthy();
  //   });
  // });

  it('applies correct styles to container', () => {
    const { getByText } = render(<StartDestinationPicker userLocation={null} start={null} destination={null} setStart={jest.fn()} setDestination={jest.fn()} setInstructions={jest.fn()} setConfirmRoute={jest.fn()} />);
    const container = getByText('Start Building').parent?.parent;
    expect(container?.props.style).toBeDefined();
  });

  it('applies correct styles to labels', () => {
    const { getByText } = render(<StartDestinationPicker userLocation={null} start={null} destination={null} setStart={jest.fn()} setDestination={jest.fn()} setInstructions={jest.fn()} setConfirmRoute={jest.fn()} />);
    const startLabel = getByText('Start Building');
    const destLabel = getByText('Destination Building');
    
    expect(startLabel.props.style).toBeDefined();
    expect(destLabel.props.style).toBeDefined();
  });

  it('fecthes instructions from google and updates instructions', async () => {
    const start = {name : "Hall Building", address: "1455 De Maisonneuve Blvd. W.", location: {lat: 45.497285416040164, lng: -73.57897485280246}}
    const destination = {name : "Hall Building", address: "1455 De Maisonneuve Blvd. W.", location: {lat: 45.497285416040164, lng: -73.57897485280246}}

    const instructions = [{ html_instructions: 'Turn left', distance: { text: '4km' } }];

    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            routes: [{
                legs: [
                  { steps: instructions, },
                ],
              },
            ],
          }),
      }),
    ) as jest.Mock;

    const mockSetInstructions = jest.fn();
    const mockConfirmRoute = jest.fn();
    const { getByTestId } = render(<StartDestinationPicker userLocation={null} start={start} destination={destination} setStart={jest.fn()} setDestination={jest.fn()} setInstructions={mockSetInstructions} setConfirmRoute={mockConfirmRoute} />);
    const confirmButton = getByTestId('confirm-button');
    fireEvent.press(confirmButton);

    await waitFor(()=> {
      expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining("origin=45.497285416040164,-73.57897485280246&destination=45.497285416040164,-73.57897485280246"));
      expect(mockSetInstructions).toHaveBeenCalledWith(instructions);
      expect(mockConfirmRoute).toHaveBeenCalledWith(true);
    });

  });

});