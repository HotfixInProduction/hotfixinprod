import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RouteInstructions from '../src/components/RouteInstructions';
import type { MapStep } from '../src/types/map';
import type { Place } from '../src/components/BuildingSelector/StartDestinationPicker';

describe('RouteInstructions Component', () => {
  const mockOnClose = jest.fn();
  const mockOnViewFloorPlan = jest.fn();

  const start: Place = {
    name: 'Hall Building',
    address: '123 University St',
    location: { lat: 45.497, lng: -73.579 },
  };

  const destination: Place = {
    name: 'Vanier Extension',
    address: '456 University Ave',
    location: { lat: 45.499, lng: -73.578 },
  };

  const mockInstructions: MapStep[] = [
    {
      html_instructions: 'Head <b>north</b> on Rue Guy',
      distance: { text: '50 m', value: 50 },
      duration: { text: '1 min', value: 60 },
      polyline: { points: 'mock-polyline-1' },
      travel_mode: 'WALKING',
    },
    {
      html_instructions: 'Turn right onto Rue Sainte-Catherine&nbsp;Destination will be on the left',
      distance: { text: '50 m', value: 50 },
      duration: { text: '1 min', value: 60 },
      polyline: { points: 'mock-polyline-2' },
      travel_mode: 'WALKING',
    }
  ];



  it('formats and displays route instructions', () => {
    render(
      <RouteInstructions
        instructions={mockInstructions}
        start={start}
        destination={destination}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    expect(screen.getByText(/Hall Building/)).toBeTruthy();
    expect(screen.getByText(/Vanier Extension/)).toBeTruthy();

    expect(screen.getByText(/Head north on Rue Guy/)).toBeTruthy();
    expect(screen.getByText(/Turn right onto Rue Sainte-Catherine/)).toBeTruthy();
    expect(screen.getByText(/Destination will be on the left/)).toBeTruthy();
  });
});