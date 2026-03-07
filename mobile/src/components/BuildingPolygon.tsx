import React from 'react';
import { Polygon, Marker } from 'react-native-maps';
import { buildings } from '../data/buildings';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import type { Building } from '../types/building';
import { getBuildingPolygonColors, showBuildingLabel } from '../models/BuildingPolygonModel';
import { useBuildingPolygonController } from '../hooks/useBuildingPolygonController';

interface BuildingPolygonProps {
    readonly onSelectBuilding: (building: Building) => void;
    readonly selectedBuildingId: string | null;
    readonly currentDelta: number;
    readonly startBuildingId?: string | null;
    readonly destinationBuildingId?: string | null;
}

export default function BuildingPolygon({ onSelectBuilding, selectedBuildingId, currentDelta, startBuildingId, destinationBuildingId }: BuildingPolygonProps) {
    const { currentBuildingId } = useBuildingPolygonController();

    return (
        <>
            {buildings.map(b => {
                const isUserInside = currentBuildingId === b.id;

                const { strokeColor, fillColor } = getBuildingPolygonColors(
                    b.id,
                    selectedBuildingId,
                    currentBuildingId,
                    startBuildingId ?? null,
                    destinationBuildingId ?? null
                );

                const showLabel = showBuildingLabel(currentDelta, b.coordinates);

                return (
                    <React.Fragment key={b.id}>
                        <Polygon
                            testID={`building-polygon-${b.id}-visual`}
                            coordinates={b.coordinates}
                            strokeColor={strokeColor}
                            fillColor={fillColor}
                            strokeWidth={2}
                            onPress={() => onSelectBuilding(b)}
                            tappable
                        />
                        <Marker
                            coordinate={b.labelCoord}
                            opacity={0.01}
                            onPress={() => onSelectBuilding(b)}
                            testID={`building-polygon-${b.id}-polygon`}
                        >
                            <View style={{ width: 60, height: 60, backgroundColor: 'rgba(0,0,0,0.01)' }} />
                        </Marker>
                        {isUserInside && (
                            <Marker
                                coordinate={b.labelCoord}
                                opacity={0.0}
                                pointerEvents='none'
                                testID={`building-polygon-${b.id}-highlighted`}
                            />
                        )}
                        {showLabel && (
                            <Marker
                                coordinate={b.labelCoord}
                                pointerEvents='auto'
                                onPress={() => onSelectBuilding(b)}
                                anchor={{ x: 0.5, y: 1 }}
                                testID={"building-marker-" + b.id}
                            >
                                <View
                                    style={styles.labelContainer}
                                    testID={"building-marker-content-" + b.id}
                                >
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