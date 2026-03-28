import path from 'ngraph.path';
import loadFromJson, { JsonNode, JsonGraph } from 'ngraph.fromjson';
import hallNavMeshJson from '../data/navmesh/hall.json';
import mbNavMeshJson from '../data/navmesh/mb.json';
import veNavMeshJson from '../data/navmesh/ve.json';
import vlNavMeshJson from '../data/navmesh/vl.json';
import ccNavMeshJson from '../data/navmesh/cc.json';
import { NavMeshNode, POIInfo, POIType } from '../types/building';

// Standard NavMesh format
type NavMesh = JsonGraph<JsonNode<{ x: number; y: number; type?: string; buildingId?: string; floor?: number; label?: string; accessible?: boolean }>, { fromId: string | number; toId: string | number }> & {
  roomIndex?: Record<string, string>;
  poiIndex?: Record<string, Array<{ nodeId: string; label: string; floor: number; x: number; y: number }>>;
};

// Widen types at import time to satisfy TypeScript's lint rules
const hallNavMesh: NavMesh = hallNavMeshJson as NavMesh;
const mbNavMesh: NavMesh = mbNavMeshJson as NavMesh;
const veNavMesh: NavMesh = veNavMeshJson as NavMesh;
const vlNavMesh: NavMesh = vlNavMeshJson as NavMesh;
const ccNavMesh: NavMesh = ccNavMeshJson as NavMesh;

// Map building IDs to their navmeshes
const navMeshes: Map<string, NavMesh> = new Map([
  ['Hall Building', hallNavMesh],
  ['John Molson Building', mbNavMesh],
  ['MB', mbNavMesh],  // Label alias
  ['Central Building', ccNavMesh],  // CC building
  ['CC', ccNavMesh],  // Label alias
  ['Vanier Extension', veNavMesh],  // VE building
  ['VE', veNavMesh],  // Label alias
  ['Vanier Library Building', vlNavMesh],  // VL building
  ['VL', vlNavMesh],  // Label alias
]);

/**
 * Get navmesh by building ID
 */
function getNavMeshByKey(buildingId: string, _floorLevel?: string): NavMesh | undefined {
  // Direct lookup by building ID
  const navMesh = navMeshes.get(buildingId);
  if (navMesh) {
    return navMesh;
  }
  // Fallback to old key format for backward compatibility
  const key = `${buildingId}#${_floorLevel}`;
  return navMeshes.get(key);
}

/**
 * Get the room index from a navmesh (supports both roomIndex and roomToNode)
 */
function getRoomIndex(navMesh: NavMesh): Record<string, string> | null {
  if ('roomIndex' in navMesh && navMesh.roomIndex) {
    return navMesh.roomIndex;
  }
  return null;
}

// Building prefix configuration for room label lookup
const BUILDING_PREFIXES: Record<string, string> = {
  'Hall Building': 'H',
  'Central Building': 'CC',
  'Vanier Extension': 'VE',
};

/**
 * Generate label variants to try for room lookup
 */
function generateLabelVariants(roomLabel: string, prefix: string): string[] {
  const variants: string[] = [];
  
  // Basic variants with prefix
  variants.push(`${prefix}-${roomLabel}`, `${prefix}-${roomLabel.replace('.', '-')}`);
  
  // Handle trailing zeros: 805.10 -> prefix-805-1 (remove trailing zeros after decimal)
  if (roomLabel.includes('.')) {
    const [base, decimal] = roomLabel.split('.');
    // Use string manipulation instead of regex to avoid ReDoS
    // Remove trailing zeros by finding the last non-zero position
    let trimmedDecimal = decimal;
    while (trimmedDecimal.length > 0 && trimmedDecimal.endsWith('0')) {
      trimmedDecimal = trimmedDecimal.slice(0, -1);
    }
    if (trimmedDecimal) {
      variants.push(`${prefix}-${base}-${trimmedDecimal}`);
    } else {
      variants.push(`${prefix}-${base}`);
    }
  }
  
  return variants;
}

/**
 * Search for a room in the index using label variants
 */
