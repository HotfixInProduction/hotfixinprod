import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ConfirmButton from './confirmButton';
import type { TravelMode } from '../types/map';

interface RouteInfoProps {
    duration: number; // in minutes
    distance: number; // in km
    mode: TravelMode;
    onModeChange: (mode: TravelMode) => void;
    onStart: () => void;
    onClose: () => void;
    allowShuttleMode?: boolean;
    shuttleInfo?: {
        nextDepartureInMinutes: number;
        nextDepartureTimeLabel: string;
        intervalMinutes: number;
    } | null;
    onOpenShuttleSchedule?: () => void;
}

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const MODE_METADATA: Record<TravelMode, { label: string; icon: MaterialIconName }> = {
    DRIVING: { label: 'Drive', icon: 'directions-car' },
    WALKING: { label: 'Walk', icon: 'directions-walk' },
    BICYCLING: { label: 'Bike', icon: 'directions-bike' },
    TRANSIT: { label: 'Transit', icon: 'directions-transit' },
    SHUTTLE: { label: 'Shuttle', icon: 'airport-shuttle' },
};

const RouteInfo = ({
    duration,
    distance,
    mode,
    onModeChange,
    onStart,
    onClose,
    allowShuttleMode = false,
    shuttleInfo = null,
    onOpenShuttleSchedule,
}: RouteInfoProps) => {
    const modeMetadata = MODE_METADATA[mode];
    const modeOptions: TravelMode[] = allowShuttleMode
        ? ['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT', 'SHUTTLE']
        : ['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'];

    // Calculate Arrival Time
    const getArrivalTime = () => {
        const now = new Date();
        const arrival = new Date(now.getTime() + duration * 60000); // add minutes in milliseconds
        return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.modeContainer}>
                    <MaterialIcons name={modeMetadata.icon} size={20} color="#912338" />
                    <Text style={styles.headerText}>{modeMetadata.label}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <MaterialIcons name="close" size={18} color="#912338" />
                </TouchableOpacity>
            </View>

            <View style={styles.modeSelector}>
                {modeOptions.map((modeOption) => {
                    const metadata = MODE_METADATA[modeOption];
                    const isActive = modeOption === mode;
                    return (
                        <TouchableOpacity
                            key={modeOption}
                            style={[styles.modeButton, isActive && styles.modeButtonActive]}
                            onPress={() => onModeChange(modeOption)}
                            testID={`route-info-mode-${modeOption.toLowerCase()}`}
                        >
                            <MaterialIcons
                                name={metadata.icon}
                                size={16}
                                color={isActive ? '#fff' : '#912338'}
                            />
                            <Text style={[styles.modeButtonText, isActive && styles.modeButtonTextActive]}>
                                {metadata.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <View style={styles.timeRow}>
                        <Text style={styles.durationText}>{Math.round(duration)} min </Text>
                        <Text style={styles.arrivalText}>• Arrive at {getArrivalTime()}</Text>
                    </View>
                    <Text style={styles.distanceText}>{distance.toFixed(1)} km</Text>
                    {mode === 'SHUTTLE' && shuttleInfo && (
                        <>
                            <Text style={styles.shuttleDetailText}>
                                Next shuttle in {shuttleInfo.nextDepartureInMinutes} min
                            </Text>
                            <Text style={styles.shuttleDetailSubtext}>
                                Departs at {shuttleInfo.nextDepartureTimeLabel} • every {shuttleInfo.intervalMinutes} min
                            </Text>
                        </>
                    )}
                </View>
                {mode === 'SHUTTLE' ? (
                    <TouchableOpacity
                        style={styles.scheduleButton}
                        onPress={onOpenShuttleSchedule}
                        testID="route-info-open-shuttle-schedule"
                    >
                        <Text style={styles.scheduleButtonText}>Schedule</Text>
                    </TouchableOpacity>
                ) : (
                    <ConfirmButton onPress={onStart} title="Start" />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
        paddingBottom: 8,
    },
    modeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    headerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#912338',
    },
    closeButton: {
        padding: 4,
        backgroundColor: '#F1F3F4',
        borderRadius: 16,
    },
    modeSelector: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        columnGap: 6,
        rowGap: 8,
        marginBottom: 12,
    },
    modeButton: {
        flexGrow: 1,
        flexBasis: '30%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 3,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f0d9de',
        backgroundColor: '#fff',
    },
    modeButtonActive: {
        backgroundColor: '#912338',
        borderColor: '#912338',
    },
    modeButtonText: {
        fontSize: 12,
        color: '#912338',
        fontWeight: '600',
    },
    modeButtonTextActive: {
        color: '#fff',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    durationText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1f1f1f',
    },
    arrivalText: {
        fontSize: 18,
        color: '#666',
        fontWeight: '500',
    },
    distanceText: {
        fontSize: 14,
        color: '#912338',
        fontWeight: '500',
        marginTop: 2,
    },
    shuttleDetailText: {
        marginTop: 6,
        color: '#912338',
        fontSize: 14,
        fontWeight: '700',
    },
    shuttleDetailSubtext: {
        marginTop: 2,
        color: '#4f4f4f',
        fontSize: 12,
        fontWeight: '500',
    },
    scheduleButton: {
        backgroundColor: '#912338',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    scheduleButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});

export default RouteInfo;
