import { useMemo } from 'react';
import { highlightRoomInSvg, generatePathElements } from '../utils/svgUtils';
import { NavMeshNode } from '../types/building';

// Coordinate transformation for buildings with 2x scale navmesh
// Hall, VE, and CC buildings all use navmesh at 2x scale compared to SVG
// Scale 0.5 transforms navmesh coordinates to SVG coordinates
function transformNavMeshCoordinates(x: number, y: number): { x: number; y: number } {
  const scale = 0.5;
  return { x: x * scale, y: y * scale };
}

export function useProcessedSvg(
  rawSvgContent: string | undefined,
  path: NavMeshNode[] | null,
  pathString: string,
  startRoom: string | undefined,
  nextRoom: string | undefined
): string | undefined {
  return useMemo(() => {
    if (!rawSvgContent) {
      return undefined;
    }
    
    const highlighted = highlightRoomInSvg(rawSvgContent, startRoom, nextRoom);
    
    if (!path || !pathString) {
      console.log('[useProcessedSvg] No path or pathString', { path: path?.length, pathString });
      return highlighted;
    }

    const startNode = path[0];
    const endNode = path.at(-1);

    if (!startNode?.data || !endNode?.data) {
      console.log('[useProcessedSvg] Missing node data', { startNode, endNode });
      return highlighted;
    }

    // Transform coordinates based on building
    const buildingId = (startNode.data as { buildingId?: string }).buildingId;
    
    const transformCoord = (x: number, y: number, building: string | undefined): { x: number; y: number } => {
      if (building === 'Hall' || building === 'VE' || building === 'CC') {
        return transformNavMeshCoordinates(x, y);
      }
      // For VL and others - use coordinates directly
      return { x, y };
    };
    
    const startCoord = transformCoord(startNode.data.x, startNode.data.y, buildingId);
    const endCoord = transformCoord(endNode.data.x, endNode.data.y, buildingId);

    console.log('[useProcessedSvg] Path coordinates:', {
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

    console.log('[useProcessedSvg] Generated pathElements:', pathElements.substring(0, 200) + '...');

    // Find the LAST </svg> tag to insert before (handles nested SVGs like icons)
    const lastSvgCloseIndex = highlighted.lastIndexOf('</svg>');
    if (lastSvgCloseIndex !== -1) {
      return highlighted.slice(0, lastSvgCloseIndex) + pathElements + highlighted.slice(lastSvgCloseIndex);
    }
    
    return highlighted.replace('</svg>', `${pathElements}</svg>`);
  }, [rawSvgContent, path, pathString, startRoom, nextRoom]);
}
