import { useMemo } from 'react';
import { findPath, generateSvgPath, getRoomNodeId } from '../utils/Pathfinding';
import { NavMeshNode } from '../types/building';

export function useIndoorPath(
  buildingId: string | undefined,
  floorLevel: string,
  startRoom: string | undefined,
  endRoom: string | undefined
): NavMeshNode[] | null {
  return useMemo(() => {
    if (!buildingId || !startRoom || !endRoom) {
      return null;
    }
    
    const startNodeId = getRoomNodeId(buildingId, floorLevel, startRoom);
    const endNodeId = getRoomNodeId(buildingId, floorLevel, endRoom);
    
    if (startNodeId === null || endNodeId === null) {
      return null;
    }
    
    return findPath(buildingId, floorLevel, startNodeId, endNodeId);
  }, [buildingId, floorLevel, startRoom, endRoom]);
}

export function useSvgPathString(path: NavMeshNode[] | null): string {
  return useMemo(() => {
    if (!path || path.length === 0) return '';
    return generateSvgPath(path);
  }, [path]);
}
