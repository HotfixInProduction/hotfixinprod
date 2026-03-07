import { useMemo } from 'react';
import { highlightRoomInSvg, generatePathElements } from '../utils/svgUtils';
import { NavMeshNode } from '../types/building';

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
      return highlighted;
    }

    const startNode = path[0];
    const endNode = path.at(-1);

    if (!startNode?.data || !endNode?.data) {
      return highlighted;
    }

    const pathElements = generatePathElements(
      pathString,
      startNode.data.x,
      startNode.data.y,
      endNode.data.x,
      endNode.data.y
    );

    return highlighted.replace('</svg>', `${pathElements}</svg>`);
  }, [rawSvgContent, path, pathString, startRoom, nextRoom]);
}
