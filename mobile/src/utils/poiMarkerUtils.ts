import type { OutdoorPOI } from '../data/outdoorPOI';

// Map of POI categories to Material Design icon names and colors
const categoryConfig: Record<OutdoorPOI['category'], { icon: string; color: string; label: string }> = {
  food: { icon: '🍽️', color: '#FF6B6B', label: 'Food' },
  cafe: { icon: '☕', color: '#8B4513', label: 'Café' },
  restroom: { icon: '🚻', color: '#4A90E2', label: 'Restroom' },
  parking: { icon: '🅿️', color: '#FFB347', label: 'Parking' },
  bike_rack: { icon: '🚲', color: '#50C878', label: 'Bike' },
  emergency: { icon: '🚨', color: '#DC143C', label: 'Emergency' }
};

/**
 * Gets the emoji icon for a POI category
 */
export const getPOICategoryIcon = (category: OutdoorPOI['category']): string => {
  return categoryConfig[category]?.icon || '📍';
};

/**
 * Gets the label for a POI category
 */
export const getPOICategoryLabel = (category: OutdoorPOI['category']): string => {
  return categoryConfig[category]?.label || 'Location';
};

/**
 * Gets the color for a POI category marker
 */
export const getPOICategoryColor = (category: OutdoorPOI['category'], isNearest: boolean = false): string => {
  if (isNearest) return '#FFD700'; // Gold for nearest
  return categoryConfig[category]?.color || '#912338';
};

/**
 * Generates an SVG marker image with icon for a POI category
 * Returns base64 encoded SVG string
 */
export const generateSVGMarker = (
  category: OutdoorPOI['category'],
  isNearest: boolean = false
): string => {
  const color = getPOICategoryColor(category, isNearest);
  const icon = getPOICategoryIcon(category);
  
  const svg = `
    <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <!-- Outer circle background -->
      <circle cx="28" cy="28" r="28" fill="${color}" opacity="0.9"/>
      <!-- Inner white circle -->
      <circle cx="28" cy="28" r="22" fill="white"/>
      <!-- Border -->
      <circle cx="28" cy="28" r="22" fill="none" stroke="${color}" stroke-width="2"/>
      <!-- Icon (using text as fallback) -->
      <text x="28" y="35" font-size="24" text-anchor="middle" fill="${color}" font-family="system-ui">
        ${icon}
      </text>
      <!-- Gold ring for nearest -->
      ${
        isNearest
          ? '<circle cx="28" cy="28" r="26" fill="none" stroke="#FFD700" stroke-width="2"/>'
          : ''
      }
    </svg>
  `;

  // Convert to base64
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

/**
 * Creates marker display text showing category with icon
 */
export const getMarkerDisplayText = (category: OutdoorPOI['category']): string => {
  const icon = getPOICategoryIcon(category);
  const label = getPOICategoryLabel(category);
  return `${icon} ${label}`;
};
