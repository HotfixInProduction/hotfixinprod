import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RouteInstructions from '../src/components/RouteInstructions';
import type { MapStep } from '../src/types/map';

describe('RouteInstructions Component', () => {
  const mockOnClose = jest.fn();
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
        onClose={mockOnClose} 
      />
    );

    expect(screen.getByText(/Head north on Rue Guy/)).toBeTruthy();
  });
});