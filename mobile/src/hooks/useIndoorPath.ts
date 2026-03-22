import { useMemo } from 'react';
import { findPath, getRoomNodeId, getFloorsInPath, splitPathByFloor, generateSvgPathForFloor, getPOIsByType } from '../utils/Pathfinding';
import { NavMeshNode } from '../types/building';

/**
 * Find the nearest exit node for a building
 */
function findNearestExit(buildingId: string): string | null {
  const exits = getPOIsByType(buildingId, '1', 'building_entry_exit');
  
  if (exits.length === 0) {
    console.log('[findNearestExit] No building exits found');
    return null;
  }
  
  console.log(`[findNearestExit] Found ${exits.length} exits, using: ${exits[0].nodeId}`);
  return exits[0].nodeId;
}

/**
 * Log and return a path with floor information
 */
function logAndReturnPath(path: NavMeshNode[] | null, logPrefix: string): NavMeshNode[] | null {
  if (path) {
    const floors = getFloorsInPath(path);
    console.log(`[${logPrefix}] Path found with ${path.length} nodes across floors: ${floors.join(', ')}`);
  }
  return path;
}

/**
 * Find path from a room to building exit (for cross-building navigation)
 */
function findPathToExit(
  buildingId: string,
  floorLevel: string,
  roomLabel: string,
  accessibleOnly: boolean
): NavMeshNode[] | null {
  const roomNodeId = getRoomNodeId(buildingId, floorLevel, roomLabel);
  if (roomNodeId === null) {
    console.log(`[findPathToExit] Could not find room node: ${roomLabel}`);
    return null;
  }
  
  const exitNodeId = findNearestExit(buildingId);
  if (exitNodeId === null) {
    console.log('[findPathToExit] Could not find building exit');
    return null;
  }
  
  console.log(`[findPathToExit] Finding path from ${roomNodeId} to exit ${exitNodeId}`);
  return logAndReturnPath(
    findPath(buildingId, floorLevel, roomNodeId, exitNodeId, { accessibleOnly }),
    'findPathToExit'
  );
}

/**
 * Find path from building entry to a room (for cross-building navigation)
 */
function findPathFromEntry(
  buildingId: string,
  floorLevel: string,
  roomLabel: string,
  accessibleOnly: boolean
): NavMeshNode[] | null {
  const roomNodeId = getRoomNodeId(buildingId, floorLevel, roomLabel);
  if (roomNodeId === null) {
    console.log(`[findPathFromEntry] Could not find room node: ${roomLabel}`);
    return null;
  }
  
  const entryNodeId = findNearestExit(buildingId);
  if (entryNodeId === null) {
    console.log('[findPathFromEntry] Could not find building entry');
    return null;
  }
  
  console.log(`[findPathFromEntry] Finding path from entry ${entryNodeId} to ${roomNodeId}`);
  return logAndReturnPath(
    findPath(buildingId, floorLevel, entryNodeId, roomNodeId, { accessibleOnly }),
    'findPathFromEntry'
  );
}

/**
 * Find path between two rooms in the same building
 */
function findPathBetweenRooms(
  buildingId: string,
  floorLevel: string,
  startRoom: string,
  endRoom: string,
  accessibleOnly: boolean
): NavMeshNode[] | null {
  const startNodeId = getRoomNodeId(buildingId, floorLevel, startRoom);
  const endNodeId = getRoomNodeId(buildingId, floorLevel, endRoom);
  
  if (startNodeId === null || endNodeId === null) {
    console.log(`[findPathBetweenRooms] Could not find node IDs: start=${startNodeId}, end=${endNodeId}`);
    return null;
  }
  
  console.log(`[findPathBetweenRooms] Finding path from ${startNodeId} to ${endNodeId} (accessibleOnly: ${accessibleOnly})`);
  return logAndReturnPath(
    findPath(buildingId, floorLevel, startNodeId, endNodeId, { accessibleOnly }),
    'findPathBetweenRooms'
  );
}

/**
 * Handle cross-building navigation path finding
 */
function findCrossBuildingPath(
  currentBuildingId: string,
  floorLevel: string,
  startRoom: string,
  endRoom: string,
  startBuildingId: string,
  endBuildingId: string,
  accessibleOnly: boolean
): NavMeshNode[] | null {
  console.log(`[findCrossBuildingPath] Cross-building navigation: ${startBuildingId} -> ${endBuildingId}`);
  
  if (currentBuildingId === startBuildingId) {
    console.log('[findCrossBuildingPath] Showing path from room to building exit');
    return findPathToExit(currentBuildingId, floorLevel, startRoom, accessibleOnly);
  }
  
  if (currentBuildingId === endBuildingId) {
    console.log('[findCrossBuildingPath] Showing path from building entry to room');
    return findPathFromEntry(currentBuildingId, floorLevel, endRoom, accessibleOnly);
  }
  
  console.log('[findCrossBuildingPath] Building ID mismatch for cross-building navigation');
  return null;
}

/**
 * Find a path between two rooms (supports multi-floor paths for Hall Building)
 * Also supports cross-building navigation by routing to/from building exits
 */
export function useIndoorPath(
  buildingId: string | undefined,
  _floorLevel: string,
  startRoom: string | undefined,
  endRoom: string | undefined,
  options?: { accessibleOnly?: boolean; startBuildingId?: string; endBuildingId?: string }
): NavMeshNode[] | null {
  return useMemo(() => {
    if (!buildingId || !startRoom || !endRoom) {
      return null;
    }
    
    const accessibleOnly = options?.accessibleOnly ?? false;
    const startBuildingId = options?.startBuildingId ?? buildingId;
    const endBuildingId = options?.endBuildingId ?? buildingId;
    
    // Cross-building or same-building navigation
    if (startBuildingId === endBuildingId) {
        console.log(`[useIndoorPath] Same building navigation requested: ${startBuildingId} -> ${endBuildingId}`);
        return findPathBetweenRooms(buildingId, _floorLevel, startRoom, endRoom, accessibleOnly);
    } else {
        console.log(`[useIndoorPath] Cross-building navigation requested: ${startBuildingId} -> ${endBuildingId}`);
        return findCrossBuildingPath(
           buildingId, _floorLevel, startRoom, endRoom,
           startBuildingId, endBuildingId, accessibleOnly
        );
    }
  }, [buildingId, _floorLevel, startRoom, endRoom, options?.accessibleOnly, options?.startBuildingId, options?.endBuildingId]);
}


/**
 * Get the floors involved in a path
 */
export function usePathFloors(path: NavMeshNode[] | null): number[] {
  return useMemo(() => {
    if (!path || path.length === 0) return [];
    return getFloorsInPath(path);
  }, [path]);
}

/**
 * Split a path into floor segments
 */
export function usePathSegments(path: NavMeshNode[] | null): Array<{ floor: number; nodes: NavMeshNode[] }> {
  return useMemo(() => {
    if (!path || path.length === 0) return [];
    return splitPathByFloor(path);
  }, [path]);
}

/**
 * Generate SVG path string for a specific floor
 */
export function useSvgPathForFloor(path: NavMeshNode[] | null, floor: number): string {
  return useMemo(() => {
    if (!path || path.length === 0) return '';
    return generateSvgPathForFloor(path, floor);
  }, [path, floor]);
}
