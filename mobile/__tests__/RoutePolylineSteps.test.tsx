import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { RoutePolylineSteps } from '../src/components/RoutePolylineSteps'; 
import { StepStrategies } from '../src/data/mapStrategies';
import { StepProcessed } from '../src/hooks/useRouteProcessor';

// 1. Mock the native Polyline component from react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  // We mock it as a View so we can query it via testID in the virtual DOM
  const MockPolyline = (props: any) => <View testID="map-polyline" {...props} />;
  
  return {
    Polyline: MockPolyline,
  };
});

describe('RoutePolylineSteps Component', () => {
  const mockProcessedSteps: StepProcessed[] = [
    {
      mode: 'WALKING',
      coordinates: [
        { latitude: 45.497, longitude: -73.579 },
        { latitude: 45.498, longitude: -73.580 },
      ],
    },
    {
      mode: 'DRIVING',
      coordinates: [
        { latitude: 45.498, longitude: -73.580 },
        { latitude: 45.499, longitude: -73.581 },
      ],
    },
  ];

  it('renders the correct number of Polylines using screen queries', () => {
    render(<RoutePolylineSteps processedSteps={mockProcessedSteps} />);

    // screen.getAllByTestID resolves the previous 'does not exist' error
    const polylines = screen.getAllByTestId('map-polyline');
    expect(polylines).toHaveLength(mockProcessedSteps.length);
  });

  it('applies style strategies based on the transport mode', () => {
    render(<RoutePolylineSteps processedSteps={mockProcessedSteps} />);

    const polylines = screen.getAllByTestId('map-polyline');

    // Test Walking Styles (First Polyline)
    const walkingStrategy = StepStrategies['WALKING'] || StepStrategies.DEFAULT;
    expect(polylines[0].props.strokeWidth).toBe(walkingStrategy.strokeWidth);
    expect(polylines[0].props.lineDashPattern).toEqual(walkingStrategy.lineDashPattern);

    // Test Driving Styles (Second Polyline)
    // Checking your specific implementation: fillColor={strategy.strokeColor}
    const drivingStrategy = StepStrategies['DRIVING'] || StepStrategies.DEFAULT;
    expect(polylines[1].props.fillColor).toBe(drivingStrategy.strokeColor);
    expect(polylines[1].props.zIndex).toBe(100);
  });

  it('falls back to DEFAULT strategy if mode is unknown', () => {
    const unknownStep = [
      {
        mode: 'NON_EXISTENT_MODE',
        coordinates: [{ latitude: 0, longitude: 0 }],
      },
    ];

    // Cast to any to bypass TS check for testing the fallback logic
    render(<RoutePolylineSteps processedSteps={unknownStep as any} />);

    const polyline = screen.getByTestId('map-polyline');
    expect(polyline.props.strokeWidth).toBe(StepStrategies.DEFAULT.strokeWidth);
  });

  it('renders polylines with coordinates provided in props', () => {
    render(<RoutePolylineSteps processedSteps={mockProcessedSteps} />);

    const polylines = screen.getAllByTestId('map-polyline');
    
    // Verifying that the data passed to the component reaches the mock
    expect(polylines[0].props.coordinates).toEqual(mockProcessedSteps[0].coordinates);
    expect(polylines[1].props.coordinates).toEqual(mockProcessedSteps[1].coordinates);
  });
});