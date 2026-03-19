import { useMemo } from 'react';
import { findPath, generateSvgPath, getRoomNodeId, getFloorsInPath, splitPathByFloor, generateSvgPathForFloor } from '../utils/Pathfinding';
import { NavMeshNode } from '../types/building';

/**
 * Find a path between two rooms (supports multi-floor paths for Hall Building)
 * @param buildingId Building identifier
 * @param _floorLevel Current floor level (used for other buildings, ignored for Hall Building)
 * @param startRoom Starting room label
 * @param endRoom Ending room label
 * @param options Optional settings for accessibility mode
 * @returns Path as array of NavMeshNode, or null if no path found
 */
export function useIndoorPath(
  buildingId: string | undefined,
  _floorLevel: string,
  startRoom: string | undefined,
  endRoom: string | undefined,
  options?: { accessibleOnly?: boolean }
): NavMeshNode[] | null {
  return useMemo(() => {
    if (!buildingId || !startRoom || !endRoom) {
      return null;
    }
    
    // For Hall Building, we need to find which floor each room is on
    // The navmesh contains all floors, so we search across all of them
    const startNodeId = getRoomNodeId(buildingId, _floorLevel, startRoom);
    const endNodeId = getRoomNodeId(buildingId, _floorLevel, endRoom);
    
    if (startNodeId === null || endNodeId === null) {
      console.log(`[useIndoorPath] Could not find node IDs: start=${startNodeId}, end=${endNodeId}`);
      return null;
    }
    
    console.log(`[useIndoorPath] Finding path from ${startNodeId} to ${endNodeId} (accessibleOnly: ${options?.accessibleOnly ?? false})`);
    const path = findPath(buildingId, _floorLevel, startNodeId, endNodeId, options);
    
    if (path) {
      const floors = getFloorsInPath(path);
      console.log(`[useIndoorPath] Path found with ${path.length} nodes across floors: ${floors.join(', ')}`);
    }
    
    return path;
  }, [buildingId, _floorLevel, startRoom, endRoom, options?.accessibleOnly]);
}

export function useSvgPathString(path: NavMeshNode[] | null): string {
  return useMemo(() => {
    if (!path || path.length === 0) return '';
    return generateSvgPath(path);
  }, [path]);
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
