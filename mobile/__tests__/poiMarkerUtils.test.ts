import {
  getPOICategoryIcon,
  getPOICategoryLabel,
  getPOICategoryColor,
  getMarkerDisplayText,
  generateSVGMarker
} from '../src/utils/poiMarkerUtils';

describe('poiMarkerUtils', () => {
  describe('getPOICategoryIcon', () => {
    it('returns food emoji for food category', () => {
      expect(getPOICategoryIcon('food')).toBe('🍽️');
    });

    it('returns cafe emoji for cafe category', () => {
      expect(getPOICategoryIcon('cafe')).toBe('☕');
    });

    it('returns restroom emoji for restroom category', () => {
      expect(getPOICategoryIcon('restroom')).toBe('🚻');
    });

    it('returns parking emoji for parking category', () => {
      expect(getPOICategoryIcon('parking')).toBe('🅿️');
    });

    it('returns bike emoji for bike_rack category', () => {
      expect(getPOICategoryIcon('bike_rack')).toBe('🚲');
    });

    it('returns emergency emoji for emergency category', () => {
      expect(getPOICategoryIcon('emergency')).toBe('🚨');
    });
  });

  describe('getPOICategoryLabel', () => {
    it('returns Food label for food category', () => {
      expect(getPOICategoryLabel('food')).toBe('Food');
    });

    it('returns Café label for cafe category', () => {
      expect(getPOICategoryLabel('cafe')).toBe('Café');
    });

    it('returns Restrooms label for restroom category', () => {
      expect(getPOICategoryLabel('restroom')).toBe('Restroom');
    });

    it('returns Parking label for parking category', () => {
      expect(getPOICategoryLabel('parking')).toBe('Parking');
    });

    it('returns Bike label for bike_rack category', () => {
      expect(getPOICategoryLabel('bike_rack')).toBe('Bike');
    });

    it('returns Emergency label for emergency category', () => {
      expect(getPOICategoryLabel('emergency')).toBe('Emergency');
    });
  });

  describe('getPOICategoryColor', () => {
    it('returns correct color for food category', () => {
      expect(getPOICategoryColor('food')).toBe('#FF6B6B');
    });

    it('returns correct color for cafe category', () => {
      expect(getPOICategoryColor('cafe')).toBe('#8B4513');
    });

    it('returns gold color when isNearest is true', () => {
      expect(getPOICategoryColor('food', true)).toBe('#FFD700');
    });

    it('returns correct color for all categories', () => {
      const categories = ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'] as const;
      categories.forEach(cat => {
        const color = getPOICategoryColor(cat);
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('getMarkerDisplayText', () => {
    it('returns emoji with label for food', () => {
      const text = getMarkerDisplayText('food');
      expect(text).toContain('🍽️');
      expect(text).toContain('Food');
    });

    it('returns emoji with label for cafe', () => {
      const text = getMarkerDisplayText('cafe');
      expect(text).toContain('☕');
      expect(text).toContain('Café');
    });

    it('returns correctly formatted text for all categories', () => {
      const categories = ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'] as const;
      categories.forEach(cat => {
        const text = getMarkerDisplayText(cat);
        expect(text).toBeTruthy();
        expect(text.length).toBeGreaterThan(1);
      });
    });
  });

  describe('generateSVGMarker', () => {
    it('returns SVG data URL', () => {
      const url = generateSVGMarker('food');
      expect(url).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('returns a properly formatted base64 data URL', () => {
      const url = generateSVGMarker('food');
      const parts = url.split(',');
      expect(parts.length).toBe(2);
      expect(parts[0]).toBe('data:image/svg+xml;base64');
      // Check that base64 content is valid (should be reasonable length)
      expect(parts[1].length).toBeGreaterThan(100);
    });

    it('generates different URLs for different categories', () => {
      const foodUrl = generateSVGMarker('food');
      const cafeUrl = generateSVGMarker('cafe');
      expect(foodUrl).not.toBe(cafeUrl);
    });

    it('generates different URLs when isNearest changes', () => {
      const regularUrl = generateSVGMarker('food', false);
      const nearestUrl = generateSVGMarker('food', true);
      expect(regularUrl).not.toBe(nearestUrl);
    });

    it('generates valid SVG for all categories', () => {
      const categories = ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'] as const;
      categories.forEach(cat => {
        const url = generateSVGMarker(cat);
        expect(url).toMatch(/^data:image\/svg\+xml;base64,/);
        // Each URL should have reasonable length with SVG content
        expect(url.length).toBeGreaterThan(150);
      });
    });
  });
});
