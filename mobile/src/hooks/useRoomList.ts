import { useMemo } from 'react';
import hallNavMeshJson from '../data/navmesh/hall.json';
import ccNavMeshJson from '../data/navmesh/cc.json';
import veNavMeshJson from '../data/navmesh/ve.json';
import vlNavMeshJson from '../data/navmesh/vl.json';

// NavMesh format with roomIndex (new) or roomToNode (legacy)
type NavMesh = {
  roomIndex?: Record<string, string>;
  roomToNode?: Record<string, string>;
};

const hallNavMesh: NavMesh = hallNavMeshJson as NavMesh;
const ccNavMesh: NavMesh = ccNavMeshJson as NavMesh;
const veNavMesh: NavMesh = veNavMeshJson as NavMesh;
const vlNavMesh: NavMesh = vlNavMeshJson as NavMesh;

// Map building IDs to their navmeshes
const navMeshByBuilding: Record<string, NavMesh> = {
  'Hall Building': hallNavMesh,
  'Central Building': ccNavMesh,
  'CC': ccNavMesh,
  'Vanier Extension': veNavMesh,
  'VE': veNavMesh,
  'Vanier Library Building': vlNavMesh,
  'VL': vlNavMesh,
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
};

function extractRoomsFromSvg(svgContent: string): string[] {
  const rooms = new Set<string>();
  
  // Extract from inkscape:label attributes (old format)
  const labelRegex = /inkscape:label=["']([^"']+)["']/g;
  let match;
  while ((match = labelRegex.exec(svgContent)) !== null) {
    const label = match[1].trim();
    if (label && !/^(Floor|Layer|layer|S[12] vec)/i.test(label)) {
      rooms.add(label);
    }
  }
  
  // Extract from text elements (new format - room numbers like "867", "801", etc.)
  // Using a safer regex pattern to avoid ReDoS:
  // - [^<] instead of [^>]* to prevent excessive backtracking
  // - Limit the number pattern to reasonable lengths
  const textRegex = /<text[^>]*>([^<]{0,50})<\/text>/gi;
  while ((match = textRegex.exec(svgContent)) !== null) {
    const textContent = match[1].trim();
    // Only match numeric room labels (2+ digits, optionally with decimal point)
    if (/^\d{2,}(?:\.\d+)?$/.test(textContent)) {
      rooms.add(textContent);
    }
  }
  
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
    // Node IDs are like "Hall_F8_room_291", "CC_F1_room_1", "VE_F1_room_242"
    if (nodeId.includes(`_F${floorNum}_`)) {
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
    // First try to extract from SVG
    const svgRooms = svgContent ? extractRoomsFromSvg(svgContent) : [];
    
    // If SVG has rooms, use them
    if (svgRooms.length > 0) {
      return svgRooms;
    }
    
    // Otherwise, try to get rooms from navmesh
    if (buildingId && floor && navMeshByBuilding[buildingId]) {
      return extractRoomsFromNavMesh(buildingId, floor);
    }
    
    return [];
  }, [svgContent, buildingId, floor]);
}
