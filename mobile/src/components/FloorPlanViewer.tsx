import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Dimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type FloorPlanMap = {
    [key: string]: string;
};

type Building = {
    id: string;
    address?: string;
    floorPlans?: FloorPlanMap;
};

type Props = Readonly<{
    building: Building | null;
    floorLevel?: string;
    onClose: () => void;
}>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function FloorPlanViewer({ building, floorLevel = '8', onClose }: Props) {
    const svgContent = building?.floorPlans?.[floorLevel];
    if (!svgContent) return null;

    return (
        <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <Text style={styles.title}>{building.id} - Floor {floorLevel}</Text>
                            <Text style={styles.subtitle}>{building.address}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            activeOpacity={0.7}
                            testID="floor-plan-close"
                        >
                            <MaterialCommunityIcons name="close" size={24} color="#912338" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={true}
                        showsHorizontalScrollIndicator={true}
                    >
                        <View style={styles.svgContainer}>
                            <SvgXml
                                xml={svgContent}
                                width={screenWidth - 40}
                                height={screenWidth - 40}
                                onError={(e) => console.log("SVG Error: ", e)}
                            />
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        maxHeight: screenHeight * 0.85,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f1f1f',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    closeButton: {
        backgroundColor: '#F1F3F4',
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    scrollView: {
        flex: 0,
    },
    scrollContent: {
        padding: 20,
        alignItems: 'center',
    },
    svgContainer: {
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        padding: 0,
        minHeight: 300,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
});
