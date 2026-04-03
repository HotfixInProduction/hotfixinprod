import { useMemo } from 'react';
import { highlightRoomInSvg, generatePathElements } from '../utils/svgUtils';
import { NavMeshNode } from '../types/building';
import { getFloorFromNodeId } from '../utils/Pathfinding';

// Coordinate transformation for buildings with 2x scale navmesh
// Hall, VE, and CC buildings all use navmesh at 2x scale compared to SVG
// Scale 0.5 transforms navmesh coordinates to SVG coordinates
function transformNavMeshCoordinates(x: number, y: number): { x: number; y: number } {
  const scale = 0.5;
  return { x: x * scale, y: y * scale };
}

function getFloorFromNode(node: NavMeshNode): number | null {
  const nodeData = node.data as { floor?: number } | undefined;
  if (nodeData?.floor !== undefined) {
    return nodeData.floor;
  }
  return getFloorFromNodeId(String(node.id));
}

function filterNodesByFloor(path: NavMeshNode[], targetFloor: number): NavMeshNode[] {
  return path.filter(node => {
    const nodeFloor = getFloorFromNode(node);
    return nodeFloor === targetFloor;
  });
}

function transformBuildingCoordinates(
  x: number, 
  y: number, 
  buildingId: string | undefined
): { x: number; y: number } {
  if (buildingId === 'Hall' || buildingId === 'VE' || buildingId === 'CC') {
    return transformNavMeshCoordinates(x, y);
  }
  return { x, y };
}

function insertIntoSvg(svg: string, elements: string): string {
  const lastSvgCloseIndex = svg.lastIndexOf('</svg>');
  if (lastSvgCloseIndex !== -1) {
    return svg.slice(0, lastSvgCloseIndex) + elements + svg.slice(lastSvgCloseIndex);
  }
  return svg + elements;
}

function createPathOnlyElement(pathString: string): string {
  return `<path d="${pathString}" stroke="#007AFF" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`;
}

export function useProcessedSvg(
  rawSvgContent: string | undefined,
  path: NavMeshNode[] | null,
  pathString: string,
  startRoom: string | undefined,
  nextRoom: string | undefined,
  currentFloor?: number
): string | undefined {
  return useMemo(() => {
    if (!rawSvgContent) {
      return undefined;
    }
    
    const highlighted = highlightRoomInSvg(rawSvgContent, startRoom, nextRoom);
    
    if (!path || !pathString || path.length === 0) {
      // istanbul ignore next - __DEV__ is removed in production builds
      if (__DEV__) console.log('[useProcessedSvg] No path or pathString', { path: path?.length, pathString });
      return highlighted;
    }

    const floorNodes = currentFloor === undefined ? path : filterNodesByFloor(path, currentFloor);
    
    if (floorNodes.length === 0) {
      return insertIntoSvg(highlighted, createPathOnlyElement(pathString));
    }

    const startNode = floorNodes[0];
    const endNode = floorNodes.at(-1);

    if (!startNode?.data || !endNode?.data) {
      // istanbul ignore next - __DEV__ is removed in production builds
      if (__DEV__) console.log('[useProcessedSvg] Missing node data', { startNode, endNode });
      return highlighted;
    }

    // Transform coordinates based on building
    const buildingId = (startNode.data as { buildingId?: string }).buildingId;
    const startCoord = transformBuildingCoordinates(startNode.data.x, startNode.data.y, buildingId);
    const endCoord = transformBuildingCoordinates(endNode.data.x, endNode.data.y, buildingId);

    // istanbul ignore next - __DEV__ is removed in production builds
    if (__DEV__) console.log('[useProcessedSvg] Path coordinates:', {
      floor: currentFloor,
      floorNodesCount: floorNodes.length,
      startX: startCoord.x,
      startY: startCoord.y,
      endX: endCoord.x,
      endY: endCoord.y,
      pathLength: path.length,
      pathString: pathString.substring(0, 100) + '...'
    });

    const pathElements = generatePathElements(
      pathString,
      startCoord.x,
      startCoord.y,
      endCoord.x,
      endCoord.y
    );

    // istanbul ignore next - __DEV__ is removed in production builds
    if (__DEV__) console.log('[useProcessedSvg] Generated pathElements:', pathElements.substring(0, 200) + '...');

    return insertIntoSvg(highlighted, pathElements);
  }, [rawSvgContent, path, pathString, startRoom, nextRoom, currentFloor]);
}
