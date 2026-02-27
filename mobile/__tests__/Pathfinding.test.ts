import { findPath, generateSvgPath } from '../src/utils/Pathfinding';
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
