import { render } from '@testing-library/react-native';
import React from 'react';

// Mock buildings with a building that has coordinates
jest.mock('../src/data/buildings', () => ({
  buildings: [
    {
      id: 'Test Building',
      label: 'TB',
      labelCoord: { latitude: 45.497, longitude: -73.579 },
      address: 'Test Address',
      coordinates: [
        { latitude: 45.497, longitude: -73.579 },
        { latitude: 45.498, longitude: -73.579 },
        { latitude: 45.498, longitude: -73.578 },
        { latitude: 45.497, longitude: -73.578 }
      ]
    }
  ]
}));

jest.mock('expo-location', () => ({
  watchPositionAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  Accuracy: {
    High: 4,
    BestForNavigation: 5
  },
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Polygon: (props: any) => <View {...props} />,
    Marker: (props: any) => React.createElement(View, { ...props }),
  };
});

import BuildingPolygon from '../src/components/BuildingPolygon';

describe('BuildingPolygon - with coordinates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders building marker when zoomed in enough', () => {
    const { queryByTestId } = render(
      <BuildingPolygon onSelectBuilding={() => { }} selectedBuildingId={null} currentDelta={0.001} />
    );
    expect(queryByTestId('building-marker-Test Building')).toBeTruthy();
  });

  it('hides building marker when zoomed out too far', () => {
    const { queryByTestId } = render(
      <BuildingPolygon onSelectBuilding={() => { }} selectedBuildingId={null} currentDelta={0.01} />
    );
    expect(queryByTestId('building-marker-Test Building')).toBeNull();
  });
});