function searchRoomInIndex(
  roomIndex: Record<string, string>,
  roomLabel: string,
  prefix: string
): string | null {
  const variants = generateLabelVariants(roomLabel, prefix);
  
  for (const label of variants) {
    const nodeId = roomIndex[label];
    if (nodeId !== undefined) {
      return nodeId;
    }
  }
  
  return null;
}

/**
 * Get the navmesh node ID for a given room label
 * @param buildingId Building identifier (e.g., "Hall Building")
 * @param _floorLevel Floor level (e.g., "8") - used for logging only
 * @param roomLabel Room label from SVG (e.g., "829", "862", "862.5", "805.10")
 * @returns The node ID as a string, or null if not found
 */
export function getRoomNodeId(
  buildingId: string,
  _floorLevel: string,
  roomLabel: string
): string | null {
  const navMesh = getNavMeshByKey(buildingId, _floorLevel);
  if (!navMesh) {
    return null;
  }
  
  const roomIndex = getRoomIndex(navMesh);
  if (!roomIndex) {
    return null;
  }

  // Try the room label directly first
  const directNodeId = roomIndex[roomLabel];
  if (directNodeId !== undefined) {
    return directNodeId;
  }
  
  // Try building-specific prefix lookup
  const prefix = BUILDING_PREFIXES[buildingId];
  if (prefix) {
    return searchRoomInIndex(roomIndex, roomLabel, prefix);
  }
  
  return null;
}


/**
 * Build node accessibility map from the parsed graph
 */
function buildNodeAccessibilityMap(graph: any): Map<string, boolean> {
  const map = new Map<string, boolean>();
  graph.forEachNode((node: any) => {
    if (node.data?.accessible !== undefined) {
      map.set(String(node.id), node.data.accessible);
    }
  });
  return map;
}

/**
 * Build edge direction map for escalator detection from the parsed graph
 */
function buildEdgeDirectionMap(graph: any): Map<string, { fromFloor: number; toFloor: number }> {
  const map = new Map<string, { fromFloor: number; toFloor: number }>();
  graph.forEachLink((link: any) => {
    const fromId = String(link.fromId);
    const toId = String(link.toId);
    const key = `${fromId}->${toId}`;
    
    const fromFloor = getFloorFromNodeId(fromId);
    const toFloor = getFloorFromNodeId(toId);
    
    if (fromFloor !== null && toFloor !== null && fromFloor !== toFloor) {
      map.set(key, { fromFloor, toFloor });
    }
  });
  return map;
}

/**
 * Build set of oriented edges (unidirectional) from the parsed graph
 */
function buildOrientedEdgesSet(graph: any): Set<string> {
  const set = new Set<string>();
  graph.forEachLink((link: any) => {
    if (link.data?.oriented === true) {
      const key = `${link.fromId}->${link.toId}`;
      set.add(key);
    }
  });
  return set;
}

/**
 * Calculate distance between two nodes, considering accessibility and oriented edges
 */
function calculateNodeDistance(
  from: { id: string | number; data?: { x: number; y: number } | null },
  to: { id: string | number; data?: { x: number; y: number } | null },
  nodeAccessibility: Map<string, boolean | undefined>,
  edgeDirection: Map<string, { fromFloor: number; toFloor: number }>,
  orientedEdges: Set<string>,
  accessibleOnly: boolean
): number {
  const fromId = String(from.id);
  const toId = String(to.id);
  const fromFloor = getFloorFromNodeId(fromId);
  const toFloor = getFloorFromNodeId(toId);
  
  // Check if this is a reverse traversal of an oriented edge
  // Oriented edges can only be traversed in the defined direction (fromId -> toId)
  const reverseEdgeKey = `${toId}->${fromId}`;
  if (orientedEdges.has(reverseEdgeKey)) {
    // Trying to traverse in reverse direction - blocked
    return Infinity;
  }
  
  const isFloorTransition = fromFloor !== null && toFloor !== null && fromFloor !== toFloor;
  
  if (isFloorTransition) {
    const fromAccessible = nodeAccessibility.get(fromId);
    const toAccessible = nodeAccessibility.get(toId);
    
    // Skip non-accessible floor transitions in accessibility mode
    if (accessibleOnly && (fromAccessible === false || toAccessible === false)) {
      return Infinity;
    }
    
  }
  
  if (from.data && to.data) {
    return Math.hypot(from.data.x - to.data.x, from.data.y - to.data.y);
  }
  return 1;
}

