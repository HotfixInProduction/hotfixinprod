import React from 'react';
import { render } from '@testing-library/react-native';
import { act } from 'react';
import BuildingPolygon from '../src/components/BuildingPolygon';

// Mock expo-location
const mockWatchPositionAsync = jest.fn();
const mockGetForegroundPermissionsAsync = jest.fn();

jest.mock('expo-location', () => ({
  watchPositionAsync: (...args: any[]) => mockWatchPositionAsync(...args),
  getForegroundPermissionsAsync: (...args: any[]) => mockGetForegroundPermissionsAsync(...args),
  Accuracy: { High: 4 },
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Polygon: (props: any) => <View {...props} />,
  };
});

describe('BuildingPolygon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockWatchPositionAsync.mockResolvedValue({ remove: jest.fn() });
  });

  it('renders building polygons', () => {
    const { UNSAFE_getAllByType } = render(<BuildingPolygon />);
    const polygons = UNSAFE_getAllByType(require('react-native-maps').Polygon);
    
    expect(polygons.length).toBeGreaterThan(0);
  });

  it('changes building color when user is inside', async () => {
    let locationCallback: any;
    mockWatchPositionAsync.mockImplementation((config, callback) => {
      locationCallback = callback;
      return Promise.resolve({ remove: jest.fn() });
    });

    const { UNSAFE_getAllByType } = render(<BuildingPolygon />);
    await new Promise(resolve => setTimeout(resolve, 10));

    // Simulate user inside Hall Building (center point)
    await act(async () => {
      locationCallback({
        coords: { latitude: 45.49727, longitude: -73.57866 },
      });
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const polygons = UNSAFE_getAllByType(require('react-native-maps').Polygon);
    
    // Find the Hall Building polygon (first one in the buildings array)
    const hallBuilding = polygons.find((p: any) => 
      p.props.coordinates[0].latitude > 45.496 && p.props.coordinates[0].latitude < 45.498
    );
    
    expect(hallBuilding.props.strokeColor).toBe('#0000FF');
  });
});