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

export interface RoomWithBuilding {
  room: string;
  prefix: string;
  buildingId: string;
  floor: string;
  displayLabel: string; // e.g., "H-801 (Floor 8)"
}

/**
 * Get all rooms for a specific building across all floors
 */
function getRoomsForBuildingFromNavMesh(buildingId: string): RoomWithBuilding[] {
  const rooms: RoomWithBuilding[] = [];
  const navMesh = navMeshByBuilding[buildingId];
  
  if (!navMesh) {
    return [];
  }

  const prefix = buildingPrefixes[buildingId] || '';
  const roomIndex = navMesh.roomIndex || navMesh.roomToNode || {};

  // Extract unique room-floor combinations
  const roomFloorSet = new Set<string>();

  for (const [roomLabel, nodeId] of Object.entries(roomIndex)) {
    // Parse node ID to get floor number: "Hall_F8_room_291" -> 8
    const floorMatch = nodeId.match(/_F(\d+)_/);
    if (floorMatch) {
      const floor = floorMatch[1];
      const roomFloorKey = `${roomLabel}|${floor}`;

      if (!roomFloorSet.has(roomFloorKey)) {
        roomFloorSet.add(roomFloorKey);

        // Remove building prefix from room label
        const cleanLabel =
          prefix && roomLabel.startsWith(prefix)
            ? roomLabel.substring(prefix.length)
            : roomLabel;

        rooms.push({
          room: cleanLabel,
          prefix,
          buildingId,
          floor,
          displayLabel: `${prefix}${cleanLabel} (Floor ${floor})`,
        });
      }
    }
  }

  // Sort by floor, then room number
  return rooms.sort((a, b) => {
    const floorA = Number.parseInt(a.floor, 10);
    const floorB = Number.parseInt(b.floor, 10);
    if (floorA !== floorB) {
      return floorA - floorB;
    }
    const numA = Number.parseFloat(a.room);
    const numB = Number.parseFloat(b.room);
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
    return a.room.localeCompare(b.room);
  });
}

/**
 * Hook to get all rooms for a specific building across all floors
 * Returns array of rooms with floor information
 */
export function useRoomsForBuilding(buildingId: string): RoomWithBuilding[] {
  return useMemo(() => getRoomsForBuildingFromNavMesh(buildingId), [buildingId]);
}
