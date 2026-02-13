import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ConfirmButton from './confirmButton';

interface RouteInfoProps {
    duration: number; // in minutes
    distance: number; // in km
    onStart: () => void;
    onClose: () => void;
}

const RouteInfo = ({ duration, distance, onStart, onClose }: RouteInfoProps) => {

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
                    <MaterialIcons name="directions-car" size={20} color="#912338" />
                    <Text style={styles.headerText}>Drive</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <MaterialIcons name="close" size={18} color="#912338" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <View style={styles.timeRow}>
                        <Text style={styles.durationText}>{Math.round(duration)} min </Text>
                        <Text style={styles.arrivalText}>• Arrive at {getArrivalTime()}</Text>
                    </View>
                    <Text style={styles.distanceText}>{distance.toFixed(1)} km</Text>
                </View>
                <ConfirmButton onPress={onStart} title="Start" />
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
});

export default RouteInfo;