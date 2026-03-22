import { useMemo } from 'react';
import { POIType } from '../types/building';

export interface AmenityElement {
    id: string;
    type: POIType;
    amenityKind: string; // The actual amenity type (stairs, elevator, printer, etc.)
    x: number;
    y: number;
    label: string;
    description: string;
}

// Map SVG element IDs to amenity info
const AMENITY_TYPE_MAP: Record<string, { type: POIType; amenityKind: string; label: string; description: string }> = {
    // Stairs
    stairs: { type: 'stairs', amenityKind: 'stairs', label: 'Stairs', description: 'Staircase' },
    
    // Elevators
    elevators: { type: 'elevator', amenityKind: 'elevator', label: 'Elevator', description: 'Elevator - Accessible' },
    
    // Restrooms
    restrooms_m: { type: 'washroom', amenityKind: 'restroom_m', label: 'Men\'s Restroom', description: 'Men\'s Washroom' },
    restrooms_w: { type: 'washroom', amenityKind: 'restroom_w', label: 'Women\'s Restroom', description: 'Women\'s Washroom' },
    
    // Escalators
    escalators_up: { type: 'escalator', amenityKind: 'escalator_up', label: 'Escalator Up', description: 'Escalator (Up)' },
    escalators_down: { type: 'escalator', amenityKind: 'escalator_down', label: 'Escalator Down', description: 'Escalator (Down)' },
    
    // Water fountains
    fountains: { type: 'water_fountain', amenityKind: 'fountain', label: 'Water Fountain', description: 'Drinking Fountain' },
    
    // Study areas
    study: { type: 'stairs', amenityKind: 'study', label: 'Study Area', description: 'Study Room' },
    
    // Printers
    printers: { type: 'stairs', amenityKind: 'printer', label: 'Printer', description: 'Printer Station' },
};

/**
 * Parses a <g> tag to extract element id and position
 */
function parseGTag(gTag: string): { elementId: string; x: number; y: number } | null {
    const idMatch = new RegExp(/id="([^"]{1,100})"/).exec(gTag);
    if (!idMatch) return null;

    const transformMatch = new RegExp(/transform="translate\(([^,)]{1,50}),\s*([^)]{1,50})\)"/).exec(gTag);
    if (!transformMatch) return null;

    const x = Number.parseFloat(transformMatch[1]);
    const y = Number.parseFloat(transformMatch[2]);

    return Number.isNaN(x) || Number.isNaN(y) ? null : { elementId: idMatch[1], x, y };
}

/**
 * Finds matching amenity type info for an element id
 */
function findAmenityInfo(elementId: string) {
    return Object.values(AMENITY_TYPE_MAP).find(info => elementId.startsWith(Object.keys(AMENITY_TYPE_MAP).find(key => elementId.startsWith(key)) || ''));
}

/**
 * Extracts amenity positions from SVG content
 */
export function useAmenities(svgContent: string | undefined): AmenityElement[] {
    return useMemo(() => {
        if (!svgContent) return [];
        
        const amenities: AmenityElement[] = [];
        let searchIndex = 0;
        
        while (true) {
            const gStart = svgContent.indexOf('<g', searchIndex);
            if (gStart === -1) break;
            
            const gEnd = svgContent.indexOf('>', gStart);
            if (gEnd === -1) break;
            
            const gTag = svgContent.substring(gStart, gEnd + 1);
            const parsed = parseGTag(gTag);
            
            if (parsed) {
                for (const [key, info] of Object.entries(AMENITY_TYPE_MAP)) {
                    if (parsed.elementId.startsWith(key)) {
                        amenities.push({
                            id: parsed.elementId,
                            type: info.type,
                            amenityKind: info.amenityKind,
                            x: parsed.x,
                            y: parsed.y,
                            label: info.label,
                            description: info.description,
                        });
                        break;
                    }
                }
            }
            
            searchIndex = gEnd + 1;
        }
        
        return amenities;
    }, [svgContent]);
}

/**
 * Helper to determine display name for amenity type
 */
export function getAmenityDisplayName(type: POIType): string {
    const displayMap: Record<POIType, string> = {
        washroom: 'Restroom',
        water_fountain: 'Water Fountain',
        stairs: 'Stairs',
        elevator: 'Elevator',
        escalator: 'Escalator',
        stair_landing: 'Stair Landing',
        elevator_door: 'Elevator Door',
        building_entry_exit: 'Entrance/Exit',
    };
    return displayMap[type] || type;
}

/**
 * Get icon name for Material Community Icons based on amenity kind
 */
export function getAmenityIconName(amenityKind: string): string {
    const iconMap: Record<string, string> = {
        toilet: 'toilet',
        restroom_m: 'toilet',
        restroom_w: 'toilet',
        water_fountain: 'water',
        fountain: 'water',
        stairs: 'stairs',
        elevator: 'elevator',
        escalator: 'escalator-up',
        escalator_up: 'escalator-up',
        escalator_down: 'escalator-down',
        stair_landing: 'stairs',
        elevator_door: 'elevator',
        building_entry_exit: 'exit-run',
        study: 'book-open',
        printer: 'printer',
    };
    return iconMap[amenityKind] || 'information';
}
