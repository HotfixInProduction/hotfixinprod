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

// Building configuration combining navmesh and prefix
type BuildingConfig = {
  navMesh: NavMesh;
  prefix: string;
};

// Consolidated building configurations
const buildingConfigs: Record<string, BuildingConfig> = {
  'Hall Building': { navMesh: hallNavMeshJson as NavMesh, prefix: 'H-' },
  'Central Building': { navMesh: ccNavMeshJson as NavMesh, prefix: 'CC-' },
  'CC': { navMesh: ccNavMeshJson as NavMesh, prefix: 'CC-' },
  'Vanier Extension': { navMesh: veNavMeshJson as NavMesh, prefix: 'VE-' },
  'VE': { navMesh: veNavMeshJson as NavMesh, prefix: 'VE-' },
  'Vanier Library Building': { navMesh: vlNavMeshJson as NavMesh, prefix: 'VL-' },
  'VL': { navMesh: vlNavMeshJson as NavMesh, prefix: 'VL-' },
};

export interface RoomWithBuilding {
  room: string;
  prefix: string;
  buildingId: string;
  floor: string;
  displayLabel: string; // e.g., "H-801 (Floor 8)"
}

/**
 * Compare rooms by floor and room number for sorting
 */
function compareRooms(a: RoomWithBuilding, b: RoomWithBuilding): number {
  const floorA = Number.parseInt(a.floor, 10);
  const floorB = Number.parseInt(b.floor, 10);
  if (floorA !== floorB) {
    return floorA - floorB;
  }
  const numA = Number.parseFloat(a.room);
  const numB = Number.parseFloat(b.room);
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
  return a.room.localeCompare(b.room);
}

/**
 * Get all rooms for a specific building across all floors
 */
function getRoomsForBuildingFromNavMesh(buildingId: string): RoomWithBuilding[] {
  const config = buildingConfigs[buildingId];
  if (!config) {
    return [];
  }

  const rooms: RoomWithBuilding[] = [];
  const roomIndex = config.navMesh.roomIndex || config.navMesh.roomToNode || {};
  const roomFloorSet = new Set<string>();

  for (const [roomLabel, nodeId] of Object.entries(roomIndex)) {
    // Parse node ID to get floor number: "Hall_F8_room_291" -> 8
    const floorRegex = /_F(\d+)_/;
    const floorMatch = floorRegex.exec(nodeId);
    if (floorMatch) {
      const floor = floorMatch[1];
      const roomFloorKey = `${roomLabel}|${floor}`;

      if (!roomFloorSet.has(roomFloorKey)) {
        roomFloorSet.add(roomFloorKey);

        // Remove building prefix from room label
        const cleanLabel =
          config.prefix && roomLabel.startsWith(config.prefix)
            ? roomLabel.substring(config.prefix.length)
            : roomLabel;

        rooms.push({
          room: cleanLabel,
          prefix: config.prefix,
          buildingId,
          floor,
          displayLabel: `${config.prefix}${cleanLabel} (Floor ${floor})`,
        });
      }
    }
  }

  return rooms.sort(compareRooms);
}

/**
 * Hook to get all rooms for a specific building across all floors
 * Returns array of rooms with floor information
 */
export function useRoomsForBuilding(buildingId: string): RoomWithBuilding[] {
  return useMemo(() => getRoomsForBuildingFromNavMesh(buildingId), [buildingId]);
}
