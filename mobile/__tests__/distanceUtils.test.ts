import {
  calculateDistance,
  findNearestPOI,
  findPOIsInRange,
  formatDistance
} from '../src/utils/distanceUtils';
import type { OutdoorPOI } from '../src/data/outdoorPOI';

const mockPOIs: OutdoorPOI[] = [
  {
    id: 'poi_food_1',
    name: 'Thai Express',
    category: 'food',
    coordinates: { latitude: 45.49625, longitude: -73.57788 },
    address: '1240 De Maisonneuve Blvd W',
    campus: 'downtown'
  },
  {
    id: 'poi_cafe_1',
    name: 'Café Koi',
    category: 'cafe',
    coordinates: { latitude: 45.45832, longitude: -73.63971 },
    address: '7253 Sherbrooke Street W',
    campus: 'loyola'
  },
  {
    id: 'poi_food_2',
    name: 'Osmow Shawarma',
    category: 'food',
    coordinates: { latitude: 45.45878, longitude: -73.63859 },
    address: '7271 Sherbrooke Street W',
    campus: 'loyola'
  }
];

describe('distanceUtils', () => {
  describe('calculateDistance', () => {
    it('calculates distance between two identical points', () => {
      const distance = calculateDistance(0, 0, 0, 0);
      expect(distance).toBe(0);
    });

    it('returns positive distance for different points', () => {
      const distance = calculateDistance(
        45.49625,
        -73.57788,
        45.45878,
        -73.63859
      );
      expect(distance).toBeGreaterThan(0);
    });

    it('uses Haversine formula for accurate distances', () => {
      // Montreal downtown to Loyola is roughly 6-7 km
      const distance = calculateDistance(
        45.49625,
        -73.57788,
        45.45878,
        -73.63859
      );
      expect(distance).toBeGreaterThan(5000); // At least 5km
      expect(distance).toBeLessThan(10000); // Less than 10km
    });

    it('is symmetric (distance A to B = distance B to A)', () => {
      const distance1 = calculateDistance(
        45.49625,
        -73.57788,
        45.45878,
        -73.63859
      );
      const distance2 = calculateDistance(
        45.45878,
        -73.63859,
        45.49625,
        -73.57788
      );
      expect(Math.abs(distance1 - distance2)).toBeLessThan(1); // Allow tiny rounding errors
    });
  });

  describe('formatDistance', () => {
    it('formats meters correctly', () => {
      expect(formatDistance(234)).toBe('234m');
    });

    it('formats kilometers for distances > 1000m', () => {
      expect(formatDistance(1200)).toBe('1.2km');
    });

    it('formats kilometers with decimal for accuracy', () => {
      expect(formatDistance(5500)).toBe('5.5km');
    });

    it('handles zero distance', () => {
      expect(formatDistance(0)).toBe('0m');
    });

    it('handles large distances', () => {
      const formatted = formatDistance(50000);
      expect(formatted).toMatch(/^\d+(\.\d+)?km$/);
    });

    it('handles distances just under 1km', () => {
      expect(formatDistance(999)).toBe('999m');
    });

    it('rounds meters to nearest integer', () => {
      expect(formatDistance(234.7)).toBe('235m');
    });
  });

  describe('findNearestPOI', () => {
    it('returns null when userLocation is null', () => {
      const result = findNearestPOI(null, mockPOIs, 500);
      expect(result).toBeNull();
    });

    it('returns null when POI array is empty', () => {
      const result = findNearestPOI(
        { latitude: 45.49625, longitude: -73.57788 },
        [],
        500
      );
      expect(result).toBeNull();
    });

    it('finds the nearest POI', () => {
      const userLocation = { latitude: 45.49625, longitude: -73.57788 };
      const result = findNearestPOI(userLocation, mockPOIs, 500);
      expect(result).toBeTruthy();
      if (result) {
        // Thai Express is closest to this downtown location
        expect(result.name).toBe('Thai Express');
        expect(result.distance).toBeGreaterThanOrEqual(0);
      }
    });

    it('returns POI with distance calculated', () => {
      const userLocation = { latitude: 45.49625, longitude: -73.57788 };
      const result = findNearestPOI(userLocation, mockPOIs, 500);
      expect(result).toBeTruthy();
      if (result) {
        expect(result.distance).toBeDefined();
        expect(result.distance).toBeGreaterThanOrEqual(0);
      }
    });

    it('respects range parameter', () => {
      const userLocation = { latitude: 0, longitude: 0 }; // Very far from all POIs
      const result = findNearestPOI(userLocation, mockPOIs, 100); // Only 100m range
      expect(result).toBeNull(); // Should find nothing at equator
    });

    it('returns nearest POI within range', () => {
      const userLocation = { latitude: 45.49625, longitude: -73.57788 };
      const result = findNearestPOI(userLocation, mockPOIs, 10000); // 10km range
      expect(result).toBeTruthy();
      if (result) {
        expect(result.distance).toBeLessThanOrEqual(10000);
      }
    });
  });

  describe('findPOIsInRange', () => {
    it('returns empty array when userLocation is null', () => {
      const result = findPOIsInRange(null, mockPOIs, 500);
      expect(result).toEqual([]);
    });

    it('returns empty array when no POIs in range', () => {
      const result = findPOIsInRange(
        { latitude: 0, longitude: 0 },
        mockPOIs,
        100 // 100 meters
      );
      expect(result).toEqual([]);
    });

    it('finds POIs within range', () => {
      const userLocation = { latitude: 45.49625, longitude: -73.57788 };
      const result = findPOIsInRange(
        userLocation,
        mockPOIs,
        10000 // 10 km
      );
      expect(result.length).toBeGreaterThan(0);
      result.forEach(poi => {
        expect(poi.distance).toBeLessThanOrEqual(10000);
      });
    });

    it('respects range parameter', () => {
      const userLocation = { latitude: 45.49625, longitude: -73.57788 };
      const result1000m = findPOIsInRange(
        userLocation,
        mockPOIs,
        1000
      );
      const result500m = findPOIsInRange(
        userLocation,
        mockPOIs,
        500
      );
      // Should have more or equal POIs in larger range
      expect(result1000m.length).toBeGreaterThanOrEqual(result500m.length);
    });

    it('includes distance in returned POIs', () => {
      const userLocation = { latitude: 45.49625, longitude: -73.57788 };
      const result = findPOIsInRange(
        userLocation,
        mockPOIs,
        10000
      );
      result.forEach(poi => {
        expect(poi.distance).toBeDefined();
        expect(poi.distance).toBeGreaterThanOrEqual(0);
      });
    });

    it('sorts POIs by distance (nearest first)', () => {
      const userLocation = { latitude: 45.49625, longitude: -73.57788 };
      const result = findPOIsInRange(
        userLocation,
        mockPOIs,
        10000
      );
      
      // Verify sorted by distance
      for (let i = 1; i < result.length; i++) {
        expect(result[i].distance).toBeGreaterThanOrEqual(result[i - 1].distance);
      }
    });

    it('preserves all POI properties', () => {
      const userLocation = { latitude: 45.49625, longitude: -73.57788 };
      const result = findPOIsInRange(
        userLocation,
        mockPOIs,
        10000
      );

      if (result.length > 0) {
        const poi = result[0];
        expect(poi.id).toBeDefined();
        expect(poi.name).toBeDefined();
        expect(poi.category).toBeDefined();
        expect(poi.coordinates).toBeDefined();
        expect(poi.address).toBeDefined();
        expect(poi.distance).toBeDefined();
      }
    });
  });
});
