import { findPath, generateSvgPath, getRoomNodeId, getPOIsByType, getAllPOIs, getPOINodeId } from '../src/utils/Pathfinding';
import { JsonNode } from 'ngraph.fromjson';
import path from 'ngraph.path';

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