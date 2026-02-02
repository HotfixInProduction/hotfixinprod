import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

type Building = {
    id: string;
    address: string;
    departments?: string[];
    services?: string[];
    isAccessible?: boolean;
    hasParking?: boolean;
    hasBikeRacks?: boolean;
};

type Props = {
    building: Building | null;
    onClose: () => void;
};

export default function BuildingInfo({ building, onClose }: Props) {
    if (!building) return null;

    const hasDepartments = (building.departments?.length ?? 0) > 0;
    const hasServices = (building.services?.length ?? 0) > 0;

    return (
        <View style={styles.buildingModal}>

            <View style={styles.modalHeader}>
                <Text testID="building-title" style={styles.buildingTitle}>{building.id}</Text>

                <View style={styles.row}>
                    <MaterialIcons name="location-on" size={18} color="#912338"></MaterialIcons>
                    <Text style={styles.buildingAddress}>{building.address}</Text>

                    {(building.isAccessible || building.hasParking || building.hasBikeRacks) && (
                        <View style={styles.iconRow}>
                            {building.isAccessible && (
                                <MaterialCommunityIcons testID="icon-wheelchair" name="wheelchair" size={18} color="#912338" style={{ marginRight: 8 }} />
                            )}
                            {building.hasParking && (
                                <MaterialCommunityIcons testID="icon-parking" name="parking" size={18} color="#912338" style={{ marginRight: 8 }} />
                            )}
                            {building.hasBikeRacks && (
                                <MaterialCommunityIcons testID="icon-bike" name="bike" size={18} color="#912338" style={{ marginRight: 8 }} />
                            )}
                        </View>
                    )}
                </View>
            </View>

            <TouchableOpacity style={styles.closeButton} testID="building-close" onPress={onClose} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={18} color="#912338"></MaterialCommunityIcons>
            </TouchableOpacity>

            {(hasDepartments || hasServices) && (
                <View style={styles.columnWrapper}>
                    {hasDepartments && (
                        <View testID="departments-column" style={styles.column}>
                            <Text style={styles.columnHeader}>Departments</Text>
                            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator>
                                {building.departments!.map((dept, i) => (
                                    <Text key={i} style={styles.itemText}>
                                        {dept}
                                    </Text>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {hasServices && (
                        <View style={styles.column}>
                            <Text testID="services-column" style={styles.columnHeader}>Services</Text>
                            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator>
                                {building.services!.map((service, i) => (
                                    <Text key={i} style={styles.itemText}>
                                        {service}
                                    </Text>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    buildingModal: {
        position: 'absolute',
        bottom: 20,
        left: 10,
        right: 10,
        backgroundColor: '#fff',
        padding: 20,
       
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
        borderRadius: 25
    },
    buildingTitle: {
        fontSize: 18,
        fontWeight: '500',
        flexShrink: 1,
    },
    buildingAddress: {
        fontSize: 14,
        color: '#666'
    },
    modalHeader: {
        marginBottom: 10,
        paddingRight: 40,
        paddingHorizontal: 4,
    },
    closeButton: {
        position: 'absolute',
        right: 16,
        top: 10,
        backgroundColor: '#F1F3F4',
        borderRadius: 16,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    columnWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        maxHeight: 160,
        gap: 12,
    },
    column: {
        flex: 1,
        paddingHorizontal: 4,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 8,
        paddingLeft: 10
    },
    columnHeader: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        paddingBottom: 4,
    },
    itemText: {
        fontSize: 13,
        color: '#444',
        paddingVertical: 3,
        lineHeight: 18,
        paddingRight: 6
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        marginLeft: -4
    }
});