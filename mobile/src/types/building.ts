export interface Coordinate {
    latitude: number;
    longitude: number;
}

export type FloorPlanMap = {
    [key: string]: string | undefined;
}

export interface Building {
    id: string;
    label: string;
    coordinates: Coordinate[];
    labelCoord: Coordinate;
    address: string;
    departments?: string[];
    services?: string[];
    isAccessible?: boolean;
    hasParking?: boolean;
    hasBikeRacks?: boolean;
    floorPlans?: FloorPlanMap;
}