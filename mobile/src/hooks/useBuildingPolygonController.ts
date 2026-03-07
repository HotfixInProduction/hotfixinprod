import { useEffect, useState } from "react";
import * as Location from 'expo-location';
import { findBuildingAtLocation } from "../models/BuildingPolygonModel";

export function useBuildingPolygonController() {
    const [currentBuildingId, setCurrentBuildingId] = useState<string | null>(null);

    useEffect(() => {
        let locationSubscription: Location.LocationSubscription | null = null;
        let isMounted = true;

        // Extract location handler
        const handleLocationUpdate = (
            location: Location.LocationObject,
            setCurrentBuildingId: React.Dispatch<React.SetStateAction<string | null>>
        ): void => {
            const { latitude, longitude } = location.coords;

            const buildingFound = findBuildingAtLocation(latitude, longitude);
            setCurrentBuildingId(buildingFound ? buildingFound.id : null);
        };

        const startWatching = async () => {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted' && isMounted) {
                const subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.BestForNavigation,
                        distanceInterval: 0, // Update immediately on any move
                    },
                    (location) => {
                        if (isMounted) {
                            handleLocationUpdate(location, setCurrentBuildingId);
                        }
                    }
                );
                if (isMounted) {
                    locationSubscription = subscription;
                } else {
                    subscription.remove();
                }
            }
        };

        startWatching();

        return () => {
            isMounted = false;
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, []);

    return { currentBuildingId };
}