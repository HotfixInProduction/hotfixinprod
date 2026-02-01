import React, { useState, useEffect } from 'react';
import { Polygon } from 'react-native-maps';
import * as Location from 'expo-location';
import { buildings } from '../data/buildings';

function isPointInPolygon(point, polygon) {
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
}

export default function BuildingPolygon(){
    const [userLocation, setUserLocation] = useState(null);
    const [currentBuildingId, setCurrentBuildingId] = useState(null);

    useEffect(() => {
        let locationSubscription;

        const startWatchingLocation = async () => {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') {
                return;
            }

            locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 5, 
                },
                (location) => {
                    const { latitude, longitude } = location.coords;
                    setUserLocation({ latitude, longitude });

                    const buildingFound = buildings.find(building => 
                        isPointInPolygon({ latitude, longitude }, building.coordinates)
                    );
                    
                    setCurrentBuildingId(buildingFound ? buildingFound.id : null);
                }
            );
        };

        startWatchingLocation();

        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, []);

    return (
        <>
        {buildings.map(b => {
            const isCurrentBuilding = b.id === currentBuildingId;
            return (
                <Polygon
                    key={b.id}
                    coordinates={b.coordinates}
                    strokeColor={isCurrentBuilding ? "#0000FF" : "#FF0000"}
                    fillColor={isCurrentBuilding ? "rgba(0,0,255,0.4)" : "rgba(255,0,0,0.4)"}
                    strokeWidth={2}
                />
            );
        })}
        </>
    )
}