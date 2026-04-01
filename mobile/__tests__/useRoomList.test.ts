import { renderHook } from '@testing-library/react-native';

// Mock the navmesh JSON files before importing the hook
jest.mock('../src/data/navmesh/hall.json', () => ({
  roomIndex: {
    'H-867': 'Hall_F8_room_291',
    'H-801': 'Hall_F8_room_329',
    'H-23': 'Hall_F1_room_44',
    'H-131': 'Hall_F1_room_47',
  },
}), { virtual: true });

jest.mock('../src/data/navmesh/cc.json', () => ({
  roomIndex: {
    'CC-101': 'CC_F1_room_1',
    'CC-102': 'CC_F1_room_2',
  },
}), { virtual: true });

jest.mock('../src/data/navmesh/ve.json', () => ({
  roomIndex: {
    'VE-201': 'VE_F2_room_1',
  },
}), { virtual: true });

jest.mock('../src/data/navmesh/vl.json', () => ({
  roomIndex: {
    'VL-101': 'VL_F1_room_1',
  },
}), { virtual: true });

jest.mock('../src/data/navmesh/mb.json', () => ({
  roomIndex: {
    'MB-1.210': 'MB_F1_room_210',
    'MB-S2.210': 'mb-s2-210',
    'MB-S2.245': 'mb-s2-245',
  },
}), { virtual: true });

import { useRoomList } from '../src/hooks/useRoomList';

describe('useRoomList', () => {
    describe('extractRoomsFromSvg', () => {
        it('returns empty array when svgContent is undefined', () => {
            const { result } = renderHook(() => useRoomList(undefined));
            expect(result.current).toEqual([]);
        });

        it('returns empty array when svgContent is empty string', () => {
            const { result } = renderHook(() => useRoomList(''));
            expect(result.current).toEqual([]);
        });

        it('extracts room labels from SVG content', () => {
            const svgContent = `
                <g inkscape:label="801" />
                <g inkscape:label="803" />
                <g inkscape:label="829" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801', '803', '829']);
        });

        it('sorts numeric room labels numerically', () => {
            const svgContent = `
                <g inkscape:label="829" />
                <g inkscape:label="801" />
                <g inkscape:label="862" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801', '829', '862']);
        });

        it('sorts non-numeric room labels alphabetically using localeCompare', () => {
            const svgContent = `
                <g inkscape:label="Lobby" />
                <g inkscape:label="Entrance" />
                <g inkscape:label="Cafeteria" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['Cafeteria', 'Entrance', 'Lobby']);
        });

        it('sorts mixed numeric and non-numeric labels', () => {
            const svgContent = `
                <g inkscape:label="Lobby" />
                <g inkscape:label="801" />
                <g inkscape:label="803" />
                <g inkscape:label="Entrance" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801', '803', 'Entrance', 'Lobby']);
        });

        it('removes duplicate room labels', () => {
            const svgContent = `
                <g inkscape:label="801" />
                <g inkscape:label="801" />
                <g inkscape:label="803" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801', '803']);
        });

        it('filters out Floor labels', () => {
            const svgContent = `
                <g inkscape:label="801" />
                <g inkscape:label="Floor 1" />
                <g inkscape:label="Floor" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801']);
        });

        it('filters out Layer labels', () => {
            const svgContent = `
                <g inkscape:label="801" />
                <g inkscape:label="Layer 1" />
                <g inkscape:label="layer 2" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801']);
        });

        it('filters out S1/S2 vec labels', () => {
            const svgContent = `
                <g inkscape:label="801" />
                <g inkscape:label="S1 vec" />
                <g inkscape:label="S2 vec" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801']);
        });

        it('trims whitespace from labels', () => {
            const svgContent = `
                <g inkscape:label="  801  " />
                <g inkscape:label="  803  " />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801', '803']);
        });

        it('handles single quotes in labels', () => {
            const svgContent = `
                <g inkscape:label='801' />
                <g inkscape:label='803' />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801', '803']);
        });

        it('handles floating point numbers', () => {
            const svgContent = `
                <g inkscape:label="101.5" />
                <g inkscape:label="101.2" />
                <g inkscape:label="101.8" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['101.2', '101.5', '101.8']);
        });

        it('extracts room labels from text elements (new format)', () => {
            const svgContent = `
                <text x="10" y="20">801</text>
                <text x="30" y="40">803</text>
                <text x="50" y="60">829</text>
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801', '803', '829']);
        });

        it('extracts room labels with decimal from text elements', () => {
            const svgContent = `
                <text x="10" y="20">101.5</text>
                <text x="30" y="40">101.2</text>
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['101.2', '101.5']);
        });

        it('ignores non-numeric text elements', () => {
            const svgContent = `
                <text x="10" y="20">801</text>
                <text x="30" y="40">Lobby</text>
                <text x="50" y="60">A</text>
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801']);
        });

        it('ignores single digit text elements', () => {
            const svgContent = `
                <text x="10" y="20">801</text>
                <text x="30" y="40">5</text>
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801']);
        });
    });

    describe('extractRoomsFromNavMesh', () => {
        it('uses roomToNode (legacy format) and handles labels without prefixes', () => {
            // Require the actual JSON object loaded by the hook
            const ccJson = require('../src/data/navmesh/cc.json');
            
            // Backup original state
            const originalRoomIndex = ccJson.roomIndex;
            const originalRoomToNode = ccJson.roomToNode;
            
            // Force legacy format and a room without the CC- prefix
            delete ccJson.roomIndex;
            ccJson.roomToNode = { '105': 'CC_F1_room_105' };

            const { result } = renderHook(() => 
                useRoomList('', 'Central Building', '1')
            );

            // This covers the false branch of the prefix ternary
            expect(result.current).toContain('105');

            // Restore state so we don't break other tests
            ccJson.roomIndex = originalRoomIndex;
            ccJson.roomToNode = originalRoomToNode;
        });

        it('returns empty array if navmesh has no index data', () => {
            const vlJson = require('../src/data/navmesh/vl.json');
            
            // Backup
            const originalRoomIndex = vlJson.roomIndex;
            const originalRoomToNode = vlJson.roomToNode;
            
            // Delete both indices to cover the fallback || {}
            delete vlJson.roomIndex;
            delete vlJson.roomToNode;

            const { result } = renderHook(() => 
                useRoomList('', 'Vanier Library Building', '1')
            );

            // Should safely fallback to empty array without crashing
            expect(result.current).toEqual([]);

            // Restore
            vlJson.roomIndex = originalRoomIndex;
            vlJson.roomToNode = originalRoomToNode;
        });
        
        it('sorts rooms from navmesh alphabetically when they are non-numeric', () => {
            // Temporarily mock parseFloat to return NaN
            // This forces the sorting algorithm to treat the rooms as text 
            // and fall back to the localeCompare line we need to cover.
            const parseFloatSpy = jest.spyOn(Number, 'parseFloat').mockReturnValue(Number.NaN);
            
            const { result } = renderHook(() => 
                useRoomList('', 'Hall Building', '8')
            );
            
            // Verify it extracted rooms (using the real navmesh data)
            expect(result.current.length).toBeGreaterThan(0);
            
            // Because we forced parseFloat to fail, the hook sorted them alphabetically.
            // Let's verify they match the expected alphabetical order.
            const sortedAlphabetically = [...result.current].sort((a, b) => a.localeCompare(b));
            expect(result.current).toEqual(sortedAlphabetically);
            
            // Important: Restore parseFloat so we don't break other tests!
            parseFloatSpy.mockRestore();
        });

        it('returns rooms from navmesh when SVG is empty', () => {
            const { result } = renderHook(() => 
                useRoomList('', 'Hall Building', '8')
            );
            expect(result.current).toContain('867');
            expect(result.current).toContain('801');
        });

        it('returns rooms from navmesh for CC building', () => {
            const { result } = renderHook(() => 
                useRoomList('', 'Central Building', '1')
            );
            expect(result.current).toContain('101');
            expect(result.current).toContain('102');
        });

        it('returns rooms from navmesh for VE building', () => {
            const { result } = renderHook(() => 
                useRoomList('', 'Vanier Extension', '2')
            );
            expect(result.current).toContain('201');
        });

        it('returns rooms from navmesh for VL building', () => {
            const { result } = renderHook(() => 
                useRoomList('', 'Vanier Library Building', '1')
            );
            expect(result.current).toContain('101');
        });

        it('returns empty array for unknown building', () => {
            const { result } = renderHook(() => 
                useRoomList('', 'Unknown Building', '1')
            );
            expect(result.current).toEqual([]);
        });

        it('returns empty array when floor is not provided', () => {
            const { result } = renderHook(() => 
                useRoomList('', 'Hall Building')
            );
            expect(result.current).toEqual([]);
        });

        it('prefers SVG rooms over navmesh rooms', () => {
            const svgContent = `<g inkscape:label="999" />`;
            const { result } = renderHook(() => 
                useRoomList(svgContent, 'Hall Building', '8')
            );
            expect(result.current).toEqual(['999']);
        });

        it('sorts rooms from navmesh numerically', () => {
            const { result } = renderHook(() => 
                useRoomList('', 'Hall Building', '8')
            );
            const rooms = result.current;
            for (let i = 1; i < rooms.length; i++) {
                const prev = Number.parseFloat(rooms[i - 1]);
                const curr = Number.parseFloat(rooms[i]);
                if (!Number.isNaN(prev) && !Number.isNaN(curr)) {
                    expect(prev).toBeLessThanOrEqual(curr);
                }
            }
        });

        it('handles building ID alias CC', () => {
            const { result } = renderHook(() => 
                useRoomList('', 'CC', '1')
            );
            expect(result.current).toContain('101');
        });

        it('handles building ID alias VE', () => {
            const { result } = renderHook(() => 
                useRoomList('', 'VE', '2')
            );
            expect(result.current).toContain('201');
        });

        it('handles building ID alias VL', () => {
            const { result } = renderHook(() => 
                useRoomList('', 'VL', '1')
            );
            expect(result.current).toContain('101');
        });

        it('extracts S2 floor rooms from MB navmesh', () => {
            // This test covers the S2 floor branch in extractRoomsFromNavMesh
            const { result } = renderHook(() => 
                useRoomList('', 'John Molson Building', 'S2')
            );
            
            // Should return S2 rooms from the navmesh
            expect(result.current.length).toBeGreaterThan(0);
        });

        it('extracts S2 floor rooms using floor "0" as alias', () => {
            // Floor "0" should also match S2 rooms
            const { result } = renderHook(() => 
                useRoomList('', 'John Molson Building', '0')
            );
            
            // Should return S2 rooms from the navmesh
            expect(result.current.length).toBeGreaterThan(0);
        });
    });
});
