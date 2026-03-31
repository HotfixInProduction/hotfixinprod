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
  'John Molson Building': { navMesh: mbNavMeshJson as NavMesh, prefix: 'MB-' },
  'MB': { navMesh: mbNavMeshJson as NavMesh, prefix: 'MB-' },
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
 * Extract floor from node ID
 * Standard pattern: "Hall_F8_room_291" -> "8"
 * MB-S2 pattern: "MB-S2_F1_..." -> "S2"
 */
function extractFloorFromNodeId(nodeId: string): string | null {
  // Check for MB-S2 pattern first
  if (nodeId.startsWith('MB-S2') || nodeId.startsWith('mb-s2')) {
    return 'S2';
  }
  
  const floorMatch = /_F(\d+)_/.exec(nodeId);
  return floorMatch ? floorMatch[1] : null;
}

/**
 * Create a room object with building metadata
 */
function createRoomEntry(
  roomLabel: string,
  floor: string,
  config: BuildingConfig,
  buildingId: string
): RoomWithBuilding {
  const cleanLabel =
    config.prefix && roomLabel.startsWith(config.prefix)
      ? roomLabel.substring(config.prefix.length)
      : roomLabel;

  return {
    room: cleanLabel,
    prefix: config.prefix,
    buildingId,
    floor,
    displayLabel: `${config.prefix}${cleanLabel} (Floor ${floor})`,
  };
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
    const floor = extractFloorFromNodeId(nodeId);
    
    if (!floor) continue;
    
    const roomFloorKey = `${roomLabel}|${floor}`;
    if (roomFloorSet.has(roomFloorKey)) continue;
    
    roomFloorSet.add(roomFloorKey);
    rooms.push(createRoomEntry(roomLabel, floor, config, buildingId));
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
