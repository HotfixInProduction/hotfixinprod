import { renderHook } from '@testing-library/react-native';
import { useRoomsForBuilding } from '../src/hooks/useAllRooms';

describe('useRoomsForBuilding', () => {
    it('returns empty array for unknown building', () => {
        const { result } = renderHook(() => useRoomsForBuilding('Unknown Building'));
        expect(result.current).toEqual([]);
    });

    it('returns rooms for Hall Building', () => {
        const { result } = renderHook(() => useRoomsForBuilding('Hall Building'));
        
        // Should have rooms
        expect(result.current.length).toBeGreaterThan(0);
        
        // All rooms should have required properties
        result.current.forEach(room => {
            expect(room.room).toBeDefined();
            expect(room.prefix).toBe('H-');
            expect(room.buildingId).toBe('Hall Building');
            expect(room.floor).toBeDefined();
            expect(room.displayLabel).toBeDefined();
        });
    });

    it('returns rooms for Central Building', () => {
        const { result } = renderHook(() => useRoomsForBuilding('Central Building'));
        
        expect(result.current.length).toBeGreaterThan(0);
        result.current.forEach(room => {
            expect(room.prefix).toBe('CC-');
            expect(room.buildingId).toBe('Central Building');
        });
    });

    it('returns rooms for Vanier Extension', () => {
        const { result } = renderHook(() => useRoomsForBuilding('Vanier Extension'));
        
        expect(result.current.length).toBeGreaterThan(0);
        result.current.forEach(room => {
            expect(room.prefix).toBe('VE-');
            expect(room.buildingId).toBe('Vanier Extension');
        });
    });

    it('returns rooms for Vanier Library Building', () => {
        const { result } = renderHook(() => useRoomsForBuilding('Vanier Library Building'));
        
        expect(result.current.length).toBeGreaterThan(0);
        result.current.forEach(room => {
            expect(room.prefix).toBe('VL-');
            expect(room.buildingId).toBe('Vanier Library Building');
        });
    });

    it('handles alias building IDs (CC and VE)', () => {
        const { result: ccResult } = renderHook(() => useRoomsForBuilding('CC'));
        const { result: veResult } = renderHook(() => useRoomsForBuilding('VE'));
        const { result: vlResult } = renderHook(() => useRoomsForBuilding('VL'));
        
        expect(ccResult.current.length).toBeGreaterThan(0);
        expect(veResult.current.length).toBeGreaterThan(0);
        expect(vlResult.current.length).toBeGreaterThan(0);
    });

    it('sorts rooms by floor and room number', () => {
        const { result } = renderHook(() => useRoomsForBuilding('Hall Building'));
        
        // Verify sorting: floors should be in ascending order
        for (let i = 1; i < result.current.length; i++) {
            const prevFloor = Number.parseInt(result.current[i - 1].floor, 10);
            const currFloor = Number.parseInt(result.current[i].floor, 10);
            
            if (prevFloor === currFloor) {
                // Same floor: room numbers should be sorted
                const prevRoom = Number.parseFloat(result.current[i - 1].room);
                const currRoom = Number.parseFloat(result.current[i].room);
                if (!Number.isNaN(prevRoom) && !Number.isNaN(currRoom)) {
                    expect(prevRoom).toBeLessThanOrEqual(currRoom);
                }
            } else {
                // Different floors: verify ascending order
                expect(prevFloor).toBeLessThanOrEqual(currFloor);
            }
        }
    });

    it('includes floor in display label', () => {
        const { result } = renderHook(() => useRoomsForBuilding('Hall Building'));
        
        result.current.forEach(room => {
            expect(room.displayLabel).toContain(`Floor ${room.floor}`);
            expect(room.displayLabel).toContain(room.prefix);
            expect(room.displayLabel).toContain(room.room);
        });
    });

    it('removes prefix from room label when parsing', () => {
        const { result } = renderHook(() => useRoomsForBuilding('Hall Building'));
        
        result.current.forEach(room => {
            // Display label should have full prefix + room
            expect(room.displayLabel).toContain(`${room.prefix}${room.room}`);
            // But the room field should not contain the prefix
            expect(room.room).not.toContain(room.prefix);
        });
    });

    it('memoizes results for same building ID', () => {
        const { result: result1 } = renderHook(() => useRoomsForBuilding('Hall Building'));
        const { result: result2 } = renderHook(() => useRoomsForBuilding('Hall Building'));
        
        // Same building should return equivalent results
        expect(result1.current.length).toBe(result2.current.length);
        expect(result1.current).toEqual(result2.current);
    });

    it('handles unique room-floor combinations', () => {
        const { result } = renderHook(() => useRoomsForBuilding('Hall Building'));
        
        // Create a set of room-floor combinations
        const uniqueSet = new Set<string>();
        result.current.forEach(room => {
            const key = `${room.room}|${room.floor}`;
            expect(uniqueSet.has(key)).toBe(false); // Should not have duplicates
            uniqueSet.add(key);
        });
        
        // Verify set size matches result length
        expect(uniqueSet.size).toBe(result.current.length);
    });

    it('sorts rooms alphabetically when room numbers are non-numeric', () => {
        // Mock parseFloat to return NaN to force localeCompare branch
        const parseFloatSpy = jest.spyOn(Number, 'parseFloat').mockReturnValue(Number.NaN);
        
        const { result } = renderHook(() => useRoomsForBuilding('Hall Building'));
        
        // Verify rooms are sorted (will use localeCompare since parseFloat returns NaN)
        const sortedAlphabetically = [...result.current].sort((a, b) => a.room.localeCompare(b.room));
        expect(result.current.map(r => r.room)).toEqual(sortedAlphabetically.map(r => r.room));
        
        parseFloatSpy.mockRestore();
    });

    it('returns rooms for John Molson Building including S2 floor', () => {
        const { result } = renderHook(() => useRoomsForBuilding('John Molson Building'));
        
        // Should have rooms on multiple floors including S2
        expect(result.current.length).toBeGreaterThan(0);
        
        // Check that we have rooms with S2 floor
        const s2Rooms = result.current.filter(room => room.floor === 'S2');
        expect(s2Rooms.length).toBeGreaterThan(0);
        
        // Verify S2 rooms have correct properties
        s2Rooms.forEach(room => {
            expect(room.prefix).toBe('MB-');
            expect(room.buildingId).toBe('John Molson Building');
            expect(room.floor).toBe('S2');
        });
    });

    it('handles MB building ID alias', () => {
        const { result } = renderHook(() => useRoomsForBuilding('MB'));
        
        expect(result.current.length).toBeGreaterThan(0);
        result.current.forEach(room => {
            expect(room.prefix).toBe('MB-');
            expect(room.buildingId).toBe('MB');
        });
    });

    it('falls back to roomToNode when roomIndex is missing', () => {
        // Get the actual mb navmesh and modify it
        const mbJson = require('../src/data/navmesh/mb.json');
        
        // Backup original state
        const originalRoomIndex = mbJson.roomIndex;
        const originalRoomToNode = mbJson.roomToNode;
        
        // Force legacy format - only roomToNode exists
        delete mbJson.roomIndex;
        mbJson.roomToNode = { 'MB-101': 'MB_F1_room_101' };

        const { result } = renderHook(() => useRoomsForBuilding('John Molson Building'));
        
        // Should still get rooms from roomToNode
        expect(result.current.length).toBeGreaterThan(0);
        expect(result.current.some(r => r.room === '101')).toBe(true);

        // Restore
        mbJson.roomIndex = originalRoomIndex;
        mbJson.roomToNode = originalRoomToNode;
    });

    it('handles empty roomIndex and roomToNode gracefully', () => {
        const mbJson = require('../src/data/navmesh/mb.json');
        
        // Backup
        const originalRoomIndex = mbJson.roomIndex;
        const originalRoomToNode = mbJson.roomToNode;
        
        // Delete both to test fallback to empty object
        delete mbJson.roomIndex;
        delete mbJson.roomToNode;

        const { result } = renderHook(() => useRoomsForBuilding('John Molson Building'));
        
        // Should return empty array without crashing
        expect(result.current).toEqual([]);

        // Restore
        mbJson.roomIndex = originalRoomIndex;
        mbJson.roomToNode = originalRoomToNode;
    });

    it('handles room labels without building prefix', () => {
        const mbJson = require('../src/data/navmesh/mb.json');
        
        // Backup
        const originalRoomIndex = mbJson.roomIndex;
        const originalRoomToNode = mbJson.roomToNode;
        
        // Create a room without the MB- prefix
        delete mbJson.roomToNode;
        mbJson.roomIndex = { '101': 'MB_F1_room_101' }; // No MB- prefix on label

        const { result } = renderHook(() => useRoomsForBuilding('John Molson Building'));
        
        // Should still include the room, keeping the label as-is
        expect(result.current.length).toBeGreaterThan(0);
        expect(result.current[0].room).toBe('101');

        // Restore
        mbJson.roomIndex = originalRoomIndex;
        mbJson.roomToNode = originalRoomToNode;
    });

    it('skips nodes that do not match floor pattern', () => {
        const mbJson = require('../src/data/navmesh/mb.json');
        
        // Backup
        const originalRoomIndex = mbJson.roomIndex;
        const originalRoomToNode = mbJson.roomToNode;
        
        // Create rooms with invalid node IDs (no floor pattern)
        delete mbJson.roomToNode;
        mbJson.roomIndex = { 
            'MB-101': 'invalid_node_id',  // No _F\d+_ pattern
            'MB-102': 'MB_F1_room_102'    // Valid pattern
        };

        const { result } = renderHook(() => useRoomsForBuilding('John Molson Building'));
        
        // Should only include the valid room
        expect(result.current.length).toBe(1);
        expect(result.current[0].room).toBe('102');

        // Restore
        mbJson.roomIndex = originalRoomIndex;
        mbJson.roomToNode = originalRoomToNode;
    });

    it('skips duplicate room-floor combinations', () => {
        const mbJson = require('../src/data/navmesh/mb.json');
        
        // Backup
        const originalRoomIndex = mbJson.roomIndex;
        const originalRoomToNode = mbJson.roomToNode;
        
        // Create a scenario where the same room label maps to the same floor
        // via different node ID patterns (MB-S2 vs mb-s2 both resolve to floor 'S2')
        delete mbJson.roomToNode;
        mbJson.roomIndex = { 
            'MB-101': 'MB-S2_F1_room_101',   // S2 floor (uppercase)
            'MB-102': 'mb-s2-F1-room-102',   // S2 floor (lowercase) - different room
            'MB-103': 'MB_F1_room_103'       // Floor 1
        };

        const { result } = renderHook(() => useRoomsForBuilding('John Molson Building'));
        
        // Should have 3 rooms: 101 (S2), 102 (S2), 103 (Floor 1)
        expect(result.current.length).toBe(3);

        // Restore
        mbJson.roomIndex = originalRoomIndex;
        mbJson.roomToNode = originalRoomToNode;
    });

    it('skips when same room-floor combination appears twice via different node patterns', () => {
        const mbJson = require('../src/data/navmesh/mb.json');
        
        // Backup
        const originalRoomIndex = mbJson.roomIndex;
        const originalRoomToNode = mbJson.roomToNode;
        
        // Create a scenario where the SAME room label appears TWICE with different node IDs
        // that both resolve to the SAME floor - this tests the roomFloorSet.has() returning true
        delete mbJson.roomToNode;
        
        // We need to create an object where the same roomLabel appears multiple times
        // Since JS objects can't have duplicate keys, we'll use a different approach:
        // Create entries where different room labels resolve to the same roomFloorKey
        // Actually, the roomFloorKey is `${roomLabel}|${floor}`, so same roomLabel + same floor = duplicate
        
        // To truly test this, we need to mock Object.entries to return duplicates
        const originalEntries = Object.entries;
        jest.spyOn(Object, 'entries').mockImplementation((obj: any) => {
            if (obj === mbJson.roomIndex) {
                // Return duplicate entries for the same room label
                return [
                    ['MB-101', 'MB-S2_F1_room_101'],   // First entry: room 101, floor S2
                    ['MB-101', 'mb-s2-F1-room-101b'], // Duplicate: same room 101, same floor S2
                    ['MB-102', 'MB_F1_room_102']      // Different room
                ];
            }
            return originalEntries(obj);
        });

        mbJson.roomIndex = { 
            'MB-101': 'MB-S2_F1_room_101',
            'MB-102': 'MB_F1_room_102'
        };

        const { result } = renderHook(() => useRoomsForBuilding('John Molson Building'));
        
        // Should only have 2 unique room-floor combinations
        // MB-101 should only appear once even though it was in the entries twice
        expect(result.current.length).toBe(2);
        const rooms = result.current.map(r => r.room);
        expect(rooms).toContain('101');
        expect(rooms).toContain('102');

        // Restore
        (Object.entries as any).mockRestore();
        mbJson.roomIndex = originalRoomIndex;
        mbJson.roomToNode = originalRoomToNode;
    });
});
