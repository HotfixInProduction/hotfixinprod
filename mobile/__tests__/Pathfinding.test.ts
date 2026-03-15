import { findPath, generateSvgPath, getRoomNodeId, getPOIsByType, getAllPOIs, getPOINodeId } from '../src/utils/Pathfinding';
import { JsonNode } from 'ngraph.fromjson';
import path from 'ngraph.path';

describe('Pathfinding', () => {
  describe('findPath', () => {
    it('should find a path between two connected nodes', () => {
      // Node 19 connects to 90, and 90 connects to 20 (path: 19 -> 90 -> 20)
      const path = findPath('Hall Building', '8', 19, 20);

      expect(path).not.toBeNull();
      expect(path?.length).toBe(3);
      expect(path?.[0].id).toBe('19');
      expect(path?.[2].id).toBe('20');
    });

    it('should find a path between distant nodes', () => {
      const path = findPath('Hall Building', '8', 19, 83);

      expect(path).not.toBeNull();
      expect(path?.length).toBeGreaterThan(2);
      expect(path?.[0].id).toBe('19');
      expect(path?.[path.length - 1].id).toBe('83');
    });

    it('should return null for non-existent building', () => {
      const path = findPath('Unknown Building', '1', 19, 20);

      expect(path).toBeNull();
    });

    it('should return null for non-existent start node', () => {
      const path = findPath('Hall Building', '8', 9999, 19);

      expect(path).toBeNull();
    });

    it('should return null for non-existent end node', () => {
      const path = findPath('Hall Building', '8', 19, 9999);

      expect(path).toBeNull();
    });

    it('should return single node path when start equals end', () => {
      const path = findPath('Hall Building', '8', 19, 19);

      expect(path).not.toBeNull();
      expect(path?.length).toBe(1);
      expect(path?.[0].id).toBe('19');
    });

    it('should find optimal path (A* optimality)', () => {
      // Path: 19 -> 90 -> 20 -> 21 -> 22 (5 nodes)
      const path = findPath('Hall Building', '8', 19, 22);

      expect(path).not.toBeNull();
      expect(path?.length).toBeLessThanOrEqual(5);
    });

    it('should return null for incorrect building name', () => {
      const path = findPath('hall', '8', 19, 20);

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
      const nodeId = getRoomNodeId('Hall Building', '8', '829');
      expect(nodeId).toBe(67);
    });

    it('should return node ID for room label with decimal point', () => {
      const nodeId = getRoomNodeId('Hall Building', '8', '802.01');
      expect(nodeId).toBe(20);
    });

    it('should return node ID for elevator room label', () => {
      const nodeId = getRoomNodeId('Hall Building', '8', '8el1');
      expect(nodeId).toBe(41);
    });

    it('should return node ID for another elevator room label', () => {
      const nodeId = getRoomNodeId('Hall Building', '8', '8el2');
      expect(nodeId).toBe(41);
    });

    it('should return null for non-existent room label', () => {
      const nodeId = getRoomNodeId('Hall Building', '8', '999');
      expect(nodeId).toBeNull();
    });

    it('should return the correct node ID for room 801', () => {
      const nodeId = getRoomNodeId('Hall Building', '8', '801');
      expect(nodeId).toBe(17);
    });

    it('should return the same node ID for rooms mapped to same node', () => {
      // 822 and 865 both map to node 2
      const nodeId1 = getRoomNodeId('Hall Building', '8', '863');
      const nodeId2 = getRoomNodeId('Hall Building', '8', '865');
      expect(nodeId1).toBe(2);
      expect(nodeId2).toBe(2);
    });
  });

  describe('Hall Building floor 9', () => {
    it('should return node ID for a valid room label on floor 9', () => {
      const nodeId = getRoomNodeId('Hall Building', '9', '920');
      expect(nodeId).toBe(11);
    });

    it('should return node ID for room label with decimal on floor 9', () => {
      const nodeId = getRoomNodeId('Hall Building', '9', '927.01');
      expect(nodeId).toBe(14);
    });

    it('should return node ID for elevator room label on floor 9', () => {
      const nodeId = getRoomNodeId('Hall Building', '9', '9elv');
      expect(nodeId).toBe(43);
    });

    it('should return null for non-existent room label on floor 9', () => {
      const nodeId = getRoomNodeId('Hall Building', '9', '9999');
      expect(nodeId).toBeNull();
    });
  });

  describe('John Molson Building', () => {
    it('should return node ID for a valid room on floor S2', () => {
      const nodeId = getRoomNodeId('John Molson Building', 'S2', '245');
      expect(nodeId).toBe(55);
    });

    it('should return node ID for another valid room on floor S2', () => {
      const nodeId = getRoomNodeId('John Molson Building', 'S2', '330');
      expect(nodeId).toBe(3);
    });

    it('should return node ID for a valid room on floor 1', () => {
      const nodeId = getRoomNodeId('John Molson Building', '1', '1.294');
      expect(nodeId).toBe(49);
    });

    it('should return node ID for another valid room on floor 1', () => {
      const nodeId = getRoomNodeId('John Molson Building', '1', '1.115');
      expect(nodeId).toBe(42);
    });

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

    it('should return null for non-existent floor level', () => {
      const nodeId = getRoomNodeId('Hall Building', '99', '801');
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

    it('should return null for empty floor level', () => {
      const nodeId = getRoomNodeId('Hall Building', '', '801');
      expect(nodeId).toBeNull();
    });
  });

  describe('return type validation', () => {
    it('should return a number when room is found', () => {
      const nodeId = getRoomNodeId('Hall Building', '8', '801');
      expect(typeof nodeId).toBe('number');
    });

    it('should return null (not undefined) when room is not found', () => {
      const nodeId = getRoomNodeId('Hall Building', '8', 'nonexistent');
      expect(nodeId).toBeNull();
    });

    it('should return integer node IDs', () => {
      const nodeId = getRoomNodeId('Hall Building', '8', '801');
      expect(Number.isInteger(nodeId)).toBe(true);
    });
  });
});

describe('pathfinder edge cases', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return null when pathfinder finds no path (empty result)', () => {
      jest.spyOn(path, 'aStar').mockReturnValue({ find: () => [] } as any);
      const result = findPath('Hall Building', '8', 19, 20);
      expect(result).toBeNull();
    });

    it('should use fallback distance of 1 when nodes lack position data', () => {
      let capturedOptions: any;
      jest.spyOn(path, 'aStar').mockImplementation((_graph: any, options: any) => {
        capturedOptions = options;
        return { find: () => [] } as any;
      });

      findPath('Hall Building', '8', 19, 20);

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

      findPath('Hall Building', '8', 19, 20);

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
      const elevators = getPOIsByType('Hall Building', '8', 'elevator');
      expect(elevators.length).toBe(2);
      expect(elevators.map(e => e.nodeId)).toContain('41');
    });

    it('should return escalators on floor 8', () => {
      const escalators = getPOIsByType('Hall Building', '8', 'escalator');
      expect(escalators.length).toBe(2);
      expect(escalators[0].type).toBe('escalator');
    });

    it('should return stairs on floor 8', () => {
      const stairs = getPOIsByType('Hall Building', '8', 'stairs');
      expect(stairs.length).toBe(4);
    });

    it('should return washrooms on floor 8', () => {
      const washrooms = getPOIsByType('Hall Building', '8', 'washroom');
      expect(washrooms.length).toBe(2);
    });

    it('should return empty array for water_fountain (none defined)', () => {
      const fountains = getPOIsByType('Hall Building', '8', 'water_fountain');
      expect(fountains).toEqual([]);
    });

    it('should include label in returned POIs', () => {
      const elevators = getPOIsByType('Hall Building', '8', 'elevator');
      expect(elevators[0].label).toBeDefined();
    });
  });

  describe('Hall Building floor 9', () => {
    it('should return elevator on floor 9', () => {
      const elevators = getPOIsByType('Hall Building', '9', 'elevator');
      expect(elevators.length).toBe(1);
      expect(elevators[0].nodeId).toBe('43');
    });

    it('should return escalators on floor 9', () => {
      const escalators = getPOIsByType('Hall Building', '9', 'escalator');
      expect(escalators.length).toBe(2);
      expect(escalators.map(e => e.label)).toContain('Escalator Entry');
      expect(escalators.map(e => e.label)).toContain('Escalator Exit');
    });

    it('should return stairs on floor 9', () => {
      const stairs = getPOIsByType('Hall Building', '9', 'stairs');
      expect(stairs.length).toBe(4);
    });
  });

  describe('John Molson Building', () => {
    it('should return empty array for floor with no POIs defined (S2)', () => {
      const elevators = getPOIsByType('John Molson Building', 'S2', 'elevator');
      expect(elevators).toEqual([]);
    });

    it('should return empty array for floor with no POIs defined (1)', () => {
      const washrooms = getPOIsByType('John Molson Building', '1', 'washroom');
      expect(washrooms).toEqual([]);
    });
  });

  describe('error cases', () => {
    it('should return empty array for non-existent building', () => {
      const pois = getPOIsByType('Unknown Building', '8', 'elevator');
      expect(pois).toEqual([]);
    });

    it('should return empty array for non-existent floor', () => {
      const pois = getPOIsByType('Hall Building', '99', 'elevator');
      expect(pois).toEqual([]);
    });
  });
});