/**
 * Calculate heuristic for A* pathfinding
 */
function calculateHeuristic(
  from: { id: string | number; data?: { x: number; y: number } | null },
  to: { id: string | number; data?: { x: number; y: number } | null }
): number {
  if (!from.data || !to.data) {
    return 0;
  }
  
  const fromFloor = getFloorFromNodeId(String(from.id));
  const toFloor = getFloorFromNodeId(String(to.id));
  const floorDiff = (fromFloor !== null && toFloor !== null) 
    ? Math.abs(fromFloor - toFloor) * 1000 
    : 0;
  
  return Math.hypot(from.data.x - to.data.x, from.data.y - to.data.y) + floorDiff;
}

/**
 * Convert path result to NavMeshNode array
 */
function convertPathToNodes(foundPath: Array<{ id: string | number; data?: any }>): NavMeshNode[] {
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

/**
 * A* pathfinding algorithm using ngraph - supports multi-floor paths with accessibility
 * @param buildingId Building identifier (e.g., "Hall Building" or "hall")
 * @param _floorLevel Floor level (e.g., "8") - not used for Hall Building since navmesh contains all floors
 * @param startNodeId The starting node ID (string or number)
 * @param endNodeId The destination node ID (string or number)
 * @param options Optional settings for accessibility mode
 * @returns Array of nodes representing the path, or null if no path found
 */
export function findPath(
  buildingId: string,
  _floorLevel: string,
  startNodeId: string | number,
  endNodeId: string | number,
  options?: { accessibleOnly?: boolean }
): NavMeshNode[] | null {
  const accessibleOnly = options?.accessibleOnly ?? false;
  
  const navMesh = getNavMeshByKey(buildingId, _floorLevel);
  if (!navMesh) {
    console.error(`NavMesh not found for building="${buildingId}" floor="${_floorLevel}"`);
    return null;
  }

  const graph = loadFromJson(navMesh);
  const startId = String(startNodeId);
  const endId = String(endNodeId);

  if (!graph.getNode(startId) || !graph.getNode(endId)) {
    console.error('Start or end node not found in navmesh');
    return null;
  }

  const nodeAccessibility = buildNodeAccessibilityMap(graph);
  const edgeDirection = buildEdgeDirectionMap(graph);
  const orientedEdges = buildOrientedEdgesSet(graph);

  const pathfinder = path.aStar(graph, {
    distance: (from, to, _link) => 
      calculateNodeDistance(from, to, nodeAccessibility, edgeDirection, orientedEdges, accessibleOnly),
    heuristic: (from, to) => calculateHeuristic(from, to),
  });

  const foundPath = pathfinder.find(startId, endId);

  if (!foundPath || foundPath.length === 0) {
    return null;
  }

  return convertPathToNodes(foundPath);
}

// Coordinate transformation for buildings with 2x scale navmesh
// Hall, VE, and CC buildings all use navmesh at 2x scale compared to SVG
// Scale 0.5 transforms navmesh coordinates to SVG coordinates
function transformNavMeshCoordinates(x: number, y: number): { x: number; y: number } {
  const scale = 0.5;
  return { x: x * scale, y: y * scale };
}

/**
 * Transform coordinates based on building ID
 * Hall, VE, CC: scale 0.5, VL and others: no transformation needed
 */
function transformBuildingCoordinates(node: { x: number; y: number; buildingId?: string }): { x: number; y: number } {
  if (node.buildingId === 'Hall' || node.buildingId === 'VE' || node.buildingId === 'CC') {
    return transformNavMeshCoordinates(node.x, node.y);
  }
  // For VL and others - use coordinates directly (no transformation needed)
  return { x: node.x, y: node.y };
}

export function generateSvgPath(path: NavMeshNode[]): string {
  if (path.length === 0) return '';

  const firstNode = path[0].data;
  if (!firstNode) return '';

  const firstCoord = transformBuildingCoordinates(firstNode);
  let pathString = `M ${firstCoord.x} ${firstCoord.y}`;
  
  for (let i = 1; i < path.length; i++) {
    const nodeData = path[i].data;
    if (nodeData) {
      const coord = transformBuildingCoordinates(nodeData);
      pathString += ` L ${coord.x} ${coord.y}`;
    }
  }

  return pathString;
}

/**
 * Filter POI by floor for Hall Building
 */
function shouldIncludePoi(poi: { floor: number }, buildingId: string, floorNum: number): boolean {
  return buildingId !== 'Hall Building' || poi.floor === floorNum;
}

/**
 * Get POIs from new format navmesh
 */
function getPOIsFromNewFormat(
  poiIndex: Record<string, Array<{ nodeId: string; label: string; floor: number; x: number; y: number }>>,
  poiType: POIType,
  buildingId: string,
  floorNum: number
): (POIInfo & { label: string })[] {
  const pois: (POIInfo & { label: string })[] = [];
  const poiList = poiIndex[poiType];
  
  if (!poiList) {
    return pois;
  }
  
  for (const poi of poiList) {
    if (shouldIncludePoi(poi, buildingId, floorNum)) {
      pois.push({
        nodeId: poi.nodeId,
        type: poiType,
        label: poi.label,
      });
    }
  }
  
  return pois;
}

export function getPOIsByType(
  buildingId: string,
  floorLevel: string,
  poiType: POIType
): (POIInfo & { label: string })[] {
  const navMesh = getNavMeshByKey(buildingId, floorLevel);
  if (!navMesh || !navMesh.poiIndex) {
    return [];
  }
  
  const floorNum = Number.parseInt(floorLevel, 10);
  return getPOIsFromNewFormat(navMesh.poiIndex, poiType, buildingId, floorNum);
}

/**
 * Get all POIs from new format navmesh
 */
function getAllPOIsFromNewFormat(
  poiIndex: Record<string, Array<{ nodeId: string; label: string; floor: number; x: number; y: number }>>,
  buildingId: string,
  floorNum: number
): Record<string, POIInfo> {
  const result: Record<string, POIInfo> = {};
  
  for (const [poiType, poiList] of Object.entries(poiIndex)) {
    for (const poi of poiList) {
      if (shouldIncludePoi(poi, buildingId, floorNum)) {
        result[poi.label] = {
          nodeId: poi.nodeId,
          type: poiType as POIType,
          label: poi.label,
        };
      }
    }
  }
  
  return result;
}

export function getAllPOIs(
  buildingId: string,
  floorLevel: string
): Record<string, POIInfo> {
  const navMesh = getNavMeshByKey(buildingId, floorLevel);
  if (!navMesh || !navMesh.poiIndex) {
    return {};
  }
  
  const floorNum = Number.parseInt(floorLevel, 10);
  return getAllPOIsFromNewFormat(navMesh.poiIndex, buildingId, floorNum);
}

/**
 * Get the floor number from a node ID
 * Node IDs are like "Hall_F8_room_291" or "Hall_F9_stair_landing_21"
 */
export function getFloorFromNodeId(nodeId: string): number | null {
  const match = new RegExp(/_F(\d+)_/).exec(nodeId);
  if (match) {
    return Number.parseInt(match[1], 10);
  }
  return null;
}

/**
 * Get the floor from a node, preferring node data over ID extraction
 */
function getFloorFromNode(node: NavMeshNode): number | null {
  // Prefer floor from node data
  const nodeData = node.data as { floor?: number } | undefined;
  if (nodeData?.floor !== undefined) {
    return nodeData.floor;
  }
  // Fall back to extracting from ID
  return getFloorFromNodeId(String(node.id));
}

/**
 * Split a path into floor segments
 * Returns an array of { floor, nodes } objects
 */
export function splitPathByFloor(path: NavMeshNode[]): Array<{ floor: number; nodes: NavMeshNode[] }> {
  if (path.length === 0) return [];
  
  const segments: Array<{ floor: number; nodes: NavMeshNode[] }> = [];
  let currentFloor: number | null = null;
  let currentNodes: NavMeshNode[] = [];
  
  for (const node of path) {
    const nodeFloor = getFloorFromNode(node);
    
    if (nodeFloor === null) {
      // Skip nodes without floor info
      continue;
    }
    
    if (currentFloor === null) {
      currentFloor = nodeFloor;
      currentNodes = [node];
    } else if (nodeFloor === currentFloor) {
      currentNodes.push(node);
    } else {
      // Floor changed - save current segment and start new one
      segments.push({ floor: currentFloor, nodes: currentNodes });
      currentFloor = nodeFloor;
      currentNodes = [node];
    }
  }
  
  // Don't forget the last segment
  if (currentNodes.length > 0 && currentFloor !== null) {
    segments.push({ floor: currentFloor, nodes: currentNodes });
  }
  
  return segments;
}

/**
 * Get unique floors in a path
 */
export function getFloorsInPath(path: NavMeshNode[]): number[] {
  const floors = new Set<number>();
  for (const node of path) {
    const floor = getFloorFromNode(node);
    if (floor !== null) {
      floors.add(floor);
    }
  }
  return Array.from(floors).sort((a, b) => a - b);
}

/**
 * Generate SVG path for a specific floor
 */
export function generateSvgPathForFloor(path: NavMeshNode[], targetFloor: number): string {
  const floorNodes = path.filter(node => {
    // Prefer floor from node data, fall back to extracting from ID
    const nodeData = node.data as { floor?: number } | undefined;
    const nodeFloor = nodeData?.floor ?? getFloorFromNodeId(String(node.id));
    return nodeFloor === targetFloor;
  });
  
  if (floorNodes.length === 0) return '';
  
  const firstNode = floorNodes[0].data;
  if (!firstNode) return '';
  
  const firstCoord = transformBuildingCoordinates(firstNode);
  let pathString = `M ${firstCoord.x} ${firstCoord.y}`;
  
  for (let i = 1; i < floorNodes.length; i++) {
    const nodeData = floorNodes[i].data;
    if (nodeData) {
      const coord = transformBuildingCoordinates(nodeData);
      pathString += ` L ${coord.x} ${coord.y}`;
    }
  }
  
  return pathString;
}

/**
 * Find POI node ID in new format navmesh
 */
function findPOIInNewFormat(
  poiIndex: Record<string, Array<{ nodeId: string; label: string; floor: number; x: number; y: number }>>,
  poiLabel: string,
  buildingId: string,
  floorNum: number
): string | null {
  for (const poiList of Object.values(poiIndex)) {
    for (const poi of poiList) {
      if (shouldIncludePoi(poi, buildingId, floorNum) && poi.label === poiLabel) {
        return poi.nodeId;
      }
    }
  }
  return null;
}

export function getPOINodeId(
  buildingId: string,
  floorLevel: string,
  poiLabel: string
): string | null {
  const navMesh = getNavMeshByKey(buildingId, floorLevel);
  if (!navMesh || !navMesh.poiIndex) {
    return null;
  }
  
  const floorNum = Number.parseInt(floorLevel, 10);
  return findPOIInNewFormat(navMesh.poiIndex, poiLabel, buildingId, floorNum);
}

export function generateIndoorInstruction(nodes: NavMeshNode[], isLastFloor: boolean): string {
  if (!nodes || nodes.length === 0) return 'Follow the path';
  
  const lastNode = nodes.at(-1);
  if (!lastNode) return 'Follow the path';
  
  const nodeType = (lastNode.data as any)?.type;

  if (isLastFloor && nodeType === 'building_entry_exit') return 'Head to the building exit';
  if (nodeType === 'elevator' || nodeType === 'elevator_door') return 'Proceed to the elevator';
  if (nodeType === 'stairs' || nodeType === 'stair_landing') return 'Take the stairs';
  if (nodeType === 'escalator' || nodeType === 'escalator_up' || nodeType === 'escalator_down') return 'Take the escalator';
  if (isLastFloor && nodeType) return 'Arrive at destination';

  return 'Follow the path';
}
