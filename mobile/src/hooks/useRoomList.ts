import { useMemo } from 'react';
import hallNavMeshJson from '../data/navmesh/hall.json';
import ccNavMeshJson from '../data/navmesh/cc.json';
import veNavMeshJson from '../data/navmesh/ve.json';
import vlNavMeshJson from '../data/navmesh/vl.json';
import mbNavMeshJson from '../data/navmesh/mb.json';

// NavMesh format with roomIndex (new) or roomToNode (legacy)
type NavMesh = {
  roomIndex?: Record<string, string>;
  roomToNode?: Record<string, string>;
};

const hallNavMesh: NavMesh = hallNavMeshJson as NavMesh;
const ccNavMesh: NavMesh = ccNavMeshJson as NavMesh;
const veNavMesh: NavMesh = veNavMeshJson as NavMesh;
const vlNavMesh: NavMesh = vlNavMeshJson as NavMesh;
const mbNavMesh: NavMesh = mbNavMeshJson as NavMesh;

// Map building IDs to their navmeshes
const navMeshByBuilding: Record<string, NavMesh> = {
  'Hall Building': hallNavMesh,
  'Central Building': ccNavMesh,
  'CC': ccNavMesh,
  'Vanier Extension': veNavMesh,
  'VE': veNavMesh,
  'Vanier Library Building': vlNavMesh,
  'VL': vlNavMesh,
  'John Molson Building': mbNavMesh,
  'MB': mbNavMesh,
};

// Map building IDs to their room label prefixes
const buildingPrefixes: Record<string, string> = {
  'Hall Building': 'H-',
  'Central Building': 'CC-',
  'CC': 'CC-',
  'Vanier Extension': 'VE-',
  'VE': 'VE-',
  'Vanier Library Building': 'VL-',
  'VL': 'VL-',
  'John Molson Building': 'MB-',
  'MB': 'MB-',
};

function extractRoomsFromSvg(svgContent: string): string[] {
  const rooms = new Set<string>();
  
  // Direct console.log for debugging (remove after fixing)
  console.log('[extractRoomsFromSvg] Extracting rooms from SVG, Length:', svgContent.length);
  
  // Extract from inkscape:label attributes (old format)
  const labelRegex = /inkscape:label=["']([^"']+)["']/g;
  let match;
  while ((match = labelRegex.exec(svgContent)) !== null) {
    const label = match[1].trim();
    if (label && !/^(Floor|Layer|layer|S[12] vec)/i.test(label)) {
      rooms.add(label);
    }
  }
  
  // istanbul ignore next - __DEV__ is removed in production builds
  if (__DEV__) console.log('[extractRoomsFromSvg] Found from inkscape:label:', rooms.size);
  
  // Extract from text elements (new format - room numbers like "867", "801", etc.)
  // Using a safer regex pattern to avoid ReDoS:
  // - [^<] instead of [^>]* to prevent excessive backtracking
  // - Limit the number pattern to reasonable lengths
  const textRegex = /<text[^>]*>([^<]{0,50})<\/text>/gi;
  let textMatchCount = 0;
  while ((match = textRegex.exec(svgContent)) !== null) {
    const textContent = match[1].trim();
    textMatchCount++;
    // Match room labels in various formats:
    // - Hall Building: "867", "801" (2+ digits, optionally with decimal)
    // - John Molson Building: "1.294", "1.210" (floor.room format)
    // - S2 floor: "S2.210", "245" (S-floor.room or just room number)
    const isHallFormat = /^\d{2,}(?:\.\d+)?$/.test(textContent);
    const isJohnFormat = /^\d{1,2}\.\d{2,}$/.test(textContent);
    const isSFloorFormat = /^S\d+\.\d+$/.test(textContent);
    
    if (isHallFormat || isJohnFormat || isSFloorFormat) {
      rooms.add(textContent);
      // istanbul ignore next - __DEV__ is removed in production builds
      if (__DEV__) console.log('[extractRoomsFromSvg] Matched room:', textContent);
    }
  }
  
  // istanbul ignore next - __DEV__ is removed in production builds
  if (__DEV__) console.log('[extractRoomsFromSvg] Checked', textMatchCount, 'text elements, found', rooms.size, 'rooms');
  
  return Array.from(rooms).sort((a, b) => {
    const numA = Number.parseFloat(a);
    const numB = Number.parseFloat(b);
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
}

/**
 * Extract rooms from navmesh for a specific building and floor
 * @param buildingId Building identifier (e.g., "Hall Building", "Central Building")
 * @param floor Floor number (e.g., "1", "2", "8", "9")
 * @returns Array of room labels (without building prefix)
 */
function extractRoomsFromNavMesh(buildingId: string, floor: string): string[] {
  const rooms = new Set<string>();
  const floorNum = Number.parseInt(floor, 10);
  
  const navMesh = navMeshByBuilding[buildingId];
  const prefix = buildingPrefixes[buildingId];
  
  // Support both roomIndex (new) and roomToNode (legacy), fallback to empty object
  const roomIndex = navMesh.roomIndex || navMesh.roomToNode || {};
  
  for (const [roomLabel, nodeId] of Object.entries(roomIndex)) {
    // Check if this room belongs to the specified floor
    // Standard pattern: "Hall_F8_room_291", "CC_F1_room_1", "VE_F1_room_242"
    // MB-S2 pattern: "MB-S2_F1_..." or "mb-s2-..." for S2 floor
    let matchesFloor = false;
    
    if (floor === 'S2' || floor === '0') {
      // S2 floor uses different node ID patterns
      matchesFloor = nodeId.startsWith('MB-S2') || nodeId.startsWith('mb-s2');
    } else {
      matchesFloor = nodeId.includes(`_F${floorNum}_`);
    }
    
    if (matchesFloor) {
      // Remove building prefix from room label (e.g., "H-867" -> "867", "CC-124" -> "124")
      const cleanLabel = (prefix && roomLabel.startsWith(prefix)) 
        ? roomLabel.substring(prefix.length) 
        : roomLabel;
      rooms.add(cleanLabel);
    }
  }
  
  return Array.from(rooms).sort((a, b) => {
    const numA = Number.parseFloat(a);
    const numB = Number.parseFloat(b);
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
}

export function useRoomList(svgContent: string | undefined, buildingId?: string, floor?: string): string[] {
  return useMemo(() => {
    // Direct console.log for debugging (remove after fixing)
    console.log('[useRoomList] Called with:', {
      hasSvgContent: !!svgContent,
      svgContentLength: svgContent?.length,
      buildingId,
      floor,
      hasNavMesh: !!(buildingId && navMeshByBuilding[buildingId])
    });
    
    // First try to extract from SVG
    const svgRooms = svgContent ? extractRoomsFromSvg(svgContent) : [];
    
    // istanbul ignore next - __DEV__ is removed in production builds
    if (__DEV__) console.log('[useRoomList] SVG rooms found:', svgRooms.length);
    
    // If SVG has rooms, use them
    if (svgRooms.length > 0) {
      return svgRooms;
    }
    
    // Otherwise, try to get rooms from navmesh
    if (buildingId && floor && navMeshByBuilding[buildingId]) {
      const navMeshRooms = extractRoomsFromNavMesh(buildingId, floor);
      // istanbul ignore next - __DEV__ is removed in production builds
      if (__DEV__) console.log('[useRoomList] NavMesh rooms found:', navMeshRooms.length);
      return navMeshRooms;
    }
    
    // istanbul ignore next - __DEV__ is removed in production builds
    if (__DEV__) console.log('[useRoomList] No rooms found - returning empty array');
    
    return [];
  }, [svgContent, buildingId, floor]);
}
