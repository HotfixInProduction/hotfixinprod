import {
  getPOICategoryIcon,
  getPOICategoryLabel,
  getPOICategoryColor,
  getMarkerDisplayText,
  generateSVGMarker
} from '../src/utils/poiMarkerUtils';

// Test helper to decode base64 SVG
const decodeBase64SVG = (dataUrl: string): string => {
  const base64Part = dataUrl.split(',')[1];
  return Buffer.from(base64Part, 'base64').toString('utf-8');
};

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
      expect(url).toMatch(/^data:image\/svg\+xml/);
    });

    it('returns a properly formatted data URL', () => {
      const url = generateSVGMarker('food');
      expect(url).toContain('data:image/svg+xml');
    });

    it('generates SVG with proper structure', () => {
      const url = generateSVGMarker('food');
      const svgContent = decodeBase64SVG(url);
      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('</svg>');
      expect(svgContent).toContain('circle');
    });

    it('includes background circle for marker', () => {
      const url = generateSVGMarker('food');
      const svgContent = decodeBase64SVG(url);
      // Should have at least 3 circles: outer background, inner white, border
      const circleMatches = svgContent.match(/<circle/g) || [];
      expect(circleMatches.length).toBeGreaterThanOrEqual(3);
    });

    it('includes category-specific icons in SVG', () => {
      const categories: Array<'food' | 'cafe' | 'restroom' | 'parking' | 'bike_rack' | 'emergency'> = 
        ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'];
      
      categories.forEach(category => {
        const url = generateSVGMarker(category);
        const svgContent = decodeBase64SVG(url);
        // Each should have SVG content with paths or other shape elements for the icon
        expect(svgContent.length).toBeGreaterThan(200);
        expect(svgContent).toContain('viewBox');
      });
    });

    it('uses correct category color for food', () => {
      const url = generateSVGMarker('food');
      const svgContent = decodeBase64SVG(url);
      expect(svgContent).toContain('#FF6B6B');
    });

    it('uses correct category color for cafe', () => {
      const url = generateSVGMarker('cafe');
      const svgContent = decodeBase64SVG(url);
      expect(svgContent).toContain('#8B4513');
    });

    it('uses correct category color for restroom', () => {
      const url = generateSVGMarker('restroom');
      const svgContent = decodeBase64SVG(url);
      expect(svgContent).toContain('#4A90E2');
    });

    it('uses correct category color for parking', () => {
      const url = generateSVGMarker('parking');
      const svgContent = decodeBase64SVG(url);
      expect(svgContent).toContain('#FFB347');
    });

    it('uses correct category color for bike_rack', () => {
      const url = generateSVGMarker('bike_rack');
      const svgContent = decodeBase64SVG(url);
      expect(svgContent).toContain('#50C878');
    });

    it('uses correct category color for emergency', () => {
      const url = generateSVGMarker('emergency');
      const svgContent = decodeBase64SVG(url);
      expect(svgContent).toContain('#DC143C');
    });

    it('adds gold ring when isNearest is true', () => {
      const urlNearest = generateSVGMarker('food', true);
      const svgContentNearest = decodeBase64SVG(urlNearest);
      expect(svgContentNearest).toContain('#FFD700');
    });

    it('does not add gold ring when isNearest is false', () => {
      const urlNotNearest = generateSVGMarker('food', false);
      const svgContentNotNearest = decodeBase64SVG(urlNotNearest);
      // Should not have FFD700 (gold color)
      expect(svgContentNotNearest).not.toContain('#FFD700');
    });

    it('generates different SVG for different categories', () => {
      const foodUrl = generateSVGMarker('food');
      const cafeUrl = generateSVGMarker('cafe');
      const foodSvg = decodeBase64SVG(foodUrl);
      const cafeSvg = decodeBase64SVG(cafeUrl);
      // Different icons and colors should make different SVG content
      expect(foodSvg).not.toBe(cafeSvg);
    });

    it('generates different SVG when isNearest changes', () => {
      const regularUrl = generateSVGMarker('food', false);
      const nearestUrl = generateSVGMarker('food', true);
      const regularSvg = decodeBase64SVG(regularUrl);
      const nearestSvg = decodeBase64SVG(nearestUrl);
      expect(regularSvg).not.toBe(nearestSvg);
    });

    it('handles all category types', () => {
      const categories: Array<'food' | 'cafe' | 'restroom' | 'parking' | 'bike_rack' | 'emergency'> = 
        ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'];
      
      categories.forEach(cat => {
        const url = generateSVGMarker(cat);
        expect(url).toMatch(/^data:image\/svg\+xml/);
        const svg = decodeBase64SVG(url);
        expect(svg).toContain('<svg');
      });
    });

    it('encodes SVG properly to handle special characters', () => {
      // Test that encoding handles various characters without errors
      const url = generateSVGMarker('food');
      expect(url).toBeTruthy();
      expect(typeof url).toBe('string');
      // Should be valid data URL
      expect(url.startsWith('data:image/svg+xml')).toBe(true);
    });
  });
});
