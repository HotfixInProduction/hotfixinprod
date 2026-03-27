import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
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
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it('renders the Directions title', () => {
    render(
      <RouteInstructions
        instructions={mockInstructions}
        start={start}
        destination={destination}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    expect(screen.getByText('Directions')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    render(
      <RouteInstructions
        instructions={mockInstructions}
        start={start}
        destination={destination}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    fireEvent.press(screen.getByTestId('close-button'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('strips HTML tags from instructions', () => {
    render(
      <RouteInstructions
        instructions={mockInstructions}
        start={start}
        destination={destination}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    expect(screen.queryByText(/<b>/)).toBeNull();
    expect(screen.getByText(/Head north on Rue Guy/)).toBeTruthy();
  });

  it('replaces &nbsp; with a space', () => {
    render(
      <RouteInstructions
        instructions={mockInstructions}
        start={start}
        destination={destination}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    expect(screen.queryByText(/&nbsp;/)).toBeNull();
  });

  it('inserts newline before "Destination" in instruction text', () => {
    render(
      <RouteInstructions
        instructions={mockInstructions}
        start={start}
        destination={destination}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    expect(screen.getByText(/Turn right onto Rue Sainte-Catherine/)).toBeTruthy();
    expect(screen.getByText(/Destination will be on the left/)).toBeTruthy();
  });

  it('displays distance text for each step', () => {
    render(
      <RouteInstructions
        instructions={mockInstructions}
        start={start}
        destination={destination}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    expect(screen.getAllByText('50 m')).toHaveLength(2);
  });

  it('shows start floor plan button and calls onViewFloorPlan with start name', () => {
    render(
      <RouteInstructions
        instructions={mockInstructions}
        start={start}
        destination={destination}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    const floorPlanButtons = screen.getAllByText('Floor Plan');
    fireEvent.press(floorPlanButtons[0]);
    expect(mockOnViewFloorPlan).toHaveBeenCalledWith('Hall Building');
  });

  it('shows destination floor plan button and calls onViewFloorPlan with destination name', () => {
    render(
      <RouteInstructions
        instructions={mockInstructions}
        start={start}
        destination={destination}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    const floorPlanButtons = screen.getAllByText('Floor Plan');
    fireEvent.press(floorPlanButtons[floorPlanButtons.length - 1]);
    expect(mockOnViewFloorPlan).toHaveBeenCalledWith('Vanier Extension');
  });

  it('does not render start row when start is null', () => {
    render(
      <RouteInstructions
        instructions={mockInstructions}
        start={null}
        destination={destination}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    expect(screen.queryByText(/Exit/)).toBeNull();
  });

  it('does not render destination row when destination is null', () => {
    render(
      <RouteInstructions
        instructions={mockInstructions}
        start={start}
        destination={null}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    expect(screen.queryByText(/Enter/)).toBeNull();
  });

  it('renders with empty instructions list', () => {
    render(
      <RouteInstructions
        instructions={[]}
        start={start}
        destination={destination}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    expect(screen.getByText(/Hall Building/)).toBeTruthy();
    expect(screen.getByText(/Vanier Extension/)).toBeTruthy();
  });

  it('renders with both start and destination null', () => {
    render(
      <RouteInstructions
        instructions={mockInstructions}
        start={null}
        destination={null}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    expect(screen.queryByText(/Exit/)).toBeNull();
    expect(screen.queryByText(/Enter/)).toBeNull();
    expect(screen.getByText(/Head north on Rue Guy/)).toBeTruthy();
  });

  it('renders correct number of instruction steps', () => {
    render(
      <RouteInstructions
        instructions={mockInstructions}
        start={start}
        destination={destination}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    expect(screen.getAllByText('50 m')).toHaveLength(2);
  });
});
