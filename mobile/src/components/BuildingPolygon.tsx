import React, { useState, useEffect } from 'react';
import { Polygon, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { buildings } from '../data/buildings';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

// Define types
interface Coordinate {
    latitude: number;
    longitude: number;
}

interface Building {
    id: string;
    label: string;
    coordinates: Coordinate[];
    labelCoord: Coordinate;
    // Add other building properties if needed
}

interface BuildingPolygonProps {
    readonly onSelectBuilding: (building: Building) => void;
    readonly selectedBuildingId: string | null;
    readonly currentDelta: number;
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

const LABEL_ZOOM_THRESHOLD = 0.008;
// Small/annex buildings need extra zoom before their labels appear to avoid overlap
const SMALL_BUILDING_ZOOM_THRESHOLD = 0.004;
// Buildings whose bounding-box span (in degrees) is below this are considered "small"
const SMALL_BUILDING_SIZE_THRESHOLD = 0.0005;

const getBuildingMaxSpan = (coordinates: Coordinate[]): number => {
    const lats = coordinates.map(c => c.latitude);
    const lons = coordinates.map(c => c.longitude);
    const latSpan = Math.max(...lats) - Math.min(...lats);
    const lonSpan = Math.max(...lons) - Math.min(...lons);
    return Math.max(latSpan, lonSpan);
};

export default function BuildingPolygon({ onSelectBuilding, selectedBuildingId, currentDelta }: BuildingPolygonProps) {
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
            {buildings.map(b => {
                const isUserInside = currentBuildingId === b.id;
                const isSelected = selectedBuildingId === b.id;

                let strokeColor = "#FF0000";
                if (isSelected) {
                    strokeColor = "#FBBC05";
                } else if (isUserInside) {
                    strokeColor = "#0000FF";
                }

                let fillColor = "rgba(255, 0, 0, 0.4)";
                if (isSelected) {
                    fillColor = "rgba(251, 188, 5, 0.4)";
                } else if (isUserInside) {
                    fillColor = "rgba(0, 0, 255, 0.4)";
                }

                const isSmallBuilding = getBuildingMaxSpan(b.coordinates) < SMALL_BUILDING_SIZE_THRESHOLD;
                const labelThreshold = isSmallBuilding ? SMALL_BUILDING_ZOOM_THRESHOLD : LABEL_ZOOM_THRESHOLD;
                const showLabel = currentDelta <= labelThreshold;

                return (
                    <React.Fragment key={b.id}>
                        <Polygon
                            coordinates={b.coordinates}
                            strokeColor={strokeColor}
                            fillColor={fillColor}
                            strokeWidth={2}
                            onPress={() => onSelectBuilding(b)}
                            tappable
                        />
                        {showLabel && (
                            <Marker
                                coordinate={b.labelCoord}
                                pointerEvents='none'
                                anchor={{ x: 0.5, y: 1 }}
                            >
                                <View style={styles.labelContainer}>
                                    <FontAwesome6
                                        name="location-pin"
                                        size={32}
                                        color="#ffffff"
                                        style={styles.icon}
                                    />
                                    <View style={styles.textOverlay}>
                                        <Text style={styles.labelText}>
                                            {b.label}
                                        </Text>
                                    </View>
                                </View>
                            </Marker>
                        )}
                    </React.Fragment>
                )
            })}
        </>
    );
}

const styles = StyleSheet.create({
    labelContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
    },
    icon: {
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    labelText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#912338',
        textAlign: 'center',
    },
    textOverlay: {
        position: 'absolute',
        top: 8,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
    }
});