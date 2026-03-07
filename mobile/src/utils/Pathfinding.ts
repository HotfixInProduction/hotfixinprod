import path from 'ngraph.path';
import loadFromJson, { JsonNode, JsonGraph } from 'ngraph.fromjson';
import hall8NavMesh from '../data/navmesh/hall8.json';
import hall9NavMesh from '../data/navmesh/hall9.json';
import john1NavMesh from '../data/navmesh/john1.json';
import johnS2NavMesh from '../data/navmesh/johnS2.json';
import { NavMeshNode } from '../types/building';

type NavMesh = JsonGraph<JsonNode<{ x: number; y: number }>, { fromId: string | number; toId: string | number }>;
const navMeshes: Map<string, NavMesh> = new Map([
  ['Hall Building#8', hall8NavMesh as NavMesh],
  ['Hall Building#9', hall9NavMesh as NavMesh],
  ['John Molson Building#S2', johnS2NavMesh as NavMesh],
  ['John Molson Building#1', john1NavMesh as NavMesh],
]);

/**
 * Get navmesh by building ID and floor level
 * Key format: "{buildingId}#{floorLevel}" - uses exact building ID from buildings.js
 */
function getNavMeshByKey(buildingId: string, floorLevel: string): NavMesh | undefined {
  const key = `${buildingId}#${floorLevel}`;
  return navMeshes.get(key);
}

/**
 * A* pathfinding algorithm using ngraph
 * @param buildingId Building identifier (e.g., "Hall Building" or "hall")
 * @param floorLevel Floor level (e.g., "8")
 * @param startNodeId The starting node ID
 * @param endNodeId The destination node ID
 * @returns Array of nodes representing the path, or null if no path found
 */
export function findPath(
  buildingId: string,
  floorLevel: string,
  startNodeId: number,
  endNodeId: number
): NavMeshNode[] | null {
  const navMesh = getNavMeshByKey(buildingId, floorLevel);
  if (!navMesh) {
    console.error(`NavMesh not found for building="${buildingId}" floor="${floorLevel}"`);
    return null;
  }

  const graph = loadFromJson(navMesh);
  const startId = String(startNodeId);
  const endId = String(endNodeId);

  if (!graph.getNode(startId) || !graph.getNode(endId)) {
    console.error('Start or end node not found in navmesh');
    return null;
  }

  const pathfinder = path.aStar(graph, {
    distance: (from, to) => {
      if (from.data && to.data) {
        return Math.hypot(from.data.x - to.data.x, from.data.y - to.data.y);
      }
      return 1;
    },
    heuristic: (from, to) => {
      if (from.data && to.data) {
        return Math.hypot(from.data.x - to.data.x, from.data.y - to.data.y);
      }
      return 0;
    },
  });

  const foundPath = pathfinder.find(startId, endId);

  if (!foundPath || foundPath.length === 0) {
    return null;
  }

  // Convert graph nodes back to NavMeshNode format (reverse order - path comes end-to-start)
  const result: NavMeshNode[] = [];
  for (let i = foundPath.length - 1; i >= 0; i--) {
    const node = foundPath[i];
    result.push({
      id: node.id,
      data: node.data,
    });
  }

  return result;
}

export function generateSvgPath(path: NavMeshNode[]): string {
  if (path.length === 0) return '';

  const firstNode = path[0].data;
  if (!firstNode) return '';

  let pathString = `M ${firstNode.x} ${firstNode.y}`;
  for (let i = 1; i < path.length; i++) {
    const nodeData = path[i].data;
    if (nodeData) {
      pathString += ` L ${nodeData.x} ${nodeData.y}`;
    }
  }

  return pathString;
}
