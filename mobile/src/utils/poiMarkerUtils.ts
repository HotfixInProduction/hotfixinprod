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
 * Gets SVG icon path for a POI category
 */
const getCategoryIconSVG = (category: OutdoorPOI['category']): string => {
  switch (category) {
    case 'food':
      // Fork and knife
      return '<g><path d="M8 4v14h2v-2h4v2h2V4h-2v8h-4V4H8M20 4v16h2V4h-2M26 6c0-1.1 0.9-2 2-2s2 0.9 2 2v11h6V6c0-1.1 0.9-2 2-2s2 0.9 2 2v13h2V6c0-2.2-1.8-4-4-4s-4 1.8-4 4v5c0-2.2-1.8-4-4-4s-4 1.8-4 4v9h2V6z" fill="currentColor"/></g>';
    case 'cafe':
      // Coffee cup
      return '<g><path d="M2 5v12c0 1.1 0.9 2 2 2h12c1.1 0 2-0.9 2-2V5H2M13 7c0.6 0 1 0.4 1 1s-0.4 1-1 1-1-0.4-1-1 0.4-1 1-1M19 5v10c0 1.1-0.9 2-2 2h1c1.1 0 2-0.9 2-2V5h-1z" fill="currentColor"/></g>';
    case 'restroom':
      // Person icon
      return '<g><circle cx="12" cy="6" r="3"/><path d="M12 9c-1.65 0-3 1.35-3 3v4h2v5h2v-5h2v-4c0-1.65-1.35-3-3-3z" fill="currentColor"/></g>';
    case 'parking':
      // P letter
      return '<g><path d="M6 4v16h8c2.2 0 4-1.8 4-4V8c0-2.2-1.8-4-4-4H6M8 6h6c1.1 0 2 0.9 2 2v3c0 1.1-0.9 2-2 2H8V6M8 13h6v7H8v-7z" fill="currentColor"/></g>';
    case 'bike_rack':
      // Bicycle
      return '<g><circle cx="6" cy="16" r="2"/><circle cx="18" cy="16" r="2"/><path d="M12.5 5L7.5 10M14 8h4l-3 2M12 8l6 8" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M12 3v8" stroke="currentColor" stroke-width="1.5" fill="none"/></g>';
    case 'emergency':
      // Medical cross
      return '<g><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m3.5-9h-3V8h-1v3h-3v1h3v3h1v-3h3v-1z" fill="currentColor"/></g>';
    default:
      return '<circle cx="12" cy="12" r="6" fill="currentColor"/>';
  }
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
  const iconSvg = getCategoryIconSVG(category);
  
  // Create compact SVG without newlines to avoid btoa encoding issues
  const nearestRing = isNearest ? '<circle cx="28" cy="28" r="26" fill="none" stroke="#FFD700" stroke-width="2"/>' : '';
  
  const svg = `<svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg"><circle cx="28" cy="28" r="28" fill="${color}" opacity="0.9"/><circle cx="28" cy="28" r="22" fill="white"/><circle cx="28" cy="28" r="22" fill="none" stroke="${color}" stroke-width="2"/><g transform="translate(10,10) scale(1.2)">${iconSvg.replace(/currentColor/g, color)}</g>${nearestRing}</svg>`;

  try {
    // Convert to base64 - use encodeURIComponent for unicode safety
    const base64Svg = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64Svg}`;
  } catch (error) {
    // Fallback to data URI without base64 encoding
    const encodedSvg = encodeURIComponent(svg);
    return `data:image/svg+xml,${encodedSvg}`;
  }
};

/**
 * Creates marker display text showing category with icon
 */
export const getMarkerDisplayText = (category: OutdoorPOI['category']): string => {
  const icon = getPOICategoryIcon(category);
  const label = getPOICategoryLabel(category);
  return `${icon} ${label}`;
};
