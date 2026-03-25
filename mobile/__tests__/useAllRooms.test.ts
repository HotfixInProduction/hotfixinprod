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
});
