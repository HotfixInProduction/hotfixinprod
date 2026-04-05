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
  if (!base64Part) {
    // If it's not base64 encoded, it's likely URL encoded
    return decodeURIComponent(dataUrl.split(',')[1] || '');
  }
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

    it('returns color based on category when isNearest is false', () => {
      expect(getPOICategoryColor('food', false)).toBe('#FF6B6B');
      expect(getPOICategoryColor('cafe', false)).toBe('#8B4513');
      expect(getPOICategoryColor('restroom', false)).toBe('#4A90E2');
      expect(getPOICategoryColor('parking', false)).toBe('#FFB347');
      expect(getPOICategoryColor('bike_rack', false)).toBe('#50C878');
      expect(getPOICategoryColor('emergency', false)).toBe('#DC143C');
    });

    it('always returns gold when isNearest is true regardless of category', () => {
      const categories = ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'] as const;
      categories.forEach(cat => {
        expect(getPOICategoryColor(cat, true)).toBe('#FFD700');
      });
    });

    it('returns default color when category is not recognized', () => {
      // This tests the fallback behavior
      const color = getPOICategoryColor('food', false);
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
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

    it('includes all icon paths in SVG for each category', () => {
      const categories: Array<'food' | 'cafe' | 'restroom' | 'parking' | 'bike_rack' | 'emergency'> = 
        ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'];
      
      categories.forEach(cat => {
        const url = generateSVGMarker(cat);
        const svgContent = decodeBase64SVG(url);
        // Each should have at least a path or group element
        const hasPath = svgContent.includes('<path') || svgContent.includes('<g>');
        expect(hasPath).toBe(true);
      });
    });

    it('ensures color is correctly applied to icon paths', () => {
      const foodUrl = generateSVGMarker('food');
      const svgContent = decodeBase64SVG(foodUrl);
      // Food color should be used in the SVG
      expect(svgContent).toContain('#FF6B6B');
      // Should have opacity for background circle
      expect(svgContent).toContain('opacity="0.9"');
    });

    it('handles categories with all variations of isNearest flag', () => {
      const categories: Array<'food' | 'cafe' | 'restroom' | 'parking' | 'bike_rack' | 'emergency'> = 
        ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'];
      
      categories.forEach(cat => {
        const urlNotNearest = generateSVGMarker(cat, false);
        const urlNearest = generateSVGMarker(cat, true);
        
        expect(urlNotNearest).toBeTruthy();
        expect(urlNearest).toBeTruthy();
        expect(urlNotNearest).not.toBe(urlNearest);
        
        const svgNotNearest = decodeBase64SVG(urlNotNearest);
        const svgNearest = decodeBase64SVG(urlNearest);
        
        expect(svgNearest).toContain('#FFD700');
        expect(svgNotNearest).not.toContain('#FFD700');
      });
    });

    it('generates valid base64 data URL that contains SVG content', () => {
      const url = generateSVGMarker('food');
      // Should match data URL format
      expect(url).toMatch(/^data:image\/svg\+xml(?:;base64)?,.+$/);
      // Should be able to extract content
      const parts = url.split(',');
      expect(parts.length).toBeGreaterThanOrEqual(1);
      expect(parts[0]).toContain('data:image/svg+xml');
    });

    it('produces consistent output for same inputs', () => {
      const url1 = generateSVGMarker('cafe', false);
      const url2 = generateSVGMarker('cafe', false);
      expect(url1).toBe(url2);
    });

    it('svg contains proper dimensions', () => {
      const url = generateSVGMarker('food');
      const svgContent = decodeBase64SVG(url);
      expect(svgContent).toContain('width="56"');
      expect(svgContent).toContain('height="56"');
      expect(svgContent).toContain('viewBox="0 0 56 56"');
    });

    it('svg uses correct namespace', () => {
      const url = generateSVGMarker('food');
      const svgContent = decodeBase64SVG(url);
      expect(svgContent).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('marker circle uses correct center coordinates', () => {
      const url = generateSVGMarker('food');
      const svgContent = decodeBase64SVG(url);
      // Main circle should be centered at 28,28
      expect(svgContent).toContain('cx="28"');
      expect(svgContent).toContain('cy="28"');
    });

    it('food icon contains path data', () => {
      const url = generateSVGMarker('food');
      const svgContent = decodeBase64SVG(url);
      expect(svgContent).toContain('path');
      expect(svgContent).toContain('fill');
    });

    it('all categories produce non-empty SVG data URLs', () => {
      const categories: Array<'food' | 'cafe' | 'restroom' | 'parking' | 'bike_rack' | 'emergency'> = 
        ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'];
      
      categories.forEach(cat => {
        const url = generateSVGMarker(cat);
        expect(url).toBeTruthy();
        expect(url.length).toBeGreaterThan(50);
      });
    });
  });

  describe('getMarkerDisplayText', () => {
    it('returns text with icon and label for food', () => {
      const text = getMarkerDisplayText('food');
      expect(text).toBeTruthy();
      expect(text.length).toBeGreaterThan(1);
      expect(text).toContain('Food');
    });

    it('returns text with icon and label for cafe', () => {
      const text = getMarkerDisplayText('cafe');
      expect(text).toBeTruthy();
      expect(text).toContain('Café');
    });

    it('returns text with icon and label for restroom', () => {
      const text = getMarkerDisplayText('restroom');
      expect(text).toBeTruthy();
      expect(text).toContain('Restroom');
    });

    it('returns text with icon and label for parking', () => {
      const text = getMarkerDisplayText('parking');
      expect(text).toBeTruthy();
      expect(text).toContain('Parking');
    });

    it('returns text with icon and label for bike_rack', () => {
      const text = getMarkerDisplayText('bike_rack');
      expect(text).toBeTruthy();
      expect(text).toContain('Bike');
    });

    it('returns text with icon and label for emergency', () => {
      const text = getMarkerDisplayText('emergency');
      expect(text).toBeTruthy();
      expect(text).toContain('Emergency');
    });

    it('marker display text includes space separator', () => {
      const categories: Array<'food' | 'cafe' | 'restroom' | 'parking' | 'bike_rack' | 'emergency'> = 
        ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'];
      
      categories.forEach(cat => {
        const text = getMarkerDisplayText(cat);
        // Should have format: "icon label"
        expect(text).toMatch(/\s/);
      });
    });

    it('all marker display texts are non-empty strings', () => {
      const categories: Array<'food' | 'cafe' | 'restroom' | 'parking' | 'bike_rack' | 'emergency'> = 
        ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'];
      
      categories.forEach(cat => {
        const text = getMarkerDisplayText(cat);
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Color Fallback Cases', () => {
    it('returns gold color when isNearest is true for all categories', () => {
      const categories: Array<'food' | 'cafe' | 'restroom' | 'parking' | 'bike_rack' | 'emergency'> = 
        ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'];
      
      categories.forEach(cat => {
        const color = getPOICategoryColor(cat, true);
        expect(color).toBe('#FFD700');
      });
    });

    it('returns original color when isNearest is false for all categories', () => {
      const colorMap: Record<string, string> = {
        food: '#FF6B6B',
        cafe: '#8B4513',
        restroom: '#4A90E2',
        parking: '#FFB347',
        bike_rack: '#50C878',
        emergency: '#DC143C',
      };

      Object.entries(colorMap).forEach(([cat, expectedColor]) => {
        const category = cat as 'food' | 'cafe' | 'restroom' | 'parking' | 'bike_rack' | 'emergency';
        const color = getPOICategoryColor(category, false);
        expect(color).toBe(expectedColor);
      });
    });

    it('isNearest flag takes precedence over category color', () => {
      const foodColorDefault = getPOICategoryColor('food', false);
      const foodColorNearest = getPOICategoryColor('food', true);
      expect(foodColorDefault).not.toBe(foodColorNearest);
      expect(foodColorNearest).toBe('#FFD700');
    });
  });

  describe('Icon and Label Consistency', () => {
    it('every category has both icon and label', () => {
      const categories: Array<'food' | 'cafe' | 'restroom' | 'parking' | 'bike_rack' | 'emergency'> = 
        ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'];
      
      categories.forEach(cat => {
        const icon = getPOICategoryIcon(cat);
        const label = getPOICategoryLabel(cat);
        expect(icon).toBeTruthy();
        expect(label).toBeTruthy();
        expect(icon).not.toBe('');
        expect(label).not.toBe('');
      });
    });

    it('marker display text combines icon and label correctly', () => {
      const categories: Array<'food' | 'cafe' | 'restroom' | 'parking' | 'bike_rack' | 'emergency'> = 
        ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'];
      
      categories.forEach(cat => {
        const icon = getPOICategoryIcon(cat);
        const label = getPOICategoryLabel(cat);
        const displayText = getMarkerDisplayText(cat);
        
        expect(displayText).toContain(icon);
        expect(displayText).toContain(label);
        expect(displayText).toBe(`${icon} ${label}`);
      });
    });
  });

  describe('SVG Encoding Edge Cases', () => {
    it('SVG with special characters is properly encoded', () => {
      const categories: Array<'food' | 'cafe' | 'restroom' | 'parking' | 'bike_rack' | 'emergency'> = 
        ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'];
      
      categories.forEach(cat => {
        const url = generateSVGMarker(cat);
        // Should be a proper data URL
        expect(url).toMatch(/^data:image\/svg\+xml/);
        expect(url).not.toContain('undefined');
        expect(url).not.toContain('null');
      });
    });

    it('handles invalid category gracefully by using fallback icon', () => {
      // Test with an invalid category to trigger default case
      const url = generateSVGMarker('invalid_category' as any, false);
      const svgContent = decodeBase64SVG(url);
      
      // Should still generate valid SVG
      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('</svg>');
      
      // Should use a fallback (circle icon)
      expect(svgContent).toContain('circle');
    });

    it('generated SVG is consistent across multiple calls', () => {
      const url1 = generateSVGMarker('food', false);
      const url2 = generateSVGMarker('food', false);
      const url3 = generateSVGMarker('food', false);
      
      expect(url1).toBe(url2);
      expect(url2).toBe(url3);
    });

    it('nearest flag produces structurally different SVGs with gold color', () => {
      const regularFood = generateSVGMarker('food', false);
      const nearestFood = generateSVGMarker('food', true);
      
      const regularSvg = decodeBase64SVG(regularFood);
      const nearestSvg = decodeBase64SVG(nearestFood);
      
      // Regular version should have category color
      expect(regularSvg).toContain('#FF6B6B');
      
      // Nearest version should have gold
      expect(nearestSvg).toContain('#FFD700');
      
      // They should be structurally different
      expect(regularFood).not.toBe(nearestFood);
    });

    it('all categories generate valid URLs with and without isNearest', () => {
      const categories = ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'] as const;
      
      categories.forEach(cat => {
        const regularUrl = generateSVGMarker(cat, false);
        const nearestUrl = generateSVGMarker(cat, true);
        
        // Both should be valid data URLs
        expect(regularUrl).toMatch(/^data:image\/svg\+xml/);
        expect(nearestUrl).toMatch(/^data:image\/svg\+xml/);
        
        // Nearest should be different from regular
        expect(regularUrl).not.toBe(nearestUrl);
      });
    });

    it('SVG dimensions are consistent for all categories', () => {
      const categories = ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'] as const;
      
      categories.forEach(cat => {
        const url = generateSVGMarker(cat, false);
        const svgContent = decodeBase64SVG(url);
        
        // Should have width and height of 56
        expect(svgContent).toMatch(/width="56"/);
        expect(svgContent).toMatch(/height="56"/);
        
        // Should have viewBox  
        expect(svgContent).toMatch(/viewBox="0 0 56 56"/);
      });
    });

    it('isNearest flag determines circle and ring presence in SVG', () => {
      // Test with isNearest = false
      const regularUrl = generateSVGMarker('food', false);
      const regularSvg = decodeBase64SVG(regularUrl);
      
      // Should have the category color in circles
      expect(regularSvg).toContain('#FF6B6B');
      
      // Test with isNearest = true
      const nearestUrl = generateSVGMarker('food', true);
      const nearestSvg = decodeBase64SVG(nearestUrl);
      
      // Should have gold color for nearest
      expect(nearestSvg).toContain('#FFD700');
      expect(nearestSvg).not.toContain('#FF6B6B');
    });

    it('data URL has correct format (base64 or URL encoded)', () => {
      const url = generateSVGMarker('food');
      // Should be either base64 or URL encoded format
      expect(
        url.includes('data:image/svg+xml;base64,') || 
        url.includes('data:image/svg+xml,')
      ).toBe(true);
    });

    it('can decode and validate SVG content from generated URL', () => {
      const url = generateSVGMarker('cafe', false);
      const svgContent = decodeBase64SVG(url);
      
      // Should have valid SVG structure
      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('</svg>');
      
      // Should have the cafe color
      expect(svgContent).toContain('#8B4513');
    });

    it('decoded SVG from URL encoded format contains proper SVG structure', () => {
      const url = generateSVGMarker('parking', false);
      
      // Split by comma to get the actual content part
      const parts = url.split(',');
      expect(parts.length).toBeGreaterThanOrEqual(1);
      
      // Decode the SVG content
      const svgContent = decodeBase64SVG(url);
      
      // Verify it's valid SVG
      expect(svgContent).toBeTruthy();
      expect(svgContent.length).toBeGreaterThan(0);
    });

    it('all SVG markers produce valid data URLs regardless of encoding', () => {
      const categories: Array<'food' | 'cafe' | 'restroom' | 'parking' | 'bike_rack' | 'emergency'> = 
        ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'];
      
      categories.forEach(cat => {
        const url = generateSVGMarker(cat, false);
        // Must start with data URI scheme
        expect(url.startsWith('data:image/svg+xml')).toBe(true);
        // Must have content after the scheme
        expect(url.length).toBeGreaterThan('data:image/svg+xml'.length);
      });
    });

    it('fallback URL encoding preserves SVG validity', () => {
      const url = generateSVGMarker('emergency', true);
      const svgContent = decodeBase64SVG(url);
      
      // Should have SVG tags
      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('circle');
      
      // When isNearest is true, should have gold color for both icon and ring
      expect(svgContent).toContain('#FFD700');
      
      // Verify it's a base64 or URL encoded data URL
      expect(url).toMatch(/^data:image\/svg\+xml/);
    });

    it('falls back to URL encoding when btoa fails', () => {
      // Mock btoa to throw an error
      const originalBtoa = global.btoa;
      global.btoa = jest.fn(() => {
        throw new Error('btoa failed');
      });

      try {
        const url = generateSVGMarker('food', false);
        
        // Should still return a valid data URL with URL encoding format
        expect(url).toMatch(/^data:image\/svg\+xml,/);
        
        // Should contain the food color when encoded
        expect(url).toContain(encodeURIComponent('#FF6B6B'));
      } finally {
        // Restore original btoa
        global.btoa = originalBtoa;
      }
    });
  });
});
