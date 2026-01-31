import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from '../App';
import * as Location from 'expo-location';

// Mock Expo Location to avoid hitting native APIs during tests
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 45.5, longitude: -73.58 },
  }),
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native');
  const MockMapView = React.forwardRef((props: any, ref: React.Ref<any>) => {
    React.useImperativeHandle(ref, () => ({
      animateToRegion: jest.fn(),
    }));
    return <View testID="map-view" {...props} />;
  });
  return {
    __esModule: true,
    default: MockMapView,
    PROVIDER_GOOGLE: 'google',
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
  afterEach(() => {
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

  it('alerts when location permission is denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Location needed',
        'Please allow location so we can show where you are on the map.'
      );
    });

    alertSpy.mockRestore();
  });
});
