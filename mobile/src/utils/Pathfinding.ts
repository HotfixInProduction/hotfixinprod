import path from 'ngraph.path';
import loadFromJson, { JsonNode, JsonGraph } from 'ngraph.fromjson';
import hallNavMeshJson from '../data/navmesh/hall.json';
import mbNavMeshJson from '../data/navmesh/mb.json';
import veNavMeshJson from '../data/navmesh/ve.json';
import vlNavMeshJson from '../data/navmesh/vl.json';
import ccNavMeshJson from '../data/navmesh/cc.json';
import { NavMeshNode, POIInfo, POIType } from '../types/building';

// New navmesh format with poiIndex, roomIndex, and structured node IDs
type NewNavMesh = JsonGraph<JsonNode<{ x: number; y: number; type?: string; buildingId?: string; floor?: number; label?: string; accessible?: boolean }>, { fromId: string | number; toId: string | number }> & {
  roomIndex?: Record<string, string>;  // New format
  roomToNode?: Record<string, string>;  // Legacy format (for backward compatibility)
  poiIndex?: Record<string, Array<{ nodeId: string; label: string; floor: number; x: number; y: number }>>;
};

// Old navmesh format (for John Molson building - legacy)
type OldNavMesh = JsonGraph<JsonNode<{ x: number; y: number }>, { fromId: string | number; toId: string | number }> & {
  roomToNode?: Record<string, string>;
  poiToNode?: Record<string, POIInfo>;
};

type NavMesh = NewNavMesh | OldNavMesh;

// Widen types at import time to satisfy TypeScript's lint rules
const hallNavMesh: NewNavMesh = hallNavMeshJson as NewNavMesh;
const mbNavMesh: NewNavMesh = mbNavMeshJson as NewNavMesh;
const veNavMesh: NewNavMesh = veNavMeshJson as NewNavMesh;
const vlNavMesh: NewNavMesh = vlNavMeshJson as NewNavMesh;
const ccNavMesh: NewNavMesh = ccNavMeshJson as NewNavMesh;

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
  if ('roomToNode' in navMesh && navMesh.roomToNode) {
    return navMesh.roomToNode;
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
    const trimmedDecimal = decimal.replace(/0+$/, '');
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
      console.log(`[getRoomNodeId] Found "${roomLabel}" as "${label}" -> ${nodeId}`);
      return nodeId;
    }
  }
  
  console.log(`[getRoomNodeId] Room "${roomLabel}" not found. Tried:`, variants);
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
    console.log(`[getRoomNodeId] NavMesh not found for building="${buildingId}"`);
    return null;
  }
  
  const roomIndex = getRoomIndex(navMesh);
  if (!roomIndex) {
    console.log(`[getRoomNodeId] No room index found in navmesh for building="${buildingId}"`);
    return null;
  }

  // Try the room label directly first
  const directNodeId = roomIndex[roomLabel];
  if (directNodeId !== undefined) {
    console.log(`[getRoomNodeId] Found "${roomLabel}" directly -> ${directNodeId}`);
    return directNodeId;
  }
  
  // Try building-specific prefix lookup
  const prefix = BUILDING_PREFIXES[buildingId];
  if (prefix) {
    return searchRoomInIndex(roomIndex, roomLabel, prefix);
  }
  
  console.log(`[getRoomNodeId] Room "${roomLabel}" not found in building "${buildingId}"`);
  return null;
}

/**
 * Check if an edge is traversable based on accessibility and direction
 * @param fromFloor Floor number of the source node
 * @param toFloor Floor number of the target node
 * @param edgeAccessible The accessible flag from the edge data
 * @param accessibleOnly Whether we're in accessibility mode
 * @param edgeDefinedDirection The direction the edge was defined in the navmesh (from edge key)
 * @returns true if the edge can be traversed
 */
