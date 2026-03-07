import type { Coordinate, Building } from "../types/building";
import { buildings } from "../data/buildings";

interface Point {
    latitude: number;
    longitude: number;
}

const LABEL_ZOOM_THRESHOLD = 0.008;
// Small/annex buildings need extra zoom before their labels appear to avoid overlap
const SMALL_BUILDING_ZOOM_THRESHOLD = 0.004;
// Buildings whose bounding-box span (in degrees) is below this are considered "small"
const SMALL_BUILDING_SIZE_THRESHOLD = 0.0005;

// Extract point-in-polygon check to a separate function
export const isPointInPolygon = (point: Point, polygon: Coordinate[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].latitude;
        const yi = polygon[i].longitude;
        const xj = polygon[j].latitude;
        const yj = polygon[j].longitude;

        const intersect = ((yi > point.longitude) !== (yj > point.longitude))
            && (point.latitude < (xj - xi) * (point.longitude - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }
    return inside;
};

// Extract building detection logic
export const findBuildingAtLocation = (latitude: number, longitude: number): Building | undefined => {
    return buildings.find(building =>
        isPointInPolygon({ latitude, longitude }, building.coordinates)
    );
};

export const getBuildingMaxSpan = (coordinates: Coordinate[]): number => {
    const lats = coordinates.map(c => c.latitude);
    const lons = coordinates.map(c => c.longitude);
    const latSpan = Math.max(...lats) - Math.min(...lats);
    const lonSpan = Math.max(...lons) - Math.min(...lons);
    return Math.max(latSpan, lonSpan);
};

export const getBuildingPolygonColors = (
    buildingId: string,
    selectedBuildingId: string | null,
    currentBuildingId: string | null,
    startBuildingId: string | null,
    destinationBuildingId: string | null
): { strokeColor: string; fillColor: string } => {
    const isUserInside = currentBuildingId === buildingId;
    const isSelected = selectedBuildingId === buildingId;
    const isStart = startBuildingId === buildingId;
    const isDestination = destinationBuildingId === buildingId;

    if (isStart) {
        return { strokeColor: "#34A853", fillColor: "rgba(52, 168, 83, 0.4)" };
    };

    if (isDestination) {
        return { strokeColor: "#EA4335", fillColor: "rgba(234, 67, 53, 0.4)" };
    };

    if (isSelected) {
        return { strokeColor: "#FBBC05", fillColor: "rgba(251, 188, 5, 0.4)" };
    };

    if (isUserInside) {
        return { strokeColor: "#0000FF", fillColor: "rgba(0, 0, 255, 0.4)" };
    };

    return { strokeColor: "#FF0000", fillColor: "rgba(255, 0, 0, 0.4)" };
};

export const showBuildingLabel =  (currentDelta: number, coordinates: Coordinate[]): boolean => {
    const isSmallBuilding = getBuildingMaxSpan(coordinates) < SMALL_BUILDING_SIZE_THRESHOLD;
    const labelThreshold = isSmallBuilding ? SMALL_BUILDING_ZOOM_THRESHOLD : LABEL_ZOOM_THRESHOLD;
    return currentDelta <= labelThreshold;
}