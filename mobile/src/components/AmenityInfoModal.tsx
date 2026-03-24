import React from 'react';
import {
    View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AmenityElement, getAmenityIconName } from '../hooks/useAmenities';

type Props = Readonly<{
    visible: boolean;
    amenity: AmenityElement | null;
    onClose: () => void;
}>;

const { width: screenWidth } = Dimensions.get('window');

export default function AmenityInfoModal({ visible, amenity, onClose }: Props) {
    if (!visible || !amenity) return null;
    
    const iconName = getAmenityIconName(amenity.amenityKind);
    
    return (
        <Modal 
            visible={visible} 
            transparent 
            animationType="fade"
            onRequestClose={onClose}
            testID="amenity-info-modal"
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header with close button */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{amenity.label}</Text>
                        <TouchableOpacity 
                            onPress={onClose}
                            activeOpacity={0.8}
                            testID="amenity-close-btn"
                        >
                            <MaterialCommunityIcons name="close" size={24} color="#912338" />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Amenity Icon */}
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons 
                            name={iconName as any}
                            size={64} 
                            color="#912338"
                            testID={`amenity-icon-${amenity.id}`}
                        />
                    </View>
                    
                    {/* Description */}
                    <Text style={styles.description}>{amenity.description}</Text>
                    
                    {/* Position Info (for debugging/reference) */}
                    <View style={styles.locationInfo}>
                        <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
                        <Text style={styles.locationText}>
                            Location: ({Math.round(amenity.x)}, {Math.round(amenity.y)})
                        </Text>
                    </View>
                    
                    {/* Close Button */}
                    <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={onClose}
                        activeOpacity={0.8}
                        testID="amenity-close-button"
                    >
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        width: Math.min(screenWidth - 40, 400),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    iconContainer: {
        marginVertical: 20,
        padding: 16,
        backgroundColor: '#f5e6eb',
        borderRadius: 50,
        width: 96,
        height: 96,
        justifyContent: 'center',
        alignItems: 'center',
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 22,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        marginBottom: 20,
    },
    locationText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 8,
    },
    closeButton: {
        width: '100%',
        paddingVertical: 12,
        backgroundColor: '#912338',
        borderRadius: 8,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
