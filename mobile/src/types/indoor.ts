export interface Coordinate {
  latitude: number;
  longitude: number;
}

export type FloorPlanMap = {
  [key: string]: string | undefined;
};

export interface Building {
  id: string;
  label?: string;
  address?: string;
  coordinates?: Coordinate[];
  labelCoord?: Coordinate;
  departments?: string[];
  services?: string[];
  isAccessible?: boolean;
  hasParking?: boolean;
  hasBikeRacks?: boolean;
  floorPlans?: FloorPlanMap;
}

export interface NavMeshNode {
  id: string | number;
  data?: { x: number; y: number };
}
