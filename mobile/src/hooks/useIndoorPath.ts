import { useMemo } from 'react';
import { findPath, generateSvgPath } from '../utils/Pathfinding';
import { NavMeshNode } from '../types/indoor';

export function useIndoorPath(
  buildingId: string | undefined,
  floorLevel: string,
  startNodeId: number | undefined,
  endNodeId: number | undefined
): NavMeshNode[] | null {
  return useMemo(() => {
    if (!buildingId || startNodeId === undefined || endNodeId === undefined) {
      return null;
    }
    return findPath(buildingId, floorLevel, startNodeId, endNodeId);
  }, [buildingId, floorLevel, startNodeId, endNodeId]);
}

export function useSvgPathString(path: NavMeshNode[] | null): string {
  return useMemo(() => {
    if (!path || path.length === 0) return '';
    return generateSvgPath(path);
  }, [path]);
}
