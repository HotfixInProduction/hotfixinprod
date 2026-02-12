import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import StartDestinationPicker from '../src/components/BuildingSelector/StartDestinationPicker';
import BuildingSelector from '../src/components/BuildingSelector/BuildingSelector';
import ConfirmButton from '../src/components/confirmButton';

// 1. Mock BuildingSelector to trigger the onSelect prop easily
jest.mock('../src/components/BuildingSelector/BuildingSelector', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return jest.fn((props) => {
    return React.createElement(
      TouchableOpacity, 
      { 
        testID: `selector-${props.placeholder.replace(/\s+/g, '-')}`,
        onPress: () => props.onSelect({
          name: 'Mock Building',
          address: '123 Mock St',
          location: { lat: 1, lng: 1 }
        })
      },
      React.createElement(Text, null, props.placeholder)
    );
  });
});

// 2. Mock Config and Fetch
jest.mock('react-native-config', () => ({
  GOOGLE_MAPS_ANDROID_API_KEY: 'mock-key',
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      routes: [{ legs: [{ steps: ['Step 1', 'Step 2'] }] }]
    }),
  })
) as jest.Mock;

describe('StartDestinationPicker', () => {
  // Define mock props
  const mockProps = {
    userLocation: null,
    start: null,
    destination: null,
    setStart: jest.fn(),
    setDestination: jest.fn(),
    setConfirmRoute: jest.fn(),
    setInstructions: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with labels', () => {
    const { getByText } = render(<StartDestinationPicker {...mockProps} />);
    expect(getByText('Start Building')).toBeTruthy();
    expect(getByText('Destination Building')).toBeTruthy();
  });

  it('calls setStart when start building is selected', () => {
    const { getByTestId } = render(<StartDestinationPicker {...mockProps} />);
    
    // Trigger the mock BuildingSelector's onPress
    fireEvent.press(getByTestId('selector-Select-start-building'));

    expect(mockProps.setStart).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Mock Building'
    }));
  });

  it('calls setDestination when destination building is selected', () => {
    const { getByTestId } = render(<StartDestinationPicker {...mockProps} />);
    
    fireEvent.press(getByTestId('selector-Select-destination-building'));

    expect(mockProps.setDestination).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Mock Building'
    }));
  });

  it('displays the selected building name when start prop is provided', () => {
    const startPlace = { name: 'Hall Building', address: '...', location: { lat: 1, lng: 1 } };
    const { getByText } = render(
      <StartDestinationPicker {...mockProps} start={startPlace} />
    );
    expect(getByText('Selected: Hall Building')).toBeTruthy();
  });

  it('calls setConfirmRoute and setInstructions when ConfirmButton is pressed', async () => {
    const start = { name: 'A', address: 'A', location: { lat: 1, lng: 1 } };
    const destination = { name: 'B', address: 'B', location: { lat: 2, lng: 2 } };
    
    // Render with start and destination so handleDirections can proceed
    const { getByRole } = render(
      <StartDestinationPicker {...mockProps} start={start} destination={destination} />
    );

    // Assuming ConfirmButton renders something with a pressable role or you can add a testID
    // For now, we'll find by type if you don't have a testID on ConfirmButton
    const confirmBtn = render(<StartDestinationPicker {...mockProps} start={start} destination={destination} />).root;
    
    // Use act because handleDirections is async and updates state/calls setters
    await act(async () => {
        fireEvent.press(confirmBtn.findByType(require('../src/components/confirmButton').default));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(mockProps.setInstructions).toHaveBeenCalledWith(['Step 1', 'Step 2']);
      expect(mockProps.setConfirmRoute).toHaveBeenCalledWith(true);
    });
  });
});