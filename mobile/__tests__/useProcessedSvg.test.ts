import { renderHook } from '@testing-library/react-native';
import { useProcessedSvg } from '../src/hooks/useProcessedSvg';
import { NavMeshNode } from '../src/types/building';

// Mock svgUtils
jest.mock('../src/utils/svgUtils', () => ({
    highlightRoomInSvg: jest.fn((svg, startRoom, nextRoom) => {
        // Simple mock that adds a highlight comment
        let result = svg || '';
        if (startRoom) result += `<!-- highlighted: ${startRoom} -->`;
        if (nextRoom) result += `<!-- next: ${nextRoom} -->`;
        return result;
    }),
    generatePathElements: jest.fn((pathString, startX, startY, endX, endY) => {
        return `<path d="${pathString}" start="${startX},${startY}" end="${endX},${endY}"/>`;
    }),
}));

// Mock Pathfinding module
jest.mock('../src/utils/Pathfinding', () => ({
    getFloorFromNodeId: jest.fn((nodeId: string) => {
        // Extract floor from node ID like "Hall_F8_room_291" -> 8
        const match = nodeId.match(/_F(\d+)_/);
        return match ? parseInt(match[1], 10) : null;
    }),
}));

describe('useProcessedSvg', () => {
    const mockSvgContent = '<svg><rect/></svg>';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('basic cases', () => {
        it('returns undefined when rawSvgContent is undefined', () => {
            const { result } = renderHook(() =>
                useProcessedSvg(undefined, null, '', undefined, undefined)
            );
            expect(result.current).toBeUndefined();
        });

        it('returns highlighted SVG when no path is provided', () => {
            const { result } = renderHook(() =>
                useProcessedSvg(mockSvgContent, null, '', undefined, undefined)
            );
            expect(result.current).toBe(mockSvgContent);
        });

        it('returns highlighted SVG when pathString is empty', () => {
            const path: NavMeshNode[] = [{ id: '1', data: { x: 0, y: 0 } }];
            const { result } = renderHook(() =>
                useProcessedSvg(mockSvgContent, path, '', undefined, undefined)
            );
            expect(result.current).toBe(mockSvgContent);
        });

        it('returns highlighted SVG with start and next room highlighting', () => {
            const { result } = renderHook(() =>
                useProcessedSvg(mockSvgContent, null, '', '801', '803')
            );
            expect(result.current).toContain('highlighted: 801');
            expect(result.current).toContain('next: 803');
        });
    });

    describe('path processing', () => {
        it('appends path to the end if SVG has no closing tag (malformed)', () => {
            // Provide malformed SVG content without an </svg> tag
            const malformedSvg = '<svg><rect/>';
            
            const path: NavMeshNode[] = [
                { id: 'start', data: { x: 10, y: 20 } },
                { id: 'end', data: { x: 100, y: 200 } },
            ];
            const pathString = 'M 10 20 L 100 200';

            const { result } = renderHook(() =>
                useProcessedSvg(malformedSvg, path, pathString, undefined, undefined)
            );

            // Because lastIndexOf('</svg>') returns -1, it falls through to the new fallback
            // which simply appends the <path> string to the end of the malformed SVG
            expect(result.current).toBe(malformedSvg + `<path d="${pathString}" start="10,20" end="100,200"/>`);
        });

        it('transforms coordinates for buildings that require scaling (Hall, VE, CC)', () => {
            const path: NavMeshNode[] = [
                // Set buildingId to 'Hall' to trigger the transformNavMeshCoordinates branch
                { id: 'start', data: { x: 100, y: 200, buildingId: 'Hall' } },
                { id: 'end', data: { x: 300, y: 400, buildingId: 'Hall' } },
            ];
            const pathString = 'M 50 100 L 150 200';

            const { result } = renderHook(() =>
                useProcessedSvg(mockSvgContent, path, pathString, undefined, undefined)
            );

            // Our mocked generatePathElements should receive the transformed coordinates (x * 0.5, y * 0.5)
            // 100 * 0.5 = 50, 200 * 0.5 = 100, etc.
            expect(result.current).toContain('start="50,100"');
            expect(result.current).toContain('end="150,200"');
        });

        it('processes path with valid start and end nodes', () => {
            const path: NavMeshNode[] = [
                { id: 'start', data: { x: 10, y: 20 } },
                { id: 'mid', data: { x: 50, y: 50 } },
                { id: 'end', data: { x: 100, y: 200 } },
            ];
            const pathString = 'M 10 20 L 100 200';

            const { result } = renderHook(() =>
                useProcessedSvg(mockSvgContent, path, pathString, undefined, undefined)
            );

            expect(result.current).toContain('<path');
            expect(result.current).toContain('</svg>');
        });

        it('returns highlighted SVG when startNode has no data', () => {
            // Path where start node has no data property - triggers the uncovered branch
            const path: NavMeshNode[] = [
                { id: 'start' }, // no data property
                { id: 'end', data: { x: 100, y: 200 } },
            ];
            const pathString = 'M 0 0 L 100 200';

            const { result } = renderHook(() =>
                useProcessedSvg(mockSvgContent, path, pathString, undefined, undefined)
            );

            // Should return just the highlighted SVG without path elements
            expect(result.current).toBe(mockSvgContent);
            expect(result.current).not.toContain('<path');
        });

        it('returns highlighted SVG when endNode has no data', () => {
            // Path where end node has no data property - triggers the uncovered branch
            const path: NavMeshNode[] = [
                { id: 'start', data: { x: 10, y: 20 } },
                { id: 'end' }, // no data property
            ];
            const pathString = 'M 10 20 L 0 0';

            const { result } = renderHook(() =>
                useProcessedSvg(mockSvgContent, path, pathString, undefined, undefined)
            );

            // Should return just the highlighted SVG without path elements
            expect(result.current).toBe(mockSvgContent);
            expect(result.current).not.toContain('<path');
        });

        it('returns highlighted SVG when both startNode and endNode have no data', () => {
            // Path where both nodes have no data property
            const path: NavMeshNode[] = [
                { id: 'start' },
                { id: 'end' },
            ];
            const pathString = 'M 0 0 L 100 100';

            const { result } = renderHook(() =>
                useProcessedSvg(mockSvgContent, path, pathString, undefined, undefined)
            );

            expect(result.current).toBe(mockSvgContent);
        });

        it('handles single node path with no data', () => {
            // Single node path with no data
            const path: NavMeshNode[] = [{ id: 'only' }];
            const pathString = 'M 0 0';

            const { result } = renderHook(() =>
                useProcessedSvg(mockSvgContent, path, pathString, undefined, undefined)
            );

            expect(result.current).toBe(mockSvgContent);
        });

        it('handles empty path array', () => {
            const path: NavMeshNode[] = [];
            const pathString = 'M 0 0';

            const { result } = renderHook(() =>
                useProcessedSvg(mockSvgContent, path, pathString, undefined, undefined)
            );

            // Empty array - startNode would be undefined
            expect(result.current).toBe(mockSvgContent);
        });
    });

    describe('__DEV__ console logging branches', () => {
        let originalDev: boolean;
        let consoleLogSpy: jest.SpyInstance;

        beforeEach(() => {
            originalDev = (global as any).__DEV__;
            consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        });

        afterEach(() => {
            (global as any).__DEV__ = originalDev;
            consoleLogSpy.mockRestore();
            jest.clearAllMocks();
        });

        it('covers __DEV__ log when no path provided', () => {
            (global as any).__DEV__ = true;

            renderHook(() =>
                useProcessedSvg(mockSvgContent, null, '', 'room1', 'room2')
            );

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('No path or pathString'),
                expect.any(Object)
            );
        });

        it('covers __DEV__ log when node data missing', () => {
            (global as any).__DEV__ = true;
            const path: NavMeshNode[] = [{ id: 'start' }, { id: 'end' }];

            renderHook(() =>
                useProcessedSvg(mockSvgContent, path, 'M 0 0 L 100 100', 'room1', 'room2')
            );

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Missing node data'),
                expect.any(Object)
            );
        });

        it('covers __DEV__ log for path coordinates', () => {
            (global as any).__DEV__ = true;
            const path: NavMeshNode[] = [
                { id: 'start', data: { x: 100, y: 100 } },
                { id: 'end', data: { x: 200, y: 200 } },
            ];

            renderHook(() =>
                useProcessedSvg(mockSvgContent, path, 'M 100 100 L 200 200', 'room1', 'room2')
            );

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Path coordinates'),
                expect.objectContaining({ pathLength: 2 })
            );
        });

        it('covers __DEV__ log for generated path elements', () => {
            (global as any).__DEV__ = true;
            const path: NavMeshNode[] = [
                { id: 'start', data: { x: 100, y: 100 } },
                { id: 'end', data: { x: 200, y: 200 } },
            ];

            renderHook(() =>
                useProcessedSvg(mockSvgContent, path, 'M 100 100 L 200 200', 'room1', 'room2')
            );

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Generated pathElements'),
                expect.any(String)
            );
        });

        it('skips console logs when __DEV__ is false', () => {
            (global as any).__DEV__ = false;
            const path: NavMeshNode[] = [
                { id: 'start', data: { x: 100, y: 100 } },
                { id: 'end', data: { x: 200, y: 200 } },
            ];

            renderHook(() =>
                useProcessedSvg(mockSvgContent, path, 'M 100 100 L 200 200', 'room1', 'room2')
            );

            // Should not log when __DEV__ is false
            expect(consoleLogSpy).not.toHaveBeenCalled();
        });
    });

    describe('floor filtering', () => {
        it('filters path nodes by floor when currentFloor is provided', () => {
            // Multi-floor path: floor 8 -> floor 9
            const path: NavMeshNode[] = [
                { id: 'Hall_F8_room_829', data: { x: 10, y: 20, floor: 8 } },
                { id: 'Hall_F8_hallway_1', data: { x: 50, y: 50, floor: 8 } },
                { id: 'Hall_F8_stair_1', data: { x: 100, y: 100, floor: 8 } },
                { id: 'Hall_F9_stair_1', data: { x: 100, y: 100, floor: 9 } },
                { id: 'Hall_F9_hallway_1', data: { x: 150, y: 150, floor: 9 } },
                { id: 'Hall_F9_room_962', data: { x: 200, y: 200, floor: 9 } },
            ];
            const pathString = 'M 10 20 L 100 100';

            // When viewing floor 8, markers should be at floor 8's start/end
            const { result } = renderHook(() =>
                useProcessedSvg(mockSvgContent, path, pathString, undefined, undefined, 8)
            );

            // Should use floor 8's first and last nodes (10,20) and (100,100)
            expect(result.current).toContain('start="10,20"');
            expect(result.current).toContain('end="100,100"');
        });

        it('shows correct markers for floor 9 in multi-floor path', () => {
            // Multi-floor path: floor 8 -> floor 9
            const path: NavMeshNode[] = [
                { id: 'Hall_F8_room_829', data: { x: 10, y: 20, floor: 8 } },
                { id: 'Hall_F8_stair_1', data: { x: 100, y: 100, floor: 8 } },
                { id: 'Hall_F9_stair_1', data: { x: 100, y: 100, floor: 9 } },
                { id: 'Hall_F9_room_962', data: { x: 200, y: 200, floor: 9 } },
            ];
            const pathString = 'M 100 100 L 200 200';

            // When viewing floor 9, markers should be at floor 9's start/end
            const { result } = renderHook(() =>
                useProcessedSvg(mockSvgContent, path, pathString, undefined, undefined, 9)
            );

            // Should use floor 9's first and last nodes (100,100) and (200,200)
            expect(result.current).toContain('start="100,100"');
            expect(result.current).toContain('end="200,200"');
        });

        it('uses all path nodes when currentFloor is undefined', () => {
            const path: NavMeshNode[] = [
                { id: 'Hall_F8_room_829', data: { x: 10, y: 20, floor: 8 } },
                { id: 'Hall_F9_room_962', data: { x: 200, y: 200, floor: 9 } },
            ];
            const pathString = 'M 10 20 L 200 200';

            const { result } = renderHook(() =>
                useProcessedSvg(mockSvgContent, path, pathString, undefined, undefined, undefined)
            );

            // Should use entire path's first and last nodes
            expect(result.current).toContain('start="10,20"');
            expect(result.current).toContain('end="200,200"');
        });

        it('renders path without markers when no nodes on specified floor', () => {
            // Path only has floor 8 nodes
            const path: NavMeshNode[] = [
                { id: 'Hall_F8_room_829', data: { x: 10, y: 20, floor: 8 } },
                { id: 'Hall_F8_room_862', data: { x: 100, y: 100, floor: 8 } },
            ];
            const pathString = 'M 10 20 L 100 100';

            // When viewing floor 9 (which has no nodes)
            const { result } = renderHook(() =>
                useProcessedSvg(mockSvgContent, path, pathString, undefined, undefined, 9)
            );

            // Should render path without markers (no start/end attributes)
            expect(result.current).toContain('<path d="M 10 20 L 100 100"');
            expect(result.current).not.toContain('start="');
            expect(result.current).not.toContain('end="');
        });

        it('extracts floor from node ID when floor not in data', () => {
            // Nodes without floor in data, but floor info in ID
            const path: NavMeshNode[] = [
                { id: 'Hall_F8_room_829', data: { x: 10, y: 20 } },
                { id: 'Hall_F8_room_862', data: { x: 100, y: 100 } },
            ];
            const pathString = 'M 10 20 L 100 100';

            const { result } = renderHook(() =>
                useProcessedSvg(mockSvgContent, path, pathString, undefined, undefined, 8)
            );

            // Should extract floor from ID and include nodes
            expect(result.current).toContain('start="10,20"');
            expect(result.current).toContain('end="100,100"');
        });

        it('handles single node on floor', () => {
            const path: NavMeshNode[] = [
                { id: 'Hall_F8_room_829', data: { x: 10, y: 20, floor: 8 } },
            ];
            const pathString = 'M 10 20';

            const { result } = renderHook(() =>
                useProcessedSvg(mockSvgContent, path, pathString, undefined, undefined, 8)
            );

            // Single node: start and end should be the same
            expect(result.current).toContain('start="10,20"');
            expect(result.current).toContain('end="10,20"');
        });
    });

});