function isEdgeTraversable(
  fromFloor: number | null,
  toFloor: number | null,
  edgeAccessible: boolean | undefined,
  accessibleOnly: boolean,
  edgeDefinedDirection: { fromFloor: number; toFloor: number } | null
): boolean {
  // If accessibility mode is on and edge is not accessible, skip it
  if (accessibleOnly && edgeAccessible === false) {
    return false;
  }
  
  // If not a floor transition, allow it
  if (fromFloor === null || toFloor === null || fromFloor === toFloor) {
    return true;
  }
  
  // For floor transitions with accessible=false, it's an escalator
  // Escalators only work in one direction (up or down, not both)
  // We infer direction from the edge definition in the navmesh
  // If the edge is defined as F8 -> F9 with accessible=false, it means "up" escalator
  // If the edge is defined as F9 -> F8 with accessible=false, it means "down" escalator
  
  if (edgeAccessible === false && edgeDefinedDirection) {
    // This is an escalator - check if we're going in the defined direction
    const definedFromFloor = edgeDefinedDirection.fromFloor;
    const definedToFloor = edgeDefinedDirection.toFloor;
    
    // The edge was defined as definedFromFloor -> definedToFloor
    // We can only traverse it if we're going from definedFromFloor to definedToFloor
    // (i.e., the same direction as the escalator)
    
    if (fromFloor === definedFromFloor && toFloor === definedToFloor) {
      // Going in the same direction as the escalator - allowed
      return true;
    } else {
      // Going against the escalator direction - not allowed
      return false;
    }
  }
  
  return true;
}

/**
 * Build node accessibility map from navmesh
 */
function buildNodeAccessibilityMap(navMesh: NavMesh): Map<string, boolean | undefined> {
  const map = new Map<string, boolean | undefined>();
  if ('nodes' in navMesh && navMesh.nodes) {
    for (const node of navMesh.nodes) {
      const nodeWithData = node as { id: string | number; data?: { accessible?: boolean } };
      if (nodeWithData.data?.accessible !== undefined) {
        map.set(String(node.id), nodeWithData.data.accessible);
      }
    }
  }
  return map;
}

/**
 * Build edge direction map for escalator detection
 */
function buildEdgeDirectionMap(navMesh: NavMesh): Map<string, { fromFloor: number; toFloor: number }> {
  const map = new Map<string, { fromFloor: number; toFloor: number }>();
  if ('links' in navMesh && navMesh.links) {
    for (const link of navMesh.links) {
      const key = `${link.fromId}->${link.toId}`;
      const fromFloor = getFloorFromNodeId(String(link.fromId));
      const toFloor = getFloorFromNodeId(String(link.toId));
      if (fromFloor !== null && toFloor !== null && fromFloor !== toFloor) {
        map.set(key, { fromFloor, toFloor });
      }
    }
  }
  return map;
}

/**
 * Build set of oriented edges (unidirectional)
 * Oriented edges can only be traversed in the defined direction (fromId -> toId)
 */
