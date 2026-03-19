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
  
  // For Hall Building, try with "H-" prefix
  if (buildingId === 'Hall Building') {
    const labelsToTry: string[] = [];
    
    // Original with H- prefix
    labelsToTry.push(`H-${roomLabel}`);
    
    // Replace decimal with hyphen (862.5 -> H-862-5)
    labelsToTry.push(`H-${roomLabel.replace('.', '-')}`);
    
    // Handle trailing zeros: 805.10 -> H-805-1 (remove trailing zeros after decimal)
    if (roomLabel.includes('.')) {
      const [base, decimal] = roomLabel.split('.');
      const trimmedDecimal = decimal.replace(/0+$/, ''); // Remove trailing zeros
      if (trimmedDecimal) {
        labelsToTry.push(`H-${base}-${trimmedDecimal}`);
      } else {
        // If all zeros after decimal, just use base
        labelsToTry.push(`H-${base}`);
      }
    }
    
    for (const label of labelsToTry) {
      const nodeId = roomIndex[label];
      if (nodeId !== undefined) {
        console.log(`[getRoomNodeId] Found "${roomLabel}" as "${label}" -> ${nodeId}`);
        return nodeId;
      }
    }
    
    console.log(`[getRoomNodeId] Room "${roomLabel}" not found. Tried:`, labelsToTry);
    return null;
  }
  
  // For Central Building (CC), try with "CC-" prefix
  if (buildingId === 'Central Building') {
    const labelsToTry: string[] = [];
    
    // Original with CC- prefix
    labelsToTry.push(`CC-${roomLabel}`);
    
    // Replace decimal with hyphen (202.1 -> CC-202-1)
    labelsToTry.push(`CC-${roomLabel.replace('.', '-')}`);
    
    for (const label of labelsToTry) {
      const nodeId = roomIndex[label];
      if (nodeId !== undefined) {
        console.log(`[getRoomNodeId] Found "${roomLabel}" as "${label}" -> ${nodeId}`);
        return nodeId;
      }
    }
    
    console.log(`[getRoomNodeId] Room "${roomLabel}" not found. Tried:`, labelsToTry);
    return null;
  }
  
  // For Vanier Extension (VE), try with "VE-" prefix
  if (buildingId === 'Vanier Extension') {
    const labelsToTry: string[] = [];
    
    // Original with VE- prefix
    labelsToTry.push(`VE-${roomLabel}`);
    
    // Replace decimal with hyphen (202.1 -> VE-202-1)
    labelsToTry.push(`VE-${roomLabel.replace('.', '-')}`);
    
    for (const label of labelsToTry) {
      const nodeId = roomIndex[label];
      if (nodeId !== undefined) {
        console.log(`[getRoomNodeId] Found "${roomLabel}" as "${label}" -> ${nodeId}`);
        return nodeId;
      }
    }
    
    console.log(`[getRoomNodeId] Room "${roomLabel}" not found. Tried:`, labelsToTry);
    return null;
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

  // Build a map of node accessibility for quick lookup
  // The accessible field is on nodes (stair_landing, elevator_door, etc.)
  const nodeAccessibility = new Map<string, boolean | undefined>();
  if ('nodes' in navMesh && navMesh.nodes) {
    for (const node of navMesh.nodes) {
      const nodeWithData = node as { id: string | number; data?: { accessible?: boolean; type?: string } };
      if (nodeWithData.data?.accessible !== undefined) {
        nodeAccessibility.set(String(node.id), nodeWithData.data.accessible);
      }
    }
  }
  
  // Build a map of edge direction for escalator detection
  // We need to know which direction the edge was defined to determine escalator direction
  const edgeDirection = new Map<string, { fromFloor: number; toFloor: number }>();
  if ('links' in navMesh && navMesh.links) {
    for (const link of navMesh.links) {
      const key = `${link.fromId}->${link.toId}`;
      const fromFloor = getFloorFromNodeId(String(link.fromId));
      const toFloor = getFloorFromNodeId(String(link.toId));
      if (fromFloor !== null && toFloor !== null && fromFloor !== toFloor) {
        edgeDirection.set(key, { fromFloor, toFloor });
      }
    }
  }

  const pathfinder = path.aStar(graph, {
    distance: (from, to, _link) => {
      const fromId = String(from.id);
      const toId = String(to.id);
      const fromFloor = getFloorFromNodeId(fromId);
      const toFloor = getFloorFromNodeId(toId);
      
      // Check if this is a floor transition
      const isFloorTransition = fromFloor !== null && toFloor !== null && fromFloor !== toFloor;
      
      if (isFloorTransition) {
        // For floor transitions, check node accessibility
        // If either node is not accessible and we're in accessibility mode, skip
        const fromAccessible = nodeAccessibility.get(fromId);
        const toAccessible = nodeAccessibility.get(toId);
        
        if (accessibleOnly) {
          // Skip non-accessible floor transitions (escalators, regular stairs)
          if (fromAccessible === false || toAccessible === false) {
            return Infinity;
          }
        }
        
        // Check escalator direction
        // Escalators have accessible=false on the stair_landing nodes
        const edgeKey = `${fromId}->${toId}`;
        const storedDirection = edgeDirection.get(edgeKey);
        
        if (storedDirection && (fromAccessible === false || toAccessible === false)) {
          // This is an escalator - only allow traversal in the defined direction
          if (fromFloor === storedDirection.fromFloor && toFloor === storedDirection.toFloor) {
            // Going in the same direction as the escalator - allowed
          } else {
            // Going against the escalator direction - not allowed
            return Infinity;
          }
        }
      }
      
      if (from.data && to.data) {
        return Math.hypot(from.data.x - to.data.x, from.data.y - to.data.y);
      }
      return 1;
    },
    heuristic: (from, to) => {
      if (from.data && to.data) {
        // Add floor difference penalty to prefer same-floor paths when possible
        const fromFloor = getFloorFromNodeId(String(from.id));
        const toFloor = getFloorFromNodeId(String(to.id));
        const floorDiff = (fromFloor !== null && toFloor !== null) 
          ? Math.abs(fromFloor - toFloor) * 1000 
          : 0;
        return Math.hypot(from.data.x - to.data.x, from.data.y - to.data.y) + floorDiff;
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

// Coordinate transformation for Hall Building
// The navmesh uses a different coordinate system than the SVG
// Scale 0.5 and offset 0 transforms navmesh coordinates to SVG coordinates
function transformHallCoordinates(x: number, y: number, _floor: number): { x: number; y: number } {
  const scaleX = 0.5;
  const scaleY = 0.5;
  const offsetX = 0;
  const offsetY = 0;
  
  const svgX = x * scaleX + offsetX;
  const svgY = y * scaleY + offsetY;
  
  return { x: svgX, y: svgY };
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

  // Transform coordinates for Hall Building only
  // VE, CC, VL use the same coordinate system as their SVGs
  const transformCoord = (node: { x: number; y: number; floor?: number; buildingId?: string; type?: string; label?: string }) => {
    if (node.buildingId === 'Hall') {
      const transformed = transformHallCoordinates(node.x, node.y, node.floor || 8);
      console.log(`[transformCoord] ${node.type} ${node.label}: (${node.x}, ${node.y}) -> (${transformed.x.toFixed(1)}, ${transformed.y.toFixed(1)})`);
      return transformed;
    }
    // For VE, CC, VL - use coordinates directly (no transformation needed)
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

export function getPOIsByType(
  buildingId: string,
  floorLevel: string,
  poiType: POIType
): (POIInfo & { label: string })[] {
  const navMesh = getNavMeshByKey(buildingId, floorLevel);
  const floorNum = parseInt(floorLevel, 10);
  
  // Handle new format with poiIndex
  if (navMesh && 'poiIndex' in navMesh && navMesh.poiIndex) {
    const pois: (POIInfo & { label: string })[] = [];
    const poiList = navMesh.poiIndex[poiType];
    if (poiList) {
      for (const poi of poiList) {
        // Filter by floor for Hall Building
        if (buildingId === 'Hall Building' && poi.floor !== floorNum) {
          continue;
        }
        pois.push({
          nodeId: poi.nodeId,
          type: poiType,
          label: poi.label,
        });
      }
    }
    return pois;
  }
  
  // Handle old format with poiToNode
  if (navMesh && 'poiToNode' in navMesh && navMesh.poiToNode) {
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

  return [];
}

export function getAllPOIs(
  buildingId: string,
  floorLevel: string
): Record<string, POIInfo> {
  const navMesh = getNavMeshByKey(buildingId, floorLevel);
  const floorNum = parseInt(floorLevel, 10);
  
  // Handle new format with poiIndex
  if (navMesh && 'poiIndex' in navMesh && navMesh.poiIndex) {
    const result: Record<string, POIInfo> = {};
    for (const [poiType, poiList] of Object.entries(navMesh.poiIndex)) {
      for (const poi of poiList) {
        // Filter by floor for Hall Building
        if (buildingId === 'Hall Building' && poi.floor !== floorNum) {
          continue;
        }
        result[poi.label] = {
          nodeId: poi.nodeId,
          type: poiType as POIType,
          label: poi.label,
        };
      }
    }
    return result;
  }
  
  // Handle old format with poiToNode
  if (navMesh && 'poiToNode' in navMesh && navMesh.poiToNode) {
    return navMesh.poiToNode;
  }

  return {};
}

/**
 * Get the floor number from a node ID
 * Node IDs are like "Hall_F8_room_291" or "Hall_F9_stair_landing_21"
 */
export function getFloorFromNodeId(nodeId: string): number | null {
  const match = nodeId.match(/_F(\d+)_/);
  if (match) {
    return parseInt(match[1], 10);
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
  
  // Transform coordinates for Hall Building
  const transformCoord = (node: { x: number; y: number; floor?: number; buildingId?: string }) => {
    if (node.buildingId === 'Hall') {
      return transformHallCoordinates(node.x, node.y, node.floor || targetFloor);
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

export function getPOINodeId(
  buildingId: string,
  floorLevel: string,
  poiLabel: string
): string | null {
  const navMesh = getNavMeshByKey(buildingId, floorLevel);
  const floorNum = parseInt(floorLevel, 10);
  
  // Handle new format with poiIndex
  if (navMesh && 'poiIndex' in navMesh && navMesh.poiIndex) {
    for (const [, poiList] of Object.entries(navMesh.poiIndex)) {
      for (const poi of poiList) {
        // Filter by floor for Hall Building
        if (buildingId === 'Hall Building' && poi.floor !== floorNum) {
          continue;
        }
        if (poi.label === poiLabel) {
          return poi.nodeId;
        }
      }
    }
    return null;
  }
  
  // Handle old format with poiToNode
  if (navMesh && 'poiToNode' in navMesh && navMesh.poiToNode) {
    const poiInfo = navMesh.poiToNode[poiLabel];
    if (!poiInfo) {
      return null;
    }
    return poiInfo.nodeId;
  }

  return null;
}
