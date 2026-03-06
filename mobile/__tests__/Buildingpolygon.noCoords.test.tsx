import { render } from '@testing-library/react-native';
import React from 'react';

// Mock buildings with a building that has no coordinates property
jest.mock('../src/data/buildings', () => ({
  buildings: [
    {
      id: 'Test Building No Coords',
      label: 'TBNC',
      labelCoord: { latitude: 45.497, longitude: -73.579 },
      address: 'Test Address'
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

describe('BuildingPolygon - no coordinates edge case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles buildings without coordinates gracefully', () => {
    const { queryByTestId } = render(
      <BuildingPolygon onSelectBuilding={() => { }} selectedBuildingId={null} currentDelta={0.001} />
    );
    expect(queryByTestId('building-marker-Test Building No Coords')).toBeTruthy();
  });

  it('uses default zoom threshold for buildings without coordinates', () => {
    const { queryByTestId } = render(
      <BuildingPolygon onSelectBuilding={() => { }} selectedBuildingId={null} currentDelta={0.01} />
    );
    expect(queryByTestId('building-marker-Test Building No Coords')).toBeNull();
  });
});
