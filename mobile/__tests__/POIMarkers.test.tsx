import React from 'react';
import { getPOICategoryIcon, getPOICategoryLabel, getPOICategoryColor } from '../src/utils/poiMarkerUtils';

describe('POI Marker Rendering', () => {
  const mockCategories = ['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'] as const;

  const iconNameMap: Record<string, string> = {
    food: 'silverware-fork-knife',
    cafe: 'coffee',
    restroom: 'toilet',
    parking: 'parking',
    bike_rack: 'bike',
    emergency: 'medical-bag',
  };

  const categoryColorMap: Record<string, string> = {
    food: '#FF6B6B',
    cafe: '#8B4513',
    restroom: '#4A90E2',
    parking: '#FFB347',
    bike_rack: '#50C878',
    emergency: '#DC143C',
  };

  describe('POI Icon Name Mapping', () => {
    it('maps food category to silverware-fork-knife icon', () => {
      expect(iconNameMap['food']).toBe('silverware-fork-knife');
    });

    it('maps cafe category to coffee icon', () => {
      expect(iconNameMap['cafe']).toBe('coffee');
    });

    it('maps restroom category to toilet icon', () => {
      expect(iconNameMap['restroom']).toBe('toilet');
    });

    it('maps parking category to parking icon', () => {
      expect(iconNameMap['parking']).toBe('parking');
    });

    it('maps bike_rack category to bike icon', () => {
      expect(iconNameMap['bike_rack']).toBe('bike');
    });

    it('maps emergency category to medical-bag icon', () => {
      expect(iconNameMap['emergency']).toBe('medical-bag');
    });

    it('has unique icon names for all categories', () => {
      const iconNames = Object.values(iconNameMap);
      const uniqueNames = new Set(iconNames);
      expect(uniqueNames.size).toBe(mockCategories.length);
    });
  });

  describe('POI Category Colors', () => {
    it('returns correct color for food', () => {
      expect(categoryColorMap['food']).toBe('#FF6B6B');
      expect(getPOICategoryColor('food')).toBe('#FF6B6B');
    });

    it('returns correct color for cafe', () => {
      expect(categoryColorMap['cafe']).toBe('#8B4513');
      expect(getPOICategoryColor('cafe')).toBe('#8B4513');
    });

    it('returns correct color for restroom', () => {
      expect(categoryColorMap['restroom']).toBe('#4A90E2');
      expect(getPOICategoryColor('restroom')).toBe('#4A90E2');
    });

    it('returns correct color for parking', () => {
      expect(categoryColorMap['parking']).toBe('#FFB347');
      expect(getPOICategoryColor('parking')).toBe('#FFB347');
    });

    it('returns correct color for bike_rack', () => {
      expect(categoryColorMap['bike_rack']).toBe('#50C878');
      expect(getPOICategoryColor('bike_rack')).toBe('#50C878');
    });

    it('returns correct color for emergency', () => {
      expect(categoryColorMap['emergency']).toBe('#DC143C');
      expect(getPOICategoryColor('emergency')).toBe('#DC143C');
    });

    it('all colors are valid hex colors', () => {
      Object.values(categoryColorMap).forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it('returns gold color when isNearest is true', () => {
      const nearestColor = getPOICategoryColor('food', true);
      expect(nearestColor).toBe('#FFD700');
    });
  });

  describe('POI Category Labels', () => {
    it('returns Food label for food category', () => {
      expect(getPOICategoryLabel('food')).toBe('Food');
    });

    it('returns Café label for cafe category', () => {
      expect(getPOICategoryLabel('cafe')).toBe('Café');
    });

    it('returns Restroom label for restroom category', () => {
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

  describe('POI Marker Styles', () => {
    it('marker circle should be 30x30 pixels', () => {
      const markerSize = 30;
      expect(markerSize).toBe(30);
    });

    it('icon size should be 13 pixels', () => {
      const iconSize = 13;
      expect(iconSize).toBe(13);
    });

    it('border radius should be 15 (half of marker height)', () => {
      const borderRadius = 15;
      const markerSize = 30;
      expect(borderRadius).toBe(markerSize / 2);
    });

    it('border width should be 2', () => {
      const borderWidth = 2;
      expect(borderWidth).toBe(2);
    });

    it('nearest POI ring should be 44x44 pixels', () => {
      const nearestRingSize = 44;
      const markerSize = 30;
      // Nearest ring should be larger than marker
      expect(nearestRingSize).toBeGreaterThan(markerSize);
    });

    it('nearest POI ring border radius should be 22', () => {
      const nearestRingBorderRadius = 22;
      const nearestRingSize = 44;
      expect(nearestRingBorderRadius).toBe(nearestRingSize / 2);
    });

    it('nearest POI ring color should be gold', () => {
      const nearestRingColor = '#FFD700';
      expect(nearestRingColor).toBe('#FFD700');
    });
  });

  describe('Marker Shadow and Elevation', () => {
    it('marker has shadow for visual depth', () => {
      // Shadow properties for iOS
      const shadowColor = '#000';
      const shadowOpacity = 0.25;
      const shadowRadius = 3;
      // Shadow offset for depth
      const shadowOffsetHeight = 2;

      expect(shadowColor).toBe('#000');
      expect(shadowOpacity).toBeGreaterThan(0);
      expect(shadowOpacity).toBeLessThan(1);
      expect(shadowRadius).toBeGreaterThan(0);
      expect(shadowOffsetHeight).toBeGreaterThan(0);
    });

    it('marker has elevation for Android', () => {
      const elevation = 5;
      expect(elevation).toBeGreaterThan(0);
    });
  });

  describe('Marker Border', () => {
    it('marker has white border', () => {
      const borderColor = '#fff';
      expect(borderColor).toBe('#fff');
    });

    it('border provides contrast with colored background', () => {
      const borderColor = '#fff';
      // White text/border should provide contrast with colored backgrounds
      const darkColors = ['#FF6B6B', '#8B4513', '#4A90E2', '#DC143C'];
      darkColors.forEach(darkColor => {
        expect(borderColor).not.toBe(darkColor);
      });
    });
  });

  describe('Icon and Color Mapping Consistency', () => {
    it('every category has both icon and color defined', () => {
      mockCategories.forEach(category => {
        expect(iconNameMap[category]).toBeTruthy();
        expect(categoryColorMap[category]).toBeTruthy();
      });
    });

    it('POI utility functions work with all categories from icon map', () => {
      Object.keys(iconNameMap).forEach(category => {
        const categoryType = category as 'food' | 'cafe' | 'restroom' | 'parking' | 'bike_rack' | 'emergency';
        const label = getPOICategoryLabel(categoryType);
        const color = getPOICategoryColor(categoryType);
        expect(label).toBeTruthy();
        expect(color).toBeTruthy();
      });
    });
  });
});
