import React, { useState, useEffect } from 'react';
import { Polygon } from 'react-native-maps';
import * as Location from 'expo-location';
import { buildings } from '../data/buildings';

// Extract point-in-polygon check to a separate function
const isPointInPolygon = (point, polygon) => {
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
const findBuildingAtLocation = (latitude, longitude) => {
    return buildings.find(building => 
        isPointInPolygon({ latitude, longitude }, building.coordinates)
    );
};

// Extract location handler
const handleLocationUpdate = (location, setUserLocation, setCurrentBuildingId) => {
    const { latitude, longitude } = location.coords;
    setUserLocation({ latitude, longitude });

    const buildingFound = findBuildingAtLocation(latitude, longitude);
    setCurrentBuildingId(buildingFound ? buildingFound.id : null);
};

// Extract permission check and subscription setup
const setupLocationWatching = async (setUserLocation, setCurrentBuildingId) => {
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status !== 'granted') {
        return null;
    }

    const subscription = await Location.watchPositionAsync(
        {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
        },
        (location) => handleLocationUpdate(location, setUserLocation, setCurrentBuildingId)
    );

    return subscription;
};

export default function BuildingPolygon({ onSelectBuilding }) {
    const [userLocation, setUserLocation] = useState(null);
    const [currentBuildingId, setCurrentBuildingId] = useState(null);

    useEffect(() => {
        let locationSubscription;

        setupLocationWatching(setUserLocation, setCurrentBuildingId)
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
            {buildings.map(b => (
                <Polygon
                    key={b.id}
                    coordinates={b.coordinates}
                    strokeColor={currentBuildingId === b.id ? "#0000FF" : "#FF0000"}
                    fillColor={currentBuildingId === b.id ? "rgba(0,0,255,0.4)" : "rgba(255,0,0,0.4)"}
                    strokeWidth={2}
                    onPress={() => onSelectBuilding(b)}
                    tappable
                />
            ))}
        </>
    );
}