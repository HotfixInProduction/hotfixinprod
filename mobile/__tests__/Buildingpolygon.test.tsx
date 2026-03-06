import { render, act } from '@testing-library/react-native';
import BuildingPolygon from '../src/components/BuildingPolygon';
import React from 'react';

// Mock expo-location
const mockWatchPositionAsync = jest.fn();
const mockGetForegroundPermissionsAsync = jest.fn();

jest.mock('expo-location', () => ({
  watchPositionAsync: (...args: any[]) => mockWatchPositionAsync(...args),
  getForegroundPermissionsAsync: (...args: any[]) => mockGetForegroundPermissionsAsync(...args),
  Accuracy: {
    High: 4,
    BestForNavigation: 5
  },
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Polygon: (props: any) => <View {...props} />,
    Marker: (props: any) => React.createElement(View, { ...props }),
  };
});

describe('BuildingPolygon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockWatchPositionAsync.mockResolvedValue({ remove: jest.fn() });
  });

  it('renders building polygons', () => {
    const { UNSAFE_getAllByType } = render(<BuildingPolygon onSelectBuilding={() => { }} selectedBuildingId={null} currentDelta={0} />);
    const polygons = UNSAFE_getAllByType(require('react-native-maps').Polygon);

    expect(polygons.length).toBeGreaterThan(0);
  });

  it('changes building color when selected', () => {
    const building_id = 'Hall Building';
    const { UNSAFE_getAllByType } = render(<BuildingPolygon onSelectBuilding={() => { }} selectedBuildingId={building_id} currentDelta={0} />);
    const polygons = UNSAFE_getAllByType(require('react-native-maps').Polygon);
    const hallBuilding = polygons.find((p: any) => p.props.strokeColor === '#FBBC05');
    expect(hallBuilding).toBeDefined();
    expect(hallBuilding!.props.strokeColor).toBe('#FBBC05');
    expect(hallBuilding!.props.fillColor).toBe('rgba(251, 188, 5, 0.4)');
  });

  it('changes building color when user is inside', async () => {
    let locationCallback: any;
    mockWatchPositionAsync.mockImplementation((config, callback) => {
      locationCallback = callback;
      return Promise.resolve({ remove: jest.fn() });
    });

    const { UNSAFE_getAllByType } = render(<BuildingPolygon onSelectBuilding={() => { }} selectedBuildingId={null} currentDelta={0} />);
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

    expect(hallBuilding!.props.strokeColor).toBe('#0000FF');
  });

  it('calls onSelectBuilding when polygon is pressed', () => {
    const mockSelect = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <BuildingPolygon onSelectBuilding={mockSelect} selectedBuildingId={null} currentDelta={0} />
    );

    const polygons = UNSAFE_getAllByType(require('react-native-maps').Polygon);

    const { fireEvent } = require('@testing-library/react-native');
    fireEvent(polygons[0], 'onPress');

    expect(mockSelect).toHaveBeenCalled();
  });

  it('does not watch location when permission is denied', async () => {
    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

    render(<BuildingPolygon onSelectBuilding={() => { }} selectedBuildingId={null} currentDelta={0} />);
    await new Promise(resolve => setTimeout(resolve, 10));

    // watchPositionAsync should not be called when permission is denied
    expect(mockWatchPositionAsync).not.toHaveBeenCalled();
  });

  it('cleans up location subscription on unmount when subscription exists', async () => {
    const mockRemove = jest.fn();
    mockWatchPositionAsync.mockResolvedValue({ remove: mockRemove });

    const { unmount } = render(<BuildingPolygon onSelectBuilding={() => { }} selectedBuildingId={null} currentDelta={0} />);
    await new Promise(resolve => setTimeout(resolve, 50));

    unmount();

    expect(mockRemove).toHaveBeenCalled();
  });

  it('handles unmount safely when no location subscription exists', async () => {
    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

    const { unmount } = render(<BuildingPolygon onSelectBuilding={() => { }} selectedBuildingId={null} currentDelta={0} />);
    await new Promise(resolve => setTimeout(resolve, 50));

    // Should not throw error when unmounting with null subscription
    expect(() => unmount()).not.toThrow();
    expect(mockWatchPositionAsync).not.toHaveBeenCalled();
  });

  it('highlights start and destination buildings', () => {
    const { UNSAFE_getAllByType } = render(
      <BuildingPolygon
        onSelectBuilding={() => { }}
        selectedBuildingId={null}
        currentDelta={0}
        startBuildingId="Hall Building"
        destinationBuildingId="Q Annex"
      />
    );
    const polygons = UNSAFE_getAllByType(require('react-native-maps').Polygon);

    const startPolygon = polygons.find((p: any) => p.props.strokeColor === '#34A853');
    const destPolygon = polygons.find((p: any) => p.props.strokeColor === '#EA4335');

    expect(startPolygon).toBeDefined();
    expect(destPolygon).toBeDefined();
    expect(startPolygon!.props.fillColor).toBe('rgba(52, 168, 83, 0.4)');
    expect(destPolygon!.props.fillColor).toBe('rgba(234, 67, 53, 0.4)');
  });

  it('shows and hides labels based on zoom level (delta)', () => {
    const { queryByTestId, rerender } = render(
      <BuildingPolygon onSelectBuilding={() => { }} selectedBuildingId={null} currentDelta={0.1} />
    );

    // At delta 0.1, labels should be hidden (threshold is < 0.008)
    expect(queryByTestId('building-marker-Hall Building')).toBeNull();

    // Rerender with low delta (zoomed in)
    rerender(<BuildingPolygon onSelectBuilding={() => { }} selectedBuildingId={null} currentDelta={0.001} />);
    expect(queryByTestId('building-marker-Hall Building')).toBeTruthy();
  });

  it('triggers onSelectBuilding when tapping labels or shadow markers', () => {
    const mockSelect = jest.fn();
    const { getByTestId } = render(
      <BuildingPolygon onSelectBuilding={mockSelect} selectedBuildingId={null} currentDelta={0.001} />
    );

    const { fireEvent } = require('@testing-library/react-native');

    // Tap shadow marker
    fireEvent(getByTestId('building-polygon-Hall Building-polygon'), 'onPress');
    expect(mockSelect).toHaveBeenCalledTimes(1);

    // Tap label
    fireEvent(getByTestId('building-marker-Hall Building'), 'onPress');
    expect(mockSelect).toHaveBeenCalledTimes(2);
  });
});