import { renderHook } from '@testing-library/react-native';
import { 
  useIndoorPath, 
  usePathFloors, 
  usePathSegments, 
  useSvgPathForFloor 
} from '../src/hooks/useIndoorPath';
import * as Pathfinding from '../src/utils/Pathfinding';

// Mock the Pathfinding module
jest.mock('../src/utils/Pathfinding', () => ({
  findPath: jest.fn(),
  getRoomNodeId: jest.fn(),
  getFloorsInPath: jest.fn(),
  splitPathByFloor: jest.fn(),
  generateSvgPathForFloor: jest.fn(),
  getPOIsByType: jest.fn(),
}));

describe('useIndoorPath', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic pathfinding', () => {
    it('returns null when no path can be found between valid rooms', () => {
      // Mock valid nodes so it gets past the early returns
      (Pathfinding.getRoomNodeId as jest.Mock)
        .mockReturnValueOnce('Hall_F8_room_291')
        .mockReturnValueOnce('Hall_F8_room_292');
        
      // Mock findPath to return null (no route found)
      (Pathfinding.findPath as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => 
        useIndoorPath('Hall Building', '8', '801', '803')
      );

      // This ensures logAndReturnPath is called with null, covering the missing branch
      expect(result.current).toBeNull();
    });
    
    it('returns null when buildingId is undefined', () => {
      const { result } = renderHook(() => 
        useIndoorPath(undefined, '8', '801', '803')
      );
      expect(result.current).toBeNull();
    });

    it('returns null when startRoom is undefined', () => {
      const { result } = renderHook(() => 
        useIndoorPath('Hall Building', '8', undefined, '803')
      );
      expect(result.current).toBeNull();
    });

    it('returns null when endRoom is undefined', () => {
      const { result } = renderHook(() => 
        useIndoorPath('Hall Building', '8', '801', undefined)
      );
      expect(result.current).toBeNull();
    });

    it('finds path between two rooms in same building', () => {
      (Pathfinding.getRoomNodeId as jest.Mock)
        .mockReturnValueOnce('Hall_F8_room_291')
        .mockReturnValueOnce('Hall_F8_room_292');
      (Pathfinding.findPath as jest.Mock).mockReturnValue([
        { id: 'Hall_F8_room_291', data: { x: 100, y: 100 } },
        { id: 'Hall_F8_room_292', data: { x: 200, y: 200 } },
      ]);
      (Pathfinding.getFloorsInPath as jest.Mock).mockReturnValue([8]);

      const { result } = renderHook(() => 
        useIndoorPath('Hall Building', '8', '801', '803')
      );

      expect(Pathfinding.getRoomNodeId).toHaveBeenCalledWith('Hall Building', '8', '801');
      expect(Pathfinding.getRoomNodeId).toHaveBeenCalledWith('Hall Building', '8', '803');
      expect(Pathfinding.findPath).toHaveBeenCalled();
      expect(result.current).not.toBeNull();
    });

    it('returns null when start room node not found', () => {
      (Pathfinding.getRoomNodeId as jest.Mock)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce('Hall_F8_room_292');

      const { result } = renderHook(() => 
        useIndoorPath('Hall Building', '8', 'nonexistent', '803')
      );

      expect(result.current).toBeNull();
    });

    it('returns null when end room node not found', () => {
      (Pathfinding.getRoomNodeId as jest.Mock)
        .mockReturnValueOnce('Hall_F8_room_291')
        .mockReturnValueOnce(null);

      const { result } = renderHook(() => 
        useIndoorPath('Hall Building', '8', '801', 'nonexistent')
      );

      expect(result.current).toBeNull();
    });

    it('passes accessibleOnly option to findPath', () => {
      (Pathfinding.getRoomNodeId as jest.Mock)
        .mockReturnValueOnce('Hall_F8_room_291')
        .mockReturnValueOnce('Hall_F8_room_292');
      (Pathfinding.findPath as jest.Mock).mockReturnValue([]);
      (Pathfinding.getFloorsInPath as jest.Mock).mockReturnValue([]);

      renderHook(() => 
        useIndoorPath('Hall Building', '8', '801', '803', { accessibleOnly: true })
      );

      expect(Pathfinding.findPath).toHaveBeenCalledWith(
        'Hall Building', '8', 'Hall_F8_room_291', 'Hall_F8_room_292',
        { accessibleOnly: true }
      );
    });
  });

  describe('cross-building navigation', () => {
    it('returns null when room node not found for entry path', () => {
      // Simulate being in the destination building (Central Building)
      (Pathfinding.getRoomNodeId as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => 
        useIndoorPath('Central Building', '1', 'H-801', 'nonexistent', {
          startBuildingId: 'Hall Building',
          endBuildingId: 'Central Building'
        })
      );

      expect(result.current).toBeNull();
    });

    it('returns null when no entry/exits found for entry path', () => {
      // Simulate being in the destination building (Central Building)
      (Pathfinding.getRoomNodeId as jest.Mock).mockReturnValue('CC_F1_room_1');
      (Pathfinding.getPOIsByType as jest.Mock).mockReturnValue([]);

      const { result } = renderHook(() => 
        useIndoorPath('Central Building', '1', 'H-801', '101', {
          startBuildingId: 'Hall Building',
          endBuildingId: 'Central Building'
        })
      );

      expect(result.current).toBeNull();
    });

    it('finds path to exit when current building is start building', () => {
      (Pathfinding.getRoomNodeId as jest.Mock).mockReturnValue('Hall_F8_room_291');
      (Pathfinding.getPOIsByType as jest.Mock).mockReturnValue([
        { nodeId: 'Hall_F1_exit_1', label: 'Main Exit' }
      ]);
      (Pathfinding.findPath as jest.Mock).mockReturnValue([
        { id: 'Hall_F8_room_291', data: { x: 100, y: 100 } },
        { id: 'Hall_F1_exit_1', data: { x: 200, y: 200 } },
      ]);
      (Pathfinding.getFloorsInPath as jest.Mock).mockReturnValue([8, 1]);

      const { result } = renderHook(() => 
        useIndoorPath('Hall Building', '8', '801', 'CC-101', {
          startBuildingId: 'Hall Building',
          endBuildingId: 'Central Building'
        })
      );

      expect(Pathfinding.getPOIsByType).toHaveBeenCalledWith('Hall Building', '1', 'building_entry_exit');
      expect(result.current).not.toBeNull();
    });

    it('finds path from entry when current building is end building', () => {
      (Pathfinding.getRoomNodeId as jest.Mock).mockReturnValue('CC_F1_room_1');
      (Pathfinding.getPOIsByType as jest.Mock).mockReturnValue([
        { nodeId: 'CC_F1_entry_1', label: 'Main Entry' }
      ]);
      (Pathfinding.findPath as jest.Mock).mockReturnValue([
        { id: 'CC_F1_entry_1', data: { x: 100, y: 100 } },
        { id: 'CC_F1_room_1', data: { x: 200, y: 200 } },
      ]);
      (Pathfinding.getFloorsInPath as jest.Mock).mockReturnValue([1]);

      const { result } = renderHook(() => 
        useIndoorPath('Central Building', '1', 'H-801', '101', {
          startBuildingId: 'Hall Building',
          endBuildingId: 'Central Building'
        })
      );

      expect(Pathfinding.getPOIsByType).toHaveBeenCalledWith('Central Building', '1', 'building_entry_exit');
      expect(result.current).not.toBeNull();
    });

    it('returns null when building ID does not match start or end', () => {
      const { result } = renderHook(() => 
        useIndoorPath('Vanier Extension', '1', 'H-801', 'CC-101', {
          startBuildingId: 'Hall Building',
          endBuildingId: 'Central Building'
        })
      );

      expect(result.current).toBeNull();
    });

    it('returns null when no exits found for cross-building navigation', () => {
      (Pathfinding.getRoomNodeId as jest.Mock).mockReturnValue('Hall_F8_room_291');
      (Pathfinding.getPOIsByType as jest.Mock).mockReturnValue([]);

      const { result } = renderHook(() => 
        useIndoorPath('Hall Building', '8', '801', 'CC-101', {
          startBuildingId: 'Hall Building',
          endBuildingId: 'Central Building'
        })
      );

      expect(result.current).toBeNull();
    });

    it('returns null when room node not found for cross-building navigation', () => {
      (Pathfinding.getRoomNodeId as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => 
        useIndoorPath('Hall Building', '8', 'nonexistent', 'CC-101', {
          startBuildingId: 'Hall Building',
          endBuildingId: 'Central Building'
        })
      );

      expect(result.current).toBeNull();
    });
  });
});

describe('usePathFloors', () => {
  it('returns empty array for null path', () => {
    const { result } = renderHook(() => usePathFloors(null));
    expect(result.current).toEqual([]);
  });

  it('returns empty array for empty path', () => {
    const { result } = renderHook(() => usePathFloors([]));
    expect(result.current).toEqual([]);
  });

  it('returns floors from path', () => {
    const mockPath = [
      { id: 'Hall_F8_room_291', data: { x: 100, y: 100 } },
      { id: 'Hall_F9_room_202', data: { x: 200, y: 200 } },
    ];
    (Pathfinding.getFloorsInPath as jest.Mock).mockReturnValue([8, 9]);

    const { result } = renderHook(() => usePathFloors(mockPath));
    expect(result.current).toEqual([8, 9]);
  });
});

describe('usePathSegments', () => {
  it('returns empty array for null path', () => {
    const { result } = renderHook(() => usePathSegments(null));
    expect(result.current).toEqual([]);
  });

  it('returns empty array for empty path', () => {
    const { result } = renderHook(() => usePathSegments([]));
    expect(result.current).toEqual([]);
  });

  it('returns segments from path', () => {
    const mockPath = [
      { id: 'Hall_F8_room_291', data: { x: 100, y: 100 } },
      { id: 'Hall_F9_room_202', data: { x: 200, y: 200 } },
    ];
    const mockSegments = [
      { floor: 8, nodes: [mockPath[0]] },
      { floor: 9, nodes: [mockPath[1]] },
    ];
    (Pathfinding.splitPathByFloor as jest.Mock).mockReturnValue(mockSegments);

    const { result } = renderHook(() => usePathSegments(mockPath));
    expect(result.current).toEqual(mockSegments);
  });
});

describe('useSvgPathForFloor', () => {
  it('returns empty string for null path', () => {
    const { result } = renderHook(() => useSvgPathForFloor(null, 8));
    expect(result.current).toBe('');
  });

  it('returns empty string for empty path', () => {
    const { result } = renderHook(() => useSvgPathForFloor([], 8));
    expect(result.current).toBe('');
  });

  it('generates SVG path for specific floor', () => {
    const mockPath = [
      { id: 'Hall_F8_room_291', data: { x: 100, y: 100 } },
      { id: 'Hall_F8_room_292', data: { x: 200, y: 200 } },
    ];
    (Pathfinding.generateSvgPathForFloor as jest.Mock).mockReturnValue('M 100 100 L 200 200');

    const { result } = renderHook(() => useSvgPathForFloor(mockPath, 8));
    expect(result.current).toBe('M 100 100 L 200 200');
    expect(Pathfinding.generateSvgPathForFloor).toHaveBeenCalledWith(mockPath, 8);
  });
});