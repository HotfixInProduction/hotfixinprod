import path from 'ngraph.path';
import loadFromJson, { JsonNode, JsonGraph } from 'ngraph.fromjson';
import hall8NavMeshJson from '../data/navmesh/hall8.json';
import hall9NavMeshJson from '../data/navmesh/hall9.json';
import john1NavMeshJson from '../data/navmesh/john1.json';
import johnS2NavMeshJson from '../data/navmesh/johnS2.json';
import { NavMeshNode, POIInfo, POIType } from '../types/building';

type NavMesh = JsonGraph<JsonNode<{ x: number; y: number }>, { fromId: string | number; toId: string | number }> & {
  roomToNode?: Record<string, string>;
  poiToNode?: Record<string, POIInfo>;
};

// Widen types at import time to satisfy TypeScript's lint rules
const hall8NavMesh: NavMesh = hall8NavMeshJson as NavMesh;
const hall9NavMesh: NavMesh = hall9NavMeshJson as NavMesh;
const john1NavMesh: NavMesh = john1NavMeshJson as NavMesh;
const johnS2NavMesh: NavMesh = johnS2NavMeshJson as NavMesh;

const navMeshes: Map<string, NavMesh> = new Map([
  ['Hall Building#8', hall8NavMesh],
  ['Hall Building#9', hall9NavMesh],
  ['John Molson Building#S2', johnS2NavMesh],
  ['John Molson Building#1', john1NavMesh],
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
 * Get the navmesh node ID for a given room label
 * @param buildingId Building identifier (e.g., "Hall Building")
 * @param floorLevel Floor level (e.g., "8")
 * @param roomLabel Room label from SVG (e.g., "829", "862")
 * @returns The node ID as a number, or null if not found
 */
export function getRoomNodeId(
  buildingId: string,
  floorLevel: string,
  roomLabel: string
): number | null {
  const navMesh = getNavMeshByKey(buildingId, floorLevel);
  if (!navMesh?.roomToNode) {
    return null;
  }

  const nodeId = navMesh.roomToNode[roomLabel];
  if (nodeId === undefined) {
    return null;
  }

  return Number.parseInt(nodeId, 10);
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

export function getPOIsByType(
  buildingId: string,
  floorLevel: string,
  poiType: POIType
): (POIInfo & { label: string })[] {
  const navMesh = getNavMeshByKey(buildingId, floorLevel);
  if (!navMesh?.poiToNode) {
    return [];
  }

  const pois: (POIInfo & { label: string })[] = [];
  for (const [poiLabel, poiInfo] of Object.entries(navMesh.poiToNode)) {
    if (poiInfo.type === poiType) {
      pois.push({
        ...poiInfo,
        label: poiInfo.label || poiLabel,
      });
    }
  }

  return pois;
}

export function getAllPOIs(
  buildingId: string,
  floorLevel: string
): Record<string, POIInfo> {
  const navMesh = getNavMeshByKey(buildingId, floorLevel);
  return navMesh?.poiToNode || {};
}

export function getPOINodeId(
  buildingId: string,
  floorLevel: string,
  poiLabel: string
): number | null {
  const navMesh = getNavMeshByKey(buildingId, floorLevel);
  if (!navMesh?.poiToNode) {
    return null;
  }

  const poiInfo = navMesh.poiToNode[poiLabel];
  if (!poiInfo) {
    return null;
  }

  return Number.parseInt(poiInfo.nodeId, 10);
}
