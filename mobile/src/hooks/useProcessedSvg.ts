import { useMemo } from 'react';
import { highlightRoomInSvg, generatePathElements } from '../utils/svgUtils';
import { NavMeshNode } from '../types/building';

// Coordinate transformation for Hall Building (must match Pathfinding.ts)
function transformHallCoordinates(x: number, y: number): { x: number; y: number } {
  const scaleX = 0.5;
  const scaleY = 0.5;
  const offsetX = 0;
  const offsetY = 0;
  
  return {
    x: x * scaleX + offsetX,
    y: y * scaleY + offsetY,
  };
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

    // Transform coordinates for Hall Building markers
    const isHallBuilding = (startNode.data as { buildingId?: string }).buildingId === 'Hall';
    const startCoord = isHallBuilding 
      ? transformHallCoordinates(startNode.data.x, startNode.data.y)
      : { x: startNode.data.x, y: startNode.data.y };
    const endCoord = isHallBuilding
      ? transformHallCoordinates(endNode.data.x, endNode.data.y)
      : { x: endNode.data.x, y: endNode.data.y };

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
