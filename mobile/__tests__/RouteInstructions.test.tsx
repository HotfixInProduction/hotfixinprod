import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RouteInstructions from '../src/components/RouteInstructions';

describe('RouteInstructions Component', () => {
  const mockOnClose = jest.fn();
  const mockInstructions = [
    {
      html_instructions: 'Head <b>north</b> on Rue Guy',
      distance: { text: '50 m' },
    },
    {
      html_instructions: 'Turn right onto Rue Sainte-Catherine&nbsp;Destination will be on the left',
      distance: { text: '50 m' },
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