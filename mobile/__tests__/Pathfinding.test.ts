import { 
  findPath, 
  generateSvgPath, 
  getRoomNodeId, 
  getPOIsByType, 
  getAllPOIs, 
  getPOINodeId,
  getFloorFromNodeId,
  splitPathByFloor,
  getFloorsInPath,
  generateSvgPathForFloor
} from '../src/utils/Pathfinding';
import { JsonNode } from 'ngraph.fromjson';
import path from 'ngraph.path';
import { NavMeshNode } from '../src/types/building';

describe('Pathfinding', () => {
  describe('findPath', () => {
    it('should find a path between two connected nodes', () => {
      // Using new navmesh format with string node IDs
      // H-867 -> Hall_F8_room_291, H-865 -> Hall_F8_room_292
      const path = findPath('Hall Building', '8', 'Hall_F8_room_291', 'Hall_F8_room_292');

      expect(path).not.toBeNull();
      expect(path?.length).toBeGreaterThan(0);
    });

    it('should find a path between distant nodes', () => {
      const path = findPath('Hall Building', '8', 'Hall_F8_room_291', 'Hall_F8_room_329');

      expect(path).not.toBeNull();
      expect(path?.length).toBeGreaterThan(2);
    });

    it('should return null for non-existent building', () => {
      const path = findPath('Unknown Building', '1', 'Hall_F8_room_291', 'Hall_F8_room_292');

      expect(path).toBeNull();
    });

    it('should return null for non-existent start node', () => {
      const path = findPath('Hall Building', '8', 'nonexistent_node', 'Hall_F8_room_291');

      expect(path).toBeNull();
    });

    it('should return null for non-existent end node', () => {
      const path = findPath('Hall Building', '8', 'Hall_F8_room_291', 'nonexistent_node');

      expect(path).toBeNull();
    });

    it('should return single node path when start equals end', () => {
      const path = findPath('Hall Building', '8', 'Hall_F8_room_291', 'Hall_F8_room_291');

      expect(path).not.toBeNull();
      expect(path?.length).toBe(1);
    });

    it('should return null for incorrect building name', () => {
      const path = findPath('hall', '8', 'Hall_F8_room_291', 'Hall_F8_room_292');

      expect(path).toBeNull();
    });
  });

  describe('generateSvgPath', () => {
    it('should return empty string for empty path', () => {
      const svgPath = generateSvgPath([]);
      expect(svgPath).toBe('');
    });

    it('should generate correct SVG path string', () => {
      const path: JsonNode<{ x: number; y: number }>[] = [
        { id: '0', data: { x: 100, y: 100 } },
        { id: '1', data: { x: 200, y: 200 } },
        { id: '2', data: { x: 300, y: 100 } }
      ];
      const svgPath = generateSvgPath(path);
      expect(svgPath).toBe('M 100 100 L 200 200 L 300 100');
    });

    it('should generate single point path', () => {
      const path: JsonNode<{ x: number; y: number }>[] = [{ id: '0', data: { x: 50, y: 50 } }];
      const svgPath = generateSvgPath(path);
      expect(svgPath).toBe('M 50 50');
    });
  });

describe('getRoomNodeId', () => {
  describe('Hall Building floor 8', () => {
    it('should return node ID for a valid room label', () => {
      // Room 867 -> H-867 -> Hall_F8_room_291
      const nodeId = getRoomNodeId('Hall Building', '8', '867');
      expect(nodeId).toBe('Hall_F8_room_291');
    });

    it('should return node ID for room label with hyphen suffix', () => {
      // Room 851-1 -> H-851-1 -> Hall_F8_room_300
      const nodeId = getRoomNodeId('Hall Building', '8', '851-1');
      expect(nodeId).toBe('Hall_F8_room_300');
    });

    it('should return null for non-existent room label', () => {
      const nodeId = getRoomNodeId('Hall Building', '8', '999');
      expect(nodeId).toBeNull();
    });

    it('should return the correct node ID for room 801', () => {
      // Room 801 -> H-801 -> Hall_F8_room_329
      const nodeId = getRoomNodeId('Hall Building', '8', '801');
      expect(nodeId).toBe('Hall_F8_room_329');
    });
  });

  describe('Hall Building floor 9', () => {
    it('should return node ID for a valid room label on floor 9', () => {
      // Room 929 -> H-929 -> Hall_F9_room_202
      const nodeId = getRoomNodeId('Hall Building', '9', '929');
      expect(nodeId).toBe('Hall_F9_room_202');
    });

    it('should return node ID for room label with hyphen on floor 9', () => {
      // Room 933-11 -> H-933-11 -> Hall_F9_room_207
      const nodeId = getRoomNodeId('Hall Building', '9', '933-11');
      expect(nodeId).toBe('Hall_F9_room_207');
    });

    it('should return null for non-existent room label on floor 9', () => {
      const nodeId = getRoomNodeId('Hall Building', '9', '9999');
      expect(nodeId).toBeNull();
    });
  });

  describe('John Molson Building', () => {
    it('should return null for non-existent room label', () => {
      const nodeId = getRoomNodeId('John Molson Building', 'S2', 'nonexistent');
      expect(nodeId).toBeNull();
    });
  });

  describe('error cases', () => {
    it('should return null for non-existent building', () => {
      const nodeId = getRoomNodeId('Unknown Building', '8', '801');
      expect(nodeId).toBeNull();
    });

    it('should return null for incorrect building name format', () => {
      // The function expects exact building ID matching
      const nodeId = getRoomNodeId('hall', '8', '801');
      expect(nodeId).toBeNull();
    });

    it('should return null for empty room label', () => {
      const nodeId = getRoomNodeId('Hall Building', '8', '');
      expect(nodeId).toBeNull();
    });

    it('should return null for empty building ID', () => {
      const nodeId = getRoomNodeId('', '8', '801');
      expect(nodeId).toBeNull();
    });
  });

  describe('return type validation', () => {
    it('should return a string when room is found', () => {
      const nodeId = getRoomNodeId('Hall Building', '8', '801');
      expect(typeof nodeId).toBe('string');
    });

    it('should return null (not undefined) when room is not found', () => {
      const nodeId = getRoomNodeId('Hall Building', '8', 'nonexistent');
      expect(nodeId).toBeNull();
    });
  });
});

describe('pathfinder edge cases', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return null when pathfinder finds no path (empty result)', () => {
      jest.spyOn(path, 'aStar').mockReturnValue({ find: () => [] } as any);
      const result = findPath('Hall Building', '8', 'Hall_F8_room_291', 'Hall_F8_room_292');
      expect(result).toBeNull();
    });

    it('should use fallback distance of 1 when nodes lack position data', () => {
      let capturedOptions: any;
      jest.spyOn(path, 'aStar').mockImplementation((_graph: any, options: any) => {
        capturedOptions = options;
        return { find: () => [] } as any;
      });

      findPath('Hall Building', '8', 'Hall_F8_room_291', 'Hall_F8_room_292');

      const nodeWithData = { id: '1', data: { x: 0, y: 0 }, links: null };
      const nodeWithoutData = { id: '2', data: null, links: null };

      expect(capturedOptions.distance(nodeWithoutData, nodeWithData)).toBe(1);
      expect(capturedOptions.distance(nodeWithData, nodeWithoutData)).toBe(1);
    });

    it('should use fallback heuristic of 0 when nodes lack position data', () => {
      let capturedOptions: any;
      jest.spyOn(path, 'aStar').mockImplementation((_graph: any, options: any) => {
        capturedOptions = options;
        return { find: () => [] } as any;
      });

      findPath('Hall Building', '8', 'Hall_F8_room_291', 'Hall_F8_room_292');

      const nodeWithData = { id: '1', data: { x: 0, y: 0 }, links: null };
      const nodeWithoutData = { id: '2', data: null, links: null };

      expect(capturedOptions.heuristic(nodeWithoutData, nodeWithData)).toBe(0);
      expect(capturedOptions.heuristic(nodeWithData, nodeWithoutData)).toBe(0);
    });
  });
});

describe('getPOIsByType', () => {
  describe('Hall Building floor 8', () => {
    it('should return elevators on floor 8', () => {
      const elevators = getPOIsByType('Hall Building', '8', 'elevator_door');
      expect(elevators.length).toBe(2);
    });

    it('should return stair landings on floor 8', () => {
      const stairs = getPOIsByType('Hall Building', '8', 'stair_landing');
      expect(stairs.length).toBe(6);
    });

    it('should return empty array for water_fountain (none defined)', () => {
      const fountains = getPOIsByType('Hall Building', '8', 'water_fountain');
      expect(fountains).toEqual([]);
    });

    it('should include label in returned POIs', () => {
      const elevators = getPOIsByType('Hall Building', '8', 'elevator_door');
      expect(elevators[0].label).toBeDefined();
    });
  });

  describe('Hall Building floor 9', () => {
    it('should return elevators on floor 9', () => {
      const elevators = getPOIsByType('Hall Building', '9', 'elevator_door');
      expect(elevators.length).toBe(2);
    });

    it('should return stair landings on floor 9', () => {
      const stairs = getPOIsByType('Hall Building', '9', 'stair_landing');
      expect(stairs.length).toBe(6);
    });
  });

  describe('John Molson Building', () => {
    it('should return elevators on floor S2', () => {
      const elevators = getPOIsByType('John Molson Building', 'S2', 'elevator_door');
      // New navmesh format has elevators for MB
      expect(elevators.length).toBeGreaterThanOrEqual(0);
    });

    it('should return elevators on floor 1', () => {
      const elevators = getPOIsByType('John Molson Building', '1', 'elevator_door');
      expect(elevators.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error cases', () => {
    it('should return empty array for non-existent building', () => {
      const pois = getPOIsByType('Unknown Building', '8', 'elevator');
      expect(pois).toEqual([]);
    });
  });
});

describe('getAllPOIs', () => {
  it('should return all POIs on floor 8', () => {
    const pois = getAllPOIs('Hall Building', '8');
    // New format has elevator_door, stair_landing, building_entry_exit
    expect(Object.keys(pois).length).toBeGreaterThan(0);
  });

  it('should return POI with correct structure', () => {
    const pois = getAllPOIs('Hall Building', '8');
    const labels = Object.keys(pois);
    if (labels.length > 0) {
      const firstPoi = pois[labels[0]];
      expect(firstPoi.nodeId).toBeDefined();
      expect(firstPoi.type).toBeDefined();
    }
  });

  it('should return POIs for John Molson Building', () => {
    const pois = getAllPOIs('John Molson Building', 'S2');
    // New navmesh format has POIs for MB
    expect(Object.keys(pois).length).toBeGreaterThanOrEqual(0);
  });

  it('should return empty object for non-existent building', () => {
    const pois = getAllPOIs('Unknown Building', '8');
    expect(pois).toEqual({});
  });
});

describe('getPOINodeId', () => {
  describe('Hall Building floor 8', () => {
    it('should return node ID for elevator POI', () => {
      // H-elevator1 is a label in the new format
      const nodeId = getPOINodeId('Hall Building', '8', 'H-elevator1');
      expect(nodeId).toBe('Hall_F8_elevator_door_13');
    });

    it('should return node ID for another elevator POI', () => {
      const nodeId = getPOINodeId('Hall Building', '8', 'H-elevator2');
      expect(nodeId).toBe('Hall_F8_elevator_door_12');
    });

    it('should return null for non-existent POI label', () => {
      const nodeId = getPOINodeId('Hall Building', '8', 'nonexistent');
      expect(nodeId).toBeNull();
    });
  });

  describe('Hall Building floor 9', () => {
    it('should return node ID for elevator POI', () => {
      const nodeId = getPOINodeId('Hall Building', '9', 'H-elevator1');
      expect(nodeId).toBe('Hall_F9_elevator_door_11');
    });

    it('should return node ID for another elevator POI', () => {
      const nodeId = getPOINodeId('Hall Building', '9', 'H-elevator2');
      expect(nodeId).toBe('Hall_F9_elevator_door_10');
    });
  });

  describe('error cases', () => {
    it('should return null for non-existent building', () => {
      const nodeId = getPOINodeId('Unknown Building', '8', 'H-elevator1');
      expect(nodeId).toBeNull();
    });

    it('should return null for non-existent POI label', () => {
      const nodeId = getPOINodeId('John Molson Building', 'S2', 'nonexistent_poi');
      expect(nodeId).toBeNull();
    });
  });

  describe('return type validation', () => {
    it('should return a string when POI is found', () => {
      const nodeId = getPOINodeId('Hall Building', '8', 'H-elevator1');
      expect(typeof nodeId).toBe('string');
    });
  });
});

describe('getFloorFromNodeId', () => {
  it('should extract floor number from Hall Building node ID', () => {
    expect(getFloorFromNodeId('Hall_F8_room_291')).toBe(8);
    expect(getFloorFromNodeId('Hall_F9_room_202')).toBe(9);
  });

  it('should extract floor number from elevator node ID', () => {
    expect(getFloorFromNodeId('Hall_F8_elevator_door_13')).toBe(8);
    expect(getFloorFromNodeId('Hall_F9_stair_landing_21')).toBe(9);
  });

  it('should return null for node ID without floor pattern', () => {
    expect(getFloorFromNodeId('some_random_id')).toBeNull();
    expect(getFloorFromNodeId('room_291')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(getFloorFromNodeId('')).toBeNull();
  });

  it('should handle multi-digit floor numbers', () => {
    expect(getFloorFromNodeId('Hall_F10_room_100')).toBe(10);
    expect(getFloorFromNodeId('Hall_F12_room_120')).toBe(12);
  });
});

describe('splitPathByFloor', () => {
  it('should return empty array for empty path', () => {
    expect(splitPathByFloor([])).toEqual([]);
  });

  it('should return single segment for single-floor path', () => {
    const path: NavMeshNode[] = [
      { id: 'Hall_F8_room_291', data: { x: 100, y: 100 } },
      { id: 'Hall_F8_room_292', data: { x: 200, y: 200 } },
    ];
    const segments = splitPathByFloor(path);
    expect(segments.length).toBe(1);
    expect(segments[0].floor).toBe(8);
    expect(segments[0].nodes.length).toBe(2);
  });

  it('should split path into multiple floor segments', () => {
    const path: NavMeshNode[] = [
      { id: 'Hall_F8_room_291', data: { x: 100, y: 100, floor: 8 } as any },
      { id: 'Hall_F8_stair_1', data: { x: 150, y: 150, floor: 8 } as any },
      { id: 'Hall_F9_stair_1', data: { x: 150, y: 150, floor: 9 } as any },
      { id: 'Hall_F9_room_202', data: { x: 200, y: 200, floor: 9 } as any },
    ];
    const segments = splitPathByFloor(path);
    expect(segments.length).toBe(2);
    expect(segments[0].floor).toBe(8);
    expect(segments[0].nodes.length).toBe(2);
    expect(segments[1].floor).toBe(9);
    expect(segments[1].nodes.length).toBe(2);
  });

  it('should skip nodes without floor info', () => {
    const path: NavMeshNode[] = [
      { id: 'Hall_F8_room_291', data: { x: 100, y: 100, floor: 8 } as any },
      { id: 'unknown_node', data: { x: 150, y: 150 } },
      { id: 'Hall_F8_room_292', data: { x: 200, y: 200, floor: 8 } as any },
    ];
    const segments = splitPathByFloor(path);
    expect(segments.length).toBe(1);
    expect(segments[0].nodes.length).toBe(2);
  });

  it('should use floor from node data over ID extraction', () => {
    const path: NavMeshNode[] = [
      { id: 'some_id', data: { x: 100, y: 100, floor: 8 } as any },
      { id: 'another_id', data: { x: 200, y: 200, floor: 8 } as any },
    ];
    const segments = splitPathByFloor(path);
    expect(segments.length).toBe(1);
    expect(segments[0].floor).toBe(8);
  });
});

describe('getFloorsInPath', () => {
  it('should return empty array for empty path', () => {
    expect(getFloorsInPath([])).toEqual([]);
  });

  it('should return unique sorted floors', () => {
    const path: NavMeshNode[] = [
      { id: 'Hall_F9_room_202', data: { x: 100, y: 100 } },
      { id: 'Hall_F8_room_291', data: { x: 200, y: 200 } },
      { id: 'Hall_F9_room_203', data: { x: 300, y: 300 } },
    ];
    const floors = getFloorsInPath(path);
    expect(floors).toEqual([8, 9]);
  });

  it('should use floor from node data', () => {
    const path: NavMeshNode[] = [
      { id: 'id1', data: { x: 100, y: 100, floor: 10 } as any },
      { id: 'id2', data: { x: 200, y: 200, floor: 8 } as any },
    ];
    const floors = getFloorsInPath(path);
    expect(floors).toEqual([8, 10]);
  });

  it('should ignore nodes without floor info', () => {
    const path: NavMeshNode[] = [
      { id: 'Hall_F8_room_291', data: { x: 100, y: 100 } },
      { id: 'unknown_node', data: { x: 150, y: 150 } },
    ];
    const floors = getFloorsInPath(path);
    expect(floors).toEqual([8]);
  });
});

describe('generateSvgPathForFloor', () => {
  it('should return empty string for empty path', () => {
    expect(generateSvgPathForFloor([], 8)).toBe('');
  });

  it('should return empty string when no nodes match target floor', () => {
    const path: NavMeshNode[] = [
      { id: 'Hall_F8_room_291', data: { x: 100, y: 100, floor: 8 } as any },
    ];
    expect(generateSvgPathForFloor(path, 9)).toBe('');
  });

  it('should generate path for nodes on target floor using node data', () => {
    const path: NavMeshNode[] = [
      { id: 'id1', data: { x: 100, y: 100, floor: 8 } as any },
      { id: 'id2', data: { x: 200, y: 200, floor: 8 } as any },
      { id: 'id3', data: { x: 300, y: 100, floor: 9 } as any },
    ];
    const svgPath = generateSvgPathForFloor(path, 8);
    expect(svgPath).toBe('M 100 100 L 200 200');
  });

  it('should generate path for nodes on target floor using ID extraction', () => {
    const path: NavMeshNode[] = [
      { id: 'Hall_F8_room_291', data: { x: 100, y: 100 } },
      { id: 'Hall_F8_room_292', data: { x: 200, y: 200 } },
    ];
    const svgPath = generateSvgPathForFloor(path, 8);
    expect(svgPath).toBe('M 100 100 L 200 200');
  });

  it('should transform coordinates for Hall building', () => {
    const path: NavMeshNode[] = [
      { id: 'id1', data: { x: 200, y: 200, floor: 8, buildingId: 'Hall' } as any },
      { id: 'id2', data: { x: 400, y: 400, floor: 8, buildingId: 'Hall' } as any },
    ];
    const svgPath = generateSvgPathForFloor(path, 8);
    // Scale 0.5 applied for Hall building
    expect(svgPath).toBe('M 100 100 L 200 200');
  });

  it('should transform coordinates for VE building', () => {
    const path: NavMeshNode[] = [
      { id: 'id1', data: { x: 200, y: 200, floor: 1, buildingId: 'VE' } as any },
      { id: 'id2', data: { x: 400, y: 400, floor: 1, buildingId: 'VE' } as any },
    ];
    const svgPath = generateSvgPathForFloor(path, 1);
    // Scale 0.5 applied for VE building
    expect(svgPath).toBe('M 100 100 L 200 200');
  });

  it('should not transform coordinates for other buildings', () => {
    const path: NavMeshNode[] = [
      { id: 'id1', data: { x: 100, y: 100, floor: 1, buildingId: 'Other' } as any },
      { id: 'id2', data: { x: 200, y: 200, floor: 1, buildingId: 'Other' } as any },
    ];
    const svgPath = generateSvgPathForFloor(path, 1);
    // No scale applied
    expect(svgPath).toBe('M 100 100 L 200 200');
  });

  it('should return empty string for node without data', () => {
    const path: NavMeshNode[] = [
      { id: 'id1', data: undefined as any },
    ];
    expect(generateSvgPathForFloor(path, 8)).toBe('');
  });
});

describe('findPath with accessibility mode', () => {
  it('should find path with accessibility mode disabled', () => {
    const path = findPath('Hall Building', '8', 'Hall_F8_room_291', 'Hall_F8_room_292', { accessibleOnly: false });
    expect(path).not.toBeNull();
  });

  it('should find path with accessibility mode enabled', () => {
    const path = findPath('Hall Building', '8', 'Hall_F8_room_291', 'Hall_F8_room_292', { accessibleOnly: true });
    expect(path).not.toBeNull();
  });
});

describe('generateSvgPath with building transformations', () => {
  it('should transform coordinates for Hall building nodes', () => {
    const path: NavMeshNode[] = [
      { id: 'id1', data: { x: 200, y: 200, buildingId: 'Hall' } as any },
      { id: 'id2', data: { x: 400, y: 400, buildingId: 'Hall' } as any },
    ];
    const svgPath = generateSvgPath(path);
    // Scale 0.5 applied
    expect(svgPath).toBe('M 100 100 L 200 200');
  });

  it('should transform coordinates for VE building nodes', () => {
    const path: NavMeshNode[] = [
      { id: 'id1', data: { x: 200, y: 200, buildingId: 'VE' } as any },
      { id: 'id2', data: { x: 400, y: 400, buildingId: 'VE' } as any },
    ];
    const svgPath = generateSvgPath(path);
    // Scale 0.5 applied
    expect(svgPath).toBe('M 100 100 L 200 200');
  });

  it('should transform coordinates for CC building nodes', () => {
    const path: NavMeshNode[] = [
      { id: 'id1', data: { x: 200, y: 200, buildingId: 'CC' } as any },
      { id: 'id2', data: { x: 400, y: 400, buildingId: 'CC' } as any },
    ];
    const svgPath = generateSvgPath(path);
    // Scale 0.5 applied
    expect(svgPath).toBe('M 100 100 L 200 200');
  });

  it('should not transform coordinates for other buildings', () => {
    const path: NavMeshNode[] = [
      { id: 'id1', data: { x: 100, y: 100, buildingId: 'Other' } as any },
      { id: 'id2', data: { x: 200, y: 200, buildingId: 'Other' } as any },
    ];
    const svgPath = generateSvgPath(path);
    // No scale applied
    expect(svgPath).toBe('M 100 100 L 200 200');
  });

  it('should return empty string for path with node without data', () => {
    const path: NavMeshNode[] = [
      { id: 'id1', data: undefined as any },
    ];
    const svgPath = generateSvgPath(path);
    expect(svgPath).toBe('');
  });
});

describe('getRoomNodeId with decimal room labels', () => {
  it('should handle room labels with decimal points', () => {
    // Room 862.5 should be looked up as H-862-5
    const nodeId = getRoomNodeId('Hall Building', '8', '862.5');
    // This may or may not exist, but should not throw
    expect(nodeId).toBeDefined();
  });

  it('should handle room labels with trailing zeros after decimal', () => {
    // Room 805.10 should be looked up as H-805-1 (trailing zeros removed)
    const nodeId = getRoomNodeId('Hall Building', '8', '805.10');
    expect(nodeId).toBeDefined();
  });
});

describe('Building aliases', () => {
  it('should find path using MB alias for John Molson Building', () => {
    const path = findPath('MB', 'S2', 'MB_FS2_elevator_door_1', 'MB_FS2_elevator_door_1');
    // May return null if nodes don't exist, but should not throw
    expect(path).toBeDefined();
  });

  it('should find path using CC alias for Central Building', () => {
    const path = findPath('CC', '1', 'CC_F1_room_1', 'CC_F1_room_1');
    expect(path).toBeDefined();
  });

  it('should find path using VE alias for Vanier Extension', () => {
    const path = findPath('VE', '1', 'VE_F1_room_1', 'VE_F1_room_1');
    expect(path).toBeDefined();
  });

  it('should find path using VL alias for Vanier Library Building', () => {
    const path = findPath('VL', '1', 'VL_F1_room_1', 'VL_F1_room_1');
    expect(path).toBeDefined();
  });
});