describe('getAllPOIs', () => {
  it('should return all POIs on floor 8', () => {
    const pois = getAllPOIs('Hall Building', '8');
    expect(Object.keys(pois).length).toBe(10); // 2 elevators + 2 escalators + 4 stairs + 2 washrooms
  });

  it('should return POI with correct structure', () => {
    const pois = getAllPOIs('Hall Building', '8');
    const elevator = pois['8el1'];
    expect(elevator).toBeDefined();
    expect(elevator.nodeId).toBe('41');
    expect(elevator.type).toBe('elevator');
    expect(elevator.label).toBe('Elevator 1');
  });

  it('should return empty object for floor with no POIs', () => {
    const pois = getAllPOIs('John Molson Building', 'S2');
    expect(pois).toEqual({});
  });

  it('should return empty object for non-existent building', () => {
    const pois = getAllPOIs('Unknown Building', '8');
    expect(pois).toEqual({});
  });
});

describe('getPOINodeId', () => {
  describe('Hall Building floor 8', () => {
    it('should return node ID for elevator POI', () => {
      const nodeId = getPOINodeId('Hall Building', '8', '8el1');
      expect(nodeId).toBe(41);
    });

    it('should return node ID for washroom POI', () => {
      const nodeId = getPOINodeId('Hall Building', '8', '8wr1');
      expect(nodeId).toBe(20);
    });

    it('should return node ID for stairs POI', () => {
      const nodeId = getPOINodeId('Hall Building', '8', '8st1');
      expect(nodeId).toBe(95);
    });

    it('should return null for non-existent POI label', () => {
      const nodeId = getPOINodeId('Hall Building', '8', 'nonexistent');
      expect(nodeId).toBeNull();
    });
  });

  describe('Hall Building floor 9', () => {
    it('should return node ID for elevator POI', () => {
      const nodeId = getPOINodeId('Hall Building', '9', '9elv');
      expect(nodeId).toBe(43);
    });

    it('should return node ID for escalator POI', () => {
      const nodeId = getPOINodeId('Hall Building', '9', '9esc_exit');
      expect(nodeId).toBe(99);
    });
  });

  describe('error cases', () => {
    it('should return null for non-existent building', () => {
      const nodeId = getPOINodeId('Unknown Building', '8', '8el1');
      expect(nodeId).toBeNull();
    });

    it('should return null for non-existent floor', () => {
      const nodeId = getPOINodeId('Hall Building', '99', '8el1');
      expect(nodeId).toBeNull();
    });

    it('should return null for floor with no POIs', () => {
      const nodeId = getPOINodeId('John Molson Building', 'S2', 'any');
      expect(nodeId).toBeNull();
    });
  });

  describe('return type validation', () => {
    it('should return a number when POI is found', () => {
      const nodeId = getPOINodeId('Hall Building', '8', '8el1');
      expect(typeof nodeId).toBe('number');
    });

    it('should return integer node IDs', () => {
      const nodeId = getPOINodeId('Hall Building', '8', '8el1');
      expect(Number.isInteger(nodeId)).toBe(true);
    });
  });
});
