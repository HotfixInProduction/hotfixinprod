import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import StartDestinationPicker from '../src/components/BuildingSelector/StartDestinationPicker';
import BuildingSelector from '../src/components/BuildingSelector/BuildingSelector';

// mock this library sice not compatible with Node.js
jest.mock('react-native-config', () => ({
  GOOGLE_MAPS_ANDROID_API_KEY: 'fake-key',
}));

// Mock BuildingSelector component
jest.mock('../src/components/BuildingSelector/BuildingSelector', () => require('./utils/testUtils').createBuildingSelectorMock());

describe('StartDestinationPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  const defaultStartDestProps = {
    userLocation: null,
    start: null,
    destination: null,
    setStart: jest.fn(),
    setDestination: jest.fn(),
    setInstructions: jest.fn(),
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

    expect(mockSetStart).toHaveBeenCalledWith(mockPlace);
  });

  it('handles destination building selection', async () => {
    const mockSetDestination = jest.fn();
    render(<StartDestinationPicker {...defaultStartDestProps }setDestination={mockSetDestination} />);
    
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

    expect(mockSetDestination).toHaveBeenCalledWith(mockPlace);
  });

  it('handles multiple selections for start building', async () => {
    const mockSetStart = jest.fn();
    render(<StartDestinationPicker {...defaultStartDestProps} setStart={mockSetStart}  />);
    
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

    expect(mockSetStart).toHaveBeenNthCalledWith(1, mockPlace1);

    // Second selection
    const mockPlace2 = {
      name: 'Second Building',
      address: '456 Second St',
      location: { lat: 41.8781, lng: -87.6298 },
    };
    await act(async () => {
      onSelectStart(mockPlace2);
    });

    expect(mockSetStart).toHaveBeenNthCalledWith(2, mockPlace2);
  });

  it('handles independent selections for start and destination', async () => {
    const mockSetStart = jest.fn();
    const mockSetDestination = jest.fn();
    render(<StartDestinationPicker {...defaultStartDestProps} setStart={mockSetStart} setDestination={mockSetDestination}  />);
    
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

    expect(mockSetStart).toHaveBeenCalledWith(startPlace);
    expect(mockSetDestination).toHaveBeenCalledWith(destPlace);
  });

  it('fetches instructions from google and updates instructions', async () => {
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
    render(<StartDestinationPicker {...defaultStartDestProps} start={start} destination={destination} setInstructions={mockSetInstructions} />);

    await waitFor(()=> {
      expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining("origin=45.497285416040164%2C-73.57897485280246&destination=45.497285416040164%2C-73.57897485280246"));
      expect(mockSetInstructions).toHaveBeenCalledWith(instructions);
    });
  });

  it('fetches instructions but fetch fails', async () => {
    const start = {name : "Hall Building", address: "1455 De Maisonneuve Blvd. W.", location: {lat: 45.497285416040164, lng: -73.57897485280246}}
    const destination = {name : "Hall Building", address: "1455 De Maisonneuve Blvd. W.", location: {lat: 45.497285416040164, lng: -73.57897485280246}}

    globalThis.fetch = jest.fn(() =>
      Promise.reject(new Error("Something with the network went wrong"))
    ) as jest.Mock;
    console.error = jest.fn();

    const mockSetInstructions = jest.fn();
    render(<StartDestinationPicker {...defaultStartDestProps} start={start} destination={destination} setStart={jest.fn()} setInstructions={mockSetInstructions} />);

    await waitFor(()=> {
      expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining("origin=45.497285416040164%2C-73.57897485280246&destination=45.497285416040164%2C-73.57897485280246"));
      expect(mockSetInstructions).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith("Fetch failed", new Error("Something with the network went wrong"));
    });
  });
});