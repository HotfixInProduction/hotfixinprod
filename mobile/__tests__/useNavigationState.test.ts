import { renderHook, act } from '@testing-library/react-native';
import { useNavigationState, OutdoorNavigationStep } from '../src/hooks/useNavigationState';
import type { MapStep, TravelMode } from '../src/types/map';
import type { RoomSelection } from '../src/types/building';
import type { Place } from '../src/components/BuildingSelector/StartDestinationPicker';

// Mock the useIndoorPath module
jest.mock('../src/hooks/useIndoorPath', () => ({
  findPathToExit: jest.fn(),
  findPathFromEntry: jest.fn(),
  findPathBetweenRooms: jest.fn(),
  filterWalkingSegments: jest.fn(),
}));

// Mock the Pathfinding module
jest.mock('../src/utils/Pathfinding', () => ({
  splitPathByFloor: jest.fn(),
  generateIndoorInstruction: jest.fn(),
}));

import {
  findPathToExit,
  findPathFromEntry,
  findPathBetweenRooms,
  filterWalkingSegments,
} from '../src/hooks/useIndoorPath';
import { splitPathByFloor, generateIndoorInstruction } from '../src/utils/Pathfinding';

const mockFindPathToExit = findPathToExit as jest.MockedFunction<typeof findPathToExit>;
const mockFindPathFromEntry = findPathFromEntry as jest.MockedFunction<typeof findPathFromEntry>;
const mockFindPathBetweenRooms = findPathBetweenRooms as jest.MockedFunction<typeof findPathBetweenRooms>;
const mockFilterWalkingSegments = filterWalkingSegments as jest.MockedFunction<typeof filterWalkingSegments>;
const mockSplitPathByFloor = splitPathByFloor as jest.MockedFunction<typeof splitPathByFloor>;
const mockGenerateIndoorInstruction = generateIndoorInstruction as jest.MockedFunction<typeof generateIndoorInstruction>;

// Suppress console.log in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Helper to create mock MapStep
const createMockMapStep = (html_instructions: string = 'Turn left'): MapStep => ({
  distance: { text: '100 m', value: 100 },
  duration: { text: '1 min', value: 60 },
  html_instructions,
  polyline: { points: '' },
  travel_mode: 'WALKING',
});

// Helper to create mock Place
const createMockPlace = (name: string = 'Test Place'): Place => ({
  name,
  address: '123 Test St',
  location: { lat: 45.497, lng: -73.578 },
});

// Helper to create mock RoomSelection
const createMockRoomSelection = (
  buildingId: string = 'Hall Building',
  floor: string = '8',
  room: string = '820'
): RoomSelection => ({
  buildingId,
  floor,
  room,
});

// Helper to create mock nav mesh node
const createMockNode = (id: string, floor: number, type: string = 'room') => ({
  id,
  data: { x: 100, y: 200, floor, type, buildingId: 'Hall Building' },
});

