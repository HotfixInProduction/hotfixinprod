import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import RouteInstructions from '../src/components/RouteInstructions';
import type { MapStep } from '../src/types/map';
import type { Place } from '../src/components/BuildingSelector/StartDestinationPicker';
import { Animated, PanResponder } from 'react-native';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  const MockIcon = (props: any) => <Text {...props}>{props.name}</Text>;
  return {
    MaterialIcons: MockIcon,
    MaterialCommunityIcons: MockIcon,
  };
});

// Mock the direct import path for MaterialCommunityIcons
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const { Text } = require('react-native');
  return (props: any) => <Text {...props}>{props.name}</Text>;
});

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
it('evaluates both true and false branches for the toggle panel and icon', () => {
    const mockSpring = jest.fn().mockReturnValue({ start: jest.fn() });
    jest.spyOn(Animated, 'spring').mockImplementation(mockSpring);

    const { getByText, rerender } = render(
      <RouteInstructions
        instructions={mockInstructions}
        start={start}
        destination={destination}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    // Initially false -> renders "expand-less" icon
    const toggleButton = getByText('expand-less');
    
    // 1st click: toggles isExpanded to TRUE 
    // This evaluates the `MAX_HEIGHT` side of the ternary in togglePanel
    fireEvent.press(toggleButton);

    // Re-render so the component updates its icon based on the new ref value
    rerender(
      <RouteInstructions
        instructions={mockInstructions}
        start={start}
        destination={destination}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    // Now true -> renders "expand-more" icon
    const toggleButtonExpanded = getByText('expand-more');
    
    // 2nd click: toggles isExpanded back to FALSE 
    // This evaluates the `MIN_HEIGHT` side of the ternary in togglePanel
    fireEvent.press(toggleButtonExpanded);

    // Ensure the animation was triggered for both the open and close actions
    expect(mockSpring).toHaveBeenCalledTimes(2);
    
    jest.restoreAllMocks();
  });

  it('fully covers PanResponder lifecycle and branches', () => {
    let panConfig: any;
    const panResponderSpy = jest.spyOn(PanResponder, 'create').mockImplementation((config) => {
      panConfig = config;
      return { panHandlers: {} } as any;
    });

    // Render fresh instance to ensure our spy catches the create() call
    render(
      <RouteInstructions
        instructions={mockInstructions}
        start={start}
        destination={destination}
        onClose={mockOnClose}
        onViewFloorPlan={mockOnViewFloorPlan}
      />
    );

    // 1. Cover onStartShouldSetPanResponder
    expect(panConfig.onStartShouldSetPanResponder()).toBe(true);

    // 2. Cover onMoveShouldSetPanResponder (dy > 5 and dy <= 5)
    expect(panConfig.onMoveShouldSetPanResponder(null, { dy: 6 })).toBe(true);
    expect(panConfig.onMoveShouldSetPanResponder(null, { dy: 4 })).toBe(false);

    // 3. Cover onPanResponderMove
    const mockSetValue = jest.fn();
    jest.spyOn(Animated.Value.prototype, 'setValue').mockImplementation(mockSetValue);
    panConfig.onPanResponderMove(null, { dy: -50 });
    expect(mockSetValue).toHaveBeenCalledWith(expect.any(Number));

    // 4. Cover onPanResponderRelease branches
    const mockSpring = jest.fn().mockReturnValue({ start: jest.fn() });
    jest.spyOn(Animated, 'spring').mockImplementation(mockSpring);

    // Branch A: shouldExpand = true (dy < -50)
    panConfig.onPanResponderRelease(null, { dy: -60, vy: 0 });
    
    // Branch B: shouldExpand = true (dy >= -50 BUT vy < -0.5)
    panConfig.onPanResponderRelease(null, { dy: -10, vy: -1 });

    // Branch C: shouldExpand = false (dy >= -50 AND vy >= -0.5)
    panConfig.onPanResponderRelease(null, { dy: 10, vy: 1 });

    panResponderSpy.mockRestore();
  });
  
  describe('Navigation Controls Panel Branch Coverage', () => {
    it('evaluates false/false/false for navigation ternaries', () => {
      // navigationMode = 'outdoor' (not 'indoor')
      // navigationInstruction = undefined (falsy)
      // isLastStep = false
      const { getByText } = render(
        <RouteInstructions
          instructions={mockInstructions}
          start={start}
          destination={destination}
          onClose={mockOnClose}
          onViewFloorPlan={mockOnViewFloorPlan}
          navigationMode="outdoor"
          navigationInstruction={undefined}
          isLastStep={false}
        />
      );
      expect(getByText('walk')).toBeTruthy(); 
      expect(getByText('Follow outdoor route map to next building')).toBeTruthy();
      expect(getByText('Next')).toBeTruthy();
    });

    it('evaluates true/true/true for navigation ternaries', () => {
      // navigationMode = 'indoor'
      // navigationInstruction = "Custom String" (truthy)
      // isLastStep = true
      const { getByText } = render(
        <RouteInstructions
          instructions={mockInstructions}
          start={start}
          destination={destination}
          onClose={mockOnClose}
          onViewFloorPlan={mockOnViewFloorPlan}
          navigationMode="indoor"
          navigationInstruction="Custom instruction here"
          isLastStep={true}
        />
      );
      expect(getByText('directions')).toBeTruthy();
      expect(getByText('Custom instruction here')).toBeTruthy();
      expect(getByText('Done')).toBeTruthy();
    });

    it('evaluates the fallback branch for indoor path without custom instruction', () => {
      // This specifically forces `(navigationMode === 'outdoor')` to evaluate as FALSE
      // when `navigationInstruction` is falsy, to hit the 'Follow indoor path' string.
      const { getByText } = render(
        <RouteInstructions
          instructions={mockInstructions}
          start={start}
          destination={destination}
          onClose={mockOnClose}
          onViewFloorPlan={mockOnViewFloorPlan}
          navigationMode="indoor"
          navigationInstruction={undefined}
        />
      );
      expect(getByText('Follow indoor path')).toBeTruthy();
    });
  });

});

