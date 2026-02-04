import React, { useState, useEffect } from 'react';
import { Polygon } from 'react-native-maps';
import * as Location from 'expo-location';
import { buildings } from '../data/buildings';

// Define types
interface Coordinate {
    latitude: number;
    longitude: number;
}

interface Building {
    id: string;
    coordinates: Coordinate[];
    // Add other building properties if needed
}

interface BuildingPolygonProps {
    readonly onSelectBuilding: (building: Building) => void;
    readonly selectedBuildingId: string | null;
}

interface Point {
    latitude: number;
    longitude: number;
}

// Extract point-in-polygon check to a separate function
const isPointInPolygon = (point: Point, polygon: Coordinate[]): boolean => {
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
const findBuildingAtLocation = (latitude: number, longitude: number): Building | undefined => {
    return buildings.find(building => 
        isPointInPolygon({ latitude, longitude }, building.coordinates)
    );
};

// Extract location handler
const handleLocationUpdate = (
    location: Location.LocationObject,
    setCurrentBuildingId: React.Dispatch<React.SetStateAction<string | null>>
): void => {
    const { latitude, longitude } = location.coords;

    const buildingFound = findBuildingAtLocation(latitude, longitude);
    setCurrentBuildingId(buildingFound ? buildingFound.id : null);
};

// Extract permission check and subscription setup
const setupLocationWatching = async (
    setCurrentBuildingId: React.Dispatch<React.SetStateAction<string | null>>
): Promise<Location.LocationSubscription | null> => {
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status !== 'granted') {
        return null;
    }

    const subscription = await Location.watchPositionAsync(
        {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
        },
        (location) => handleLocationUpdate(location, setCurrentBuildingId)
    );

    return subscription;
};

export default function BuildingPolygon({ onSelectBuilding, selectedBuildingId }: BuildingPolygonProps) {
    const [currentBuildingId, setCurrentBuildingId] = useState<string | null>(null);

    useEffect(() => {
        let locationSubscription: Location.LocationSubscription | null;

        setupLocationWatching(setCurrentBuildingId)
            .then(subscription => {
                locationSubscription = subscription;
            });

        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, []);

    return (
        <>
            {buildings.map(b =>  {
                const isUserInside = currentBuildingId === b.id;
                const isSelected = selectedBuildingId === b.id;
                return(
                <Polygon
                    key={b.id}
                    coordinates={b.coordinates}
                    strokeColor={isSelected ? "#FBBC05" : isUserInside ? "#0000FF" : "#FF0000"}
                    fillColor={isSelected ? "rgb(251, 188, 5, 0.4)" : isUserInside ? "rgba(0,0,255,0.4)" : "rgba(255,0,0,0.4)"}
                    strokeWidth={2}
                    onPress={() => onSelectBuilding(b)}
                    tappable
                />
            )})}
        </>
    );
}