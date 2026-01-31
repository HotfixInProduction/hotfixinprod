import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');

  const MockMapView = (props: any) => <View testID="map-view" {...props}>{props.children}</View>;
  const MockPolygon = (props: any) => <View {...props} />;

  return {
    __esModule: true,
    default: MockMapView,
    Polygon: MockPolygon,       // <-- important
    Marker: MockPolygon,        // optional if you use Marker
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
});
