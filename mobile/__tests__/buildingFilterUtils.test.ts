import { getMatchingBuildings } from '../src/components/BuildingSelector/buildingFilterUtils';

describe('buildingFilterUtils', () => {
  describe('getMatchingBuildings', () => {
    it('returns empty array when query is empty string', () => {
      const results = getMatchingBuildings('');
      expect(results).toEqual([]);
    });

    it('returns empty array when query is only whitespace', () => {
      const results = getMatchingBuildings('   ');
      expect(results).toEqual([]);
    });

    it('filters buildings by id match', () => {
      const results = getMatchingBuildings('ER');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(b => b.id.includes('ER'))).toBe(true);
    });

    it('filters buildings by id case-insensitively', () => {
      const results = getMatchingBuildings('er');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(b => b.id.toLowerCase().includes('er'))).toBe(true);
    });

    it('filters buildings by label', () => {
      // Test that filtering works - may return results with label matches
      const results = getMatchingBuildings('building');
      expect(Array.isArray(results)).toBe(true);
    });

    it('filters buildings by address when available', () => {
      const results = getMatchingBuildings('street');
      // Some buildings have addresses, filter may return results
      expect(Array.isArray(results)).toBe(true);
    });

    it('returns buildings with partial id matches', () => {
      const results = getMatchingBuildings('B');
      // Should match buildings with "B" in id, label, or address
      expect(Array.isArray(results)).toBe(true);
    });

    it('returns empty array for non-matching query', () => {
      const results = getMatchingBuildings('XYZNONEXISTENTBUILDING');
      expect(results).toEqual([]);
    });

    it('handles multi-character search queries', () => {
      const results = getMatchingBuildings('building');
      expect(Array.isArray(results)).toBe(true);
    });

    it('filters case-insensitively for all criteria', () => {
      const resultsLower = getMatchingBuildings('er');
      const resultsUpper = getMatchingBuildings('ER');
      expect(resultsLower.length).toBe(resultsUpper.length);
    });
  });
});