function buildOrientedEdgesSet(navMesh: NavMesh): Set<string> {
  const set = new Set<string>();
  if ('links' in navMesh && navMesh.links) {
    for (const link of navMesh.links) {
      const linkWithData = link as { fromId: string | number; toId: string | number; data?: { oriented?: boolean } };
      if (linkWithData.data?.oriented === true) {
        const key = `${link.fromId}->${link.toId}`;
        set.add(key);
      }
    }
  }
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
    
    // Check escalator direction (legacy support for accessible=false on nodes)
    const edgeKey = `${fromId}->${toId}`;
    const storedDirection = edgeDirection.get(edgeKey);
    
    if (storedDirection && (fromAccessible === false || toAccessible === false)) {
      const isCorrectDirection = fromFloor === storedDirection.fromFloor && toFloor === storedDirection.toFloor;
      if (!isCorrectDirection) {
        return Infinity;
      }
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

  const nodeAccessibility = buildNodeAccessibilityMap(navMesh);
  const edgeDirection = buildEdgeDirectionMap(navMesh);
  const orientedEdges = buildOrientedEdgesSet(navMesh);

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

export function generateSvgPath(path: NavMeshNode[]): string {
  if (path.length === 0) return '';

  const firstNode = path[0].data;
  if (!firstNode) return '';

  // Log all nodes in the path for debugging
  console.log('[generateSvgPath] Path nodes:', path.map((n, i) => ({
    index: i,
    id: n.id,
    x: n.data?.x,
    y: n.data?.y,
    type: (n.data as { type?: string })?.type,
    buildingId: (n.data as { buildingId?: string })?.buildingId,
    floor: (n.data as { floor?: number })?.floor,
    label: (n.data as { label?: string })?.label,
  })));

  // Transform coordinates based on building
  // Hall, VE, CC: scale 0.5, VL: no transformation needed
  const transformCoord = (node: { x: number; y: number; buildingId?: string; type?: string; label?: string }) => {
    if (node.buildingId === 'Hall' || node.buildingId === 'VE' || node.buildingId === 'CC') {
      const transformed = transformNavMeshCoordinates(node.x, node.y);
      console.log(`[transformCoord] ${node.buildingId} ${node.type} ${node.label}: (${node.x}, ${node.y}) -> (${transformed.x.toFixed(1)}, ${transformed.y.toFixed(1)})`);
      return transformed;
    }
    // For VL and others - use coordinates directly (no transformation needed)
    return { x: node.x, y: node.y };
  };

  const firstCoord = transformCoord(firstNode);
  let pathString = `M ${firstCoord.x} ${firstCoord.y}`;
  
  for (let i = 1; i < path.length; i++) {
    const nodeData = path[i].data;
    if (nodeData) {
      const coord = transformCoord(nodeData);
      pathString += ` L ${coord.x} ${coord.y}`;
    }
  }

  console.log('[generateSvgPath] Final pathString:', pathString.substring(0, 200));
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

/**
 * Get POIs from old format navmesh
 */
function getPOIsFromOldFormat(
  poiToNode: Record<string, POIInfo>,
  poiType: POIType
): (POIInfo & { label: string })[] {
  const pois: (POIInfo & { label: string })[] = [];
  
  for (const [poiLabel, poiInfo] of Object.entries(poiToNode)) {
    if (poiInfo.type === poiType) {
      pois.push({
        ...poiInfo,
        label: poiInfo.label || poiLabel,
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
  if (!navMesh) {
    return [];
  }
  
  const floorNum = Number.parseInt(floorLevel, 10);
  
  // Handle new format with poiIndex
  if ('poiIndex' in navMesh && navMesh.poiIndex) {
    return getPOIsFromNewFormat(navMesh.poiIndex, poiType, buildingId, floorNum);
  }
  
  // Handle old format with poiToNode
  if ('poiToNode' in navMesh && navMesh.poiToNode) {
    return getPOIsFromOldFormat(navMesh.poiToNode, poiType);
  }

  return [];
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
  if (!navMesh) {
    return {};
  }
  
  const floorNum = Number.parseInt(floorLevel, 10);
  
  // Handle new format with poiIndex
  if ('poiIndex' in navMesh && navMesh.poiIndex) {
    return getAllPOIsFromNewFormat(navMesh.poiIndex, buildingId, floorNum);
  }
  
  // Handle old format with poiToNode
  if ('poiToNode' in navMesh && navMesh.poiToNode) {
    return navMesh.poiToNode;
  }

  return {};
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
      if (currentNodes.length > 0) {
        segments.push({ floor: currentFloor, nodes: currentNodes });
      }
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
  
  // Transform coordinates based on building
  const transformCoord = (node: { x: number; y: number; buildingId?: string }) => {
    if (node.buildingId === 'Hall' || node.buildingId === 'VE' || node.buildingId === 'CC') {
      return transformNavMeshCoordinates(node.x, node.y);
    }
    return { x: node.x, y: node.y };
  };
  
  const firstNode = floorNodes[0].data;
  if (!firstNode) return '';
  
  const firstCoord = transformCoord(firstNode);
  let pathString = `M ${firstCoord.x} ${firstCoord.y}`;
  
  for (let i = 1; i < floorNodes.length; i++) {
    const nodeData = floorNodes[i].data;
    if (nodeData) {
      const coord = transformCoord(nodeData);
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
  if (!navMesh) {
    return null;
  }
  
  const floorNum = Number.parseInt(floorLevel, 10);
  
  // Handle new format with poiIndex
  if ('poiIndex' in navMesh && navMesh.poiIndex) {
    return findPOIInNewFormat(navMesh.poiIndex, poiLabel, buildingId, floorNum);
  }
  
  // Handle old format with poiToNode
  if ('poiToNode' in navMesh && navMesh.poiToNode) {
    const poiInfo = navMesh.poiToNode[poiLabel];
    return poiInfo?.nodeId ?? null;
  }

  return null;
}
