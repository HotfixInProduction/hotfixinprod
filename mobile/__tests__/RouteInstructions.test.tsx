import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RouteInstructions from '../src/components/RouteInstructions';
import type { MapStep } from '../src/types/map';

describe('RouteInstructions Component', () => {
  const mockOnClose = jest.fn();
  const mockOnViewFloorPlan = jest.fn();
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

  const mockStart = { name: 'Hall Building', buildingId: 'hall', floor: '1' };
  const mockDestination = { name: 'Vanier Extension', buildingId: 'vanier', floor: '2' };

  it('formats and displays route instructions', () => {
    render(
      <RouteInstructions 
        instructions={mockInstructions}
        start={mockStart}
        destination={mockDestination}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );
    expect(screen.getByText(/Exit Hall Building/)).toBeTruthy();
    expect(screen.getByText(/Head north on Rue Guy/)).toBeTruthy();
    expect(screen.getByText(/Turn right onto Rue Sainte-Catherine/)).toBeTruthy();
    expect(screen.getByText(/Destination will be on the left/)).toBeTruthy();
    expect(screen.getByText(/Enter Vanier Extension/)).toBeTruthy();
  });
});