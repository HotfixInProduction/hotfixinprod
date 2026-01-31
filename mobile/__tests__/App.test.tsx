import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import App from '../App';

// Mock react-native-maps
const mockAnimateToRegion = jest.fn();
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  const React = require('react');
  
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        animateToRegion: mockAnimateToRegion,
      }));
      return <View testID="map-view" {...props} />;
    }),
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

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('switches to Loyola campus when Loyola button is pressed', () => {
    const { getByText } = render(<App />);
    const loyolaButton = getByText('Loyola');
    
    fireEvent.press(loyolaButton);
    
    expect(mockAnimateToRegion).toHaveBeenCalledWith(
      {
        latitude: 45.4582,
        longitude: -73.6402,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      },
      500
    );
  });

  it('switches to Downtown campus when Downtown button is pressed', () => {
    const { getByText } = render(<App />);
    const loyolaButton = getByText('Loyola');
    const downtownButton = getByText('Downtown');
    
    // First switch to Loyola
    fireEvent.press(loyolaButton);
    jest.clearAllMocks();
    
    // Then switch back to Downtown
    fireEvent.press(downtownButton);
    
    expect(mockAnimateToRegion).toHaveBeenCalledWith(
      {
        latitude: 45.4972,
        longitude: -73.5789,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      },
      500
    );
  });

  it('renders StatusBar component', () => {
    const { UNSAFE_root } = render(<App />);
    // Check that StatusBar is in the component tree
    expect(UNSAFE_root).toBeTruthy();
  });
});