describe('useNavigationState', () => {
  const defaultProps = {
    transportMode: 'WALKING' as TravelMode,
    startRoomSelection: null as RoomSelection | null,
    destinationRoomSelection: null as RoomSelection | null,
    instructions: [] as MapStep[],
    start: null as Place | null,
    destination: null as Place | null,
    googleMapsApiKey: 'test-api-key',
    onShowShuttleSchedule: jest.fn(),
    onShowInstructions: jest.fn(),
    onExit: jest.fn(),
    onRestoreRouteInfo: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    mockSplitPathByFloor.mockReturnValue([]);
    mockFilterWalkingSegments.mockReturnValue([]);
    mockGenerateIndoorInstruction.mockReturnValue('Follow the path');
    mockFindPathToExit.mockReturnValue(null);
    mockFindPathFromEntry.mockReturnValue(null);
    mockFindPathBetweenRooms.mockReturnValue(null);
  });

  describe('initial state', () => {
    it('should return correct initial state', () => {
      const { result } = renderHook(() => useNavigationState(defaultProps));

      expect(result.current.navigationSteps).toEqual([]);
      expect(result.current.currentStepIndex).toBe(-1);
      expect(result.current.isNavigating).toBe(false);
      expect(result.current.activeStep).toBe(null);
    });
  });

  describe('handleStartNavigation', () => {
    it('should reuse existing navigation steps if already generated', () => {
      const startRoom = createMockRoomSelection('Hall Building', '8', '820');
      const destRoom = createMockRoomSelection('Hall Building', '9', '920');

      // Create multiple floors to have multiple navigation steps
      const mockPath = [
        createMockNode('node1', 8),
        createMockNode('stairs', 8, 'stairs'),
        createMockNode('stairs', 9, 'stairs'),
        createMockNode('node2', 9),
      ];
      mockFindPathBetweenRooms.mockReturnValue(mockPath);
      mockSplitPathByFloor.mockReturnValue([
        { floor: 8, nodes: [mockPath[0], mockPath[1]] },
        { floor: 9, nodes: [mockPath[2], mockPath[3]] },
      ]);
      mockFilterWalkingSegments.mockReturnValue([
        { floor: 8, nodes: [mockPath[0], mockPath[1]] },
        { floor: 9, nodes: [mockPath[2], mockPath[3]] },
      ]);

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          startRoomSelection: startRoom,
          destinationRoomSelection: destRoom,
        })
      );

      // 1. Initial generation of steps
      act(() => {
        result.current.handleStartNavigation();
      });
      expect(result.current.navigationSteps.length).toBe(2);

      // 2. Advance to next step (changes currentStepIndex)
      act(() => {
        result.current.handleNextStep(); 
      });
      expect(result.current.currentStepIndex).toBe(1);

      // 3. Trigger start navigation again (should hit the uncovered lines)
      act(() => {
        result.current.handleStartNavigation();
      });

      // Validates that it reused steps by just resetting index to 0
      expect(result.current.currentStepIndex).toBe(0);
      // Validates logic wasn't fully re-run
      expect(mockFindPathBetweenRooms).toHaveBeenCalledTimes(1);
    });
    
    it('should call onShowShuttleSchedule when transportMode is SHUTTLE', () => {
      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          transportMode: 'SHUTTLE',
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      expect(defaultProps.onShowShuttleSchedule).toHaveBeenCalledTimes(1);
    });

    it('should not start navigation if isExitingRef is true', () => {
      const { result } = renderHook(() => useNavigationState(defaultProps));

      // First exit navigation to set isExitingRef to true
      act(() => {
        result.current.handleExitNavigation();
      });

      // Then try to start navigation - should be blocked
      act(() => {
        result.current.handleStartNavigation();
      });

      expect(result.current.isNavigating).toBe(false);
    });

    it('should call onShowInstructions when no steps are generated', () => {
      const { result } = renderHook(() => useNavigationState(defaultProps));

      act(() => {
        result.current.handleStartNavigation();
      });

      expect(defaultProps.onShowInstructions).toHaveBeenCalledTimes(1);
    });

    it('should generate same-building steps when start and destination are in same building', () => {
      const startRoom = createMockRoomSelection('Hall Building', '8', '820');
      const destRoom = createMockRoomSelection('Hall Building', '8', '862');

      const mockPath = [createMockNode('node1', 8), createMockNode('node2', 8)];
      mockFindPathBetweenRooms.mockReturnValue(mockPath);
      mockSplitPathByFloor.mockReturnValue([{ floor: 8, nodes: mockPath }]);
      mockFilterWalkingSegments.mockReturnValue([{ floor: 8, nodes: mockPath }]);

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          startRoomSelection: startRoom,
          destinationRoomSelection: destRoom,
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      expect(mockFindPathBetweenRooms).toHaveBeenCalledWith(
        'Hall Building',
        '8',
        '820',
        '862',
        false
      );
      expect(result.current.isNavigating).toBe(true);
      expect(result.current.currentStepIndex).toBe(0);
    });

    it('should generate mixed route steps when start and destination are in different buildings', () => {
      const startRoom = createMockRoomSelection('Hall Building', '8', '820');
      const destRoom = createMockRoomSelection('John Molson Building', '1', '101');
      const instructions = [createMockMapStep('Walk to MB')];

      const mockExitPath = [createMockNode('exit1', 1, 'building_entry_exit')];
      const mockEntryPath = [createMockNode('entry1', 1, 'building_entry_exit')];

      mockFindPathToExit.mockReturnValue(mockExitPath);
      mockFindPathFromEntry.mockReturnValue(mockEntryPath);
      mockSplitPathByFloor.mockImplementation((path: any) => {
        if (path === mockExitPath) return [{ floor: 1, nodes: mockExitPath }];
        if (path === mockEntryPath) return [{ floor: 1, nodes: mockEntryPath }];
        return [];
      });
      mockFilterWalkingSegments.mockImplementation((segments: any) => segments);

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          startRoomSelection: startRoom,
          destinationRoomSelection: destRoom,
          instructions,
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      expect(mockFindPathToExit).toHaveBeenCalledWith(
        'Hall Building',
        '8',
        '820',
        false
      );
      expect(mockFindPathFromEntry).toHaveBeenCalledWith(
        'John Molson Building',
        '1',
        '101',
        false
      );
      expect(result.current.isNavigating).toBe(true);
    });

    it('should generate steps with only start room selection (no destination room)', () => {
      const startRoom = createMockRoomSelection('Hall Building', '8', '820');
      const instructions = [createMockMapStep('Walk outside')];

      const mockExitPath = [createMockNode('exit1', 1, 'building_entry_exit')];
      mockFindPathToExit.mockReturnValue(mockExitPath);
      mockSplitPathByFloor.mockReturnValue([{ floor: 1, nodes: mockExitPath }]);
      mockFilterWalkingSegments.mockImplementation((segments: any) => segments);

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          startRoomSelection: startRoom,
          destinationRoomSelection: null,
          instructions,
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      expect(mockFindPathToExit).toHaveBeenCalled();
      expect(result.current.isNavigating).toBe(true);
    });

    it('should generate steps with only destination room selection (no start room)', () => {
      const destRoom = createMockRoomSelection('Hall Building', '8', '862');
      const instructions = [createMockMapStep('Walk from outside')];

      const mockEntryPath = [createMockNode('entry1', 1, 'building_entry_exit')];
      mockFindPathFromEntry.mockReturnValue(mockEntryPath);
      mockSplitPathByFloor.mockReturnValue([{ floor: 1, nodes: mockEntryPath }]);
      mockFilterWalkingSegments.mockImplementation((segments: any) => segments);

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          startRoomSelection: null,
          destinationRoomSelection: destRoom,
          instructions,
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      expect(mockFindPathFromEntry).toHaveBeenCalled();
      expect(result.current.isNavigating).toBe(true);
    });

    it('should handle null path from findPathBetweenRooms', () => {
      const startRoom = createMockRoomSelection('Hall Building', '8', '820');
      const destRoom = createMockRoomSelection('Hall Building', '8', '862');

      mockFindPathBetweenRooms.mockReturnValue(null);

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          startRoomSelection: startRoom,
          destinationRoomSelection: destRoom,
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      // Should fallback to onShowInstructions since no steps generated
      expect(defaultProps.onShowInstructions).toHaveBeenCalled();
    });

    it('should handle null path from findPathToExit', () => {
      const startRoom = createMockRoomSelection('Hall Building', '8', '820');
      const instructions = [createMockMapStep()];

      mockFindPathToExit.mockReturnValue(null);

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          startRoomSelection: startRoom,
          instructions,
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      // Should still navigate with outdoor step
      expect(result.current.isNavigating).toBe(true);
    });

    it('should handle null path from findPathFromEntry', () => {
      const destRoom = createMockRoomSelection('Hall Building', '8', '862');
      const instructions = [createMockMapStep()];

      mockFindPathFromEntry.mockReturnValue(null);

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          destinationRoomSelection: destRoom,
          instructions,
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      // Should still navigate with outdoor step
      expect(result.current.isNavigating).toBe(true);
    });

  });

  describe('handleNextStep', () => {
    it('should increment currentStepIndex when not at last step', () => {
      // Create multiple steps for navigation
      const startRoom = createMockRoomSelection('Hall Building', '8', '820');
      const destRoom = createMockRoomSelection('Hall Building', '9', '920');

      const mockPath = [
        createMockNode('node1', 8),
        createMockNode('stairs', 8, 'stairs'),
        createMockNode('stairs', 9, 'stairs'),
        createMockNode('node2', 9),
      ];

      mockFindPathBetweenRooms.mockReturnValue(mockPath);
      mockSplitPathByFloor.mockReturnValue([
        { floor: 8, nodes: [mockPath[0], mockPath[1]] },
        { floor: 9, nodes: [mockPath[2], mockPath[3]] },
      ]);
      mockFilterWalkingSegments.mockReturnValue([
        { floor: 8, nodes: [mockPath[0], mockPath[1]] },
        { floor: 9, nodes: [mockPath[2], mockPath[3]] },
      ]);

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          startRoomSelection: startRoom,
          destinationRoomSelection: destRoom,
        })
      );

      // Start navigation first
      act(() => {
        result.current.handleStartNavigation();
      });

      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.navigationSteps.length).toBe(2);

      // Move to next step
      act(() => {
        result.current.handleNextStep();
      });

      expect(result.current.currentStepIndex).toBe(1);
    });

    it('should call onExit when at last step', () => {
      const instructions = [createMockMapStep()];
      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          instructions,
        })
      );

      // Start navigation
      act(() => {
        result.current.handleStartNavigation();
      });

      // Move to last step and call next
      act(() => {
        result.current.handleNextStep();
      });

      expect(defaultProps.onExit).toHaveBeenCalled();
    });

    it('should not go below 0 when at first step', () => {
      const instructions = [createMockMapStep()];
      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          instructions,
        })
      );

      // Start navigation
      act(() => {
        result.current.handleStartNavigation();
      });

      expect(result.current.currentStepIndex).toBe(0);

      // Try to go back from first step
      act(() => {
        result.current.handlePrevStep();
      });

      expect(result.current.currentStepIndex).toBe(0);
    });
  });

  describe('handlePrevStep', () => {
    it('should decrement currentStepIndex when not at first step', () => {
      // Create multiple steps for navigation
      const startRoom = createMockRoomSelection('Hall Building', '8', '820');
      const destRoom = createMockRoomSelection('Hall Building', '9', '920');

      const mockPath = [
        createMockNode('node1', 8),
        createMockNode('stairs', 8, 'stairs'),
        createMockNode('stairs', 9, 'stairs'),
        createMockNode('node2', 9),
      ];

      mockFindPathBetweenRooms.mockReturnValue(mockPath);
      mockSplitPathByFloor.mockReturnValue([
        { floor: 8, nodes: [mockPath[0], mockPath[1]] },
        { floor: 9, nodes: [mockPath[2], mockPath[3]] },
      ]);
      mockFilterWalkingSegments.mockReturnValue([
        { floor: 8, nodes: [mockPath[0], mockPath[1]] },
        { floor: 9, nodes: [mockPath[2], mockPath[3]] },
      ]);

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          startRoomSelection: startRoom,
          destinationRoomSelection: destRoom,
        })
      );

      // Start navigation
      act(() => {
        result.current.handleStartNavigation();
      });

      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.navigationSteps.length).toBe(2);

      // Move to second step
      act(() => {
        result.current.handleNextStep();
      });

      expect(result.current.currentStepIndex).toBe(1);

      // Go back to first step
      act(() => {
        result.current.handlePrevStep();
      });

      expect(result.current.currentStepIndex).toBe(0);
    });

    it('should not decrement below 0', () => {
      const instructions = [createMockMapStep()];
      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          instructions,
        })
      );

      // Start navigation
      act(() => {
        result.current.handleStartNavigation();
      });

      expect(result.current.currentStepIndex).toBe(0);

      // Try to go back from first step
      act(() => {
        result.current.handlePrevStep();
      });

      expect(result.current.currentStepIndex).toBe(0);
    });
  });

  describe('handleExitNavigation', () => {
    it('should reset navigation state', () => {
      const instructions = [createMockMapStep()];
      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          instructions,
        })
      );

      // Start navigation
      act(() => {
        result.current.handleStartNavigation();
      });

      expect(result.current.isNavigating).toBe(true);

      // Exit navigation
      act(() => {
        result.current.handleExitNavigation();
      });

      expect(result.current.isNavigating).toBe(false);
      expect(result.current.currentStepIndex).toBe(-1);
      expect(result.current.navigationSteps).toEqual([]);
      expect(defaultProps.onExit).toHaveBeenCalled();
    });

    it('should call restoreRouteInfoViaApi when all required params are present', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            routes: [
              {
                legs: [
                  {
                    distance: { value: 1000 },
                    duration: { value: 300 },
                  },
                ],
              },
            ],
          }),
      });
      global.fetch = mockFetch;

      const start = createMockPlace('Start Place');
      const destination = createMockPlace('Destination Place');
      const onRestoreRouteInfo = jest.fn();

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          start,
          destination,
          googleMapsApiKey: 'test-key',
          onRestoreRouteInfo,
        })
      );

      act(() => {
        result.current.handleExitNavigation();
      });

      // Wait for async fetch to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should not call restoreRouteInfoViaApi when missing required params', () => {
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          start: null,
          destination: null,
          googleMapsApiKey: undefined,
        })
      );

      act(() => {
        result.current.handleExitNavigation();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle fetch error in restoreRouteInfoViaApi', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      const start = createMockPlace('Start Place');
      const destination = createMockPlace('Destination Place');
      const onRestoreRouteInfo = jest.fn();

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          start,
          destination,
          googleMapsApiKey: 'test-key',
          onRestoreRouteInfo,
        })
      );

      act(() => {
        result.current.handleExitNavigation();
      });

      // Wait for async fetch to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Should not throw, error should be caught
      expect(defaultProps.onExit).toHaveBeenCalled();
    });

    it('should handle empty routes in restoreRouteInfoViaApi', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ routes: [] }),
      });
      global.fetch = mockFetch;

      const start = createMockPlace('Start Place');
      const destination = createMockPlace('Destination Place');
      const onRestoreRouteInfo = jest.fn();

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          start,
          destination,
          googleMapsApiKey: 'test-key',
          onRestoreRouteInfo,
        })
      );

      act(() => {
        result.current.handleExitNavigation();
      });

      // Wait for async fetch to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(onRestoreRouteInfo).not.toHaveBeenCalled();
    });

    it('should use driving mode when transportMode is SHUTTLE in restoreRouteInfoViaApi', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            routes: [
              {
                legs: [
                  {
                    distance: { value: 5000 },
                    duration: { value: 600 },
                  },
                ],
              },
            ],
          }),
      });
      global.fetch = mockFetch;

      const start = createMockPlace('Start Place');
      const destination = createMockPlace('Destination Place');
      const onRestoreRouteInfo = jest.fn();

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          transportMode: 'SHUTTLE',
          start,
          destination,
          googleMapsApiKey: 'test-key',
          onRestoreRouteInfo,
        })
      );

      act(() => {
        result.current.handleExitNavigation();
      });

      // Wait for async fetch to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockFetch).toHaveBeenCalled();
      // Verify the URL contains 'driving' mode (not 'shuttle')
      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain('mode=driving');
      expect(onRestoreRouteInfo).toHaveBeenCalledWith({
        distance: 5,
        duration: 10,
      });
    });
  });

  describe('activeStep', () => {
    it('should return null when not navigating', () => {
      const { result } = renderHook(() => useNavigationState(defaultProps));

      expect(result.current.activeStep).toBe(null);
    });

    it('should return current step when navigating', () => {
      const instructions = [createMockMapStep('Step 1'), createMockMapStep('Step 2')];
      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          instructions,
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      expect(result.current.activeStep).not.toBe(null);
      expect((result.current.activeStep as OutdoorNavigationStep).type).toBe('outdoor');
    });
  });

  describe('isNavigating', () => {
    it('should be false initially', () => {
      const { result } = renderHook(() => useNavigationState(defaultProps));

      expect(result.current.isNavigating).toBe(false);
    });

    it('should be true after starting navigation', () => {
      const instructions = [createMockMapStep()];
      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          instructions,
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      expect(result.current.isNavigating).toBe(true);
    });

    it('should be false after exiting navigation', () => {
      const instructions = [createMockMapStep()];
      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          instructions,
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      expect(result.current.isNavigating).toBe(true);

      act(() => {
        result.current.handleExitNavigation();
      });

      expect(result.current.isNavigating).toBe(false);
    });
  });

  describe('generateIndoorSteps', () => {
    it('should handle empty path', () => {
      const startRoom = createMockRoomSelection('Hall Building', '8', '820');
      const destRoom = createMockRoomSelection('Hall Building', '8', '862');

      mockFindPathBetweenRooms.mockReturnValue([]);
      mockSplitPathByFloor.mockReturnValue([]);

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          startRoomSelection: startRoom,
          destinationRoomSelection: destRoom,
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      // Should fallback to onShowInstructions since no steps generated
      expect(defaultProps.onShowInstructions).toHaveBeenCalled();
    });

    it('should generate indoor steps with multiple floors', () => {
      const startRoom = createMockRoomSelection('Hall Building', '8', '820');
      const destRoom = createMockRoomSelection('Hall Building', '9', '920');

      const mockPath = [
        createMockNode('node1', 8),
        createMockNode('stairs', 8, 'stairs'),
        createMockNode('stairs', 9, 'stairs'),
        createMockNode('node2', 9),
      ];

      mockFindPathBetweenRooms.mockReturnValue(mockPath);
      mockSplitPathByFloor.mockReturnValue([
        { floor: 8, nodes: [mockPath[0], mockPath[1]] },
        { floor: 9, nodes: [mockPath[2], mockPath[3]] },
      ]);
      mockFilterWalkingSegments.mockReturnValue([
        { floor: 8, nodes: [mockPath[0], mockPath[1]] },
        { floor: 9, nodes: [mockPath[2], mockPath[3]] },
      ]);

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          startRoomSelection: startRoom,
          destinationRoomSelection: destRoom,
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      expect(result.current.navigationSteps.length).toBe(2);
      expect(result.current.navigationSteps[0].type).toBe('indoor');
      expect((result.current.navigationSteps[0] as any).floor).toBe(8);
      expect((result.current.navigationSteps[1] as any).floor).toBe(9);
    });
  });

  describe('transport modes', () => {
    it('should handle DRIVING mode', () => {
      const instructions = [createMockMapStep()];
      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          transportMode: 'DRIVING',
          instructions,
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      expect(result.current.isNavigating).toBe(true);
    });

    it('should handle BICYCLING mode', () => {
      const instructions = [createMockMapStep()];
      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          transportMode: 'BICYCLING',
          instructions,
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      expect(result.current.isNavigating).toBe(true);
    });

    it('should handle TRANSIT mode', () => {
      const instructions = [createMockMapStep()];
      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          transportMode: 'TRANSIT',
          instructions,
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      expect(result.current.isNavigating).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle missing onRestoreRouteInfo callback', async () => {
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      const start = createMockPlace('Start Place');
      const destination = createMockPlace('Destination Place');

      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          start,
          destination,
          googleMapsApiKey: 'test-key',
          onRestoreRouteInfo: undefined,
        })
      );

      act(() => {
        result.current.handleExitNavigation();
      });

      // Should not throw
      expect(defaultProps.onExit).toHaveBeenCalled();
    });

    it('should handle navigation with empty instructions', () => {
      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          instructions: [],
        })
      );

      act(() => {
        result.current.handleStartNavigation();
      });

      // Should fallback to onShowInstructions
      expect(defaultProps.onShowInstructions).toHaveBeenCalled();
    });

    it('should handle multiple navigation start/exit cycles', () => {
      const instructions = [createMockMapStep()];
      const { result } = renderHook(() =>
        useNavigationState({
          ...defaultProps,
          instructions,
        })
      );

      // First cycle
      act(() => {
        result.current.handleStartNavigation();
      });
      expect(result.current.isNavigating).toBe(true);

      act(() => {
        result.current.handleExitNavigation();
      });
      expect(result.current.isNavigating).toBe(false);

      // Second cycle - should be blocked due to isExitingRef
      act(() => {
        result.current.handleStartNavigation();
      });
      expect(result.current.isNavigating).toBe(false);
    });
  });
});