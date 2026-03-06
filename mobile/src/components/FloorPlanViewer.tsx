import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Modal,
    ScrollView, Dimensions,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFloorPlanState } from '../hooks/useFloorPlanState';
import { useRoomList } from '../hooks/useRoomList';
import { useIndoorPath, useSvgPathString } from '../hooks/useIndoorPath';
import { useProcessedSvg } from '../hooks/useProcessedSvg';
import RoomPickerModal from './RoomPickerModal';
import { Building } from '../types/indoor';

type Props = Readonly<{
    building: Building | null;
    floorLevel?: string;
    onClose: () => void;
    pathStartNode?: number;
    pathEndNode?: number;
    startRoom?: string;
    nextRoom?: string;
}>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function FloorPlanViewer({
    building,
    floorLevel,
    onClose,
    pathStartNode = 13,
    pathEndNode = 10,
    startRoom: startRoomProp = '829',
    nextRoom: nextRoomProp = '862',
}: Props) {
    const {
        currentFloor,
        startRoom,
        nextRoom,
        roomPickerOpen,
        availableFloors,
        buildingPrefix,
        rawSvgContent,
        setCurrentFloor,
        setStartRoom,
        setNextRoom,
        setRoomPickerOpen,
    } = useFloorPlanState(building, startRoomProp, nextRoomProp, floorLevel);

    const roomList = useRoomList(rawSvgContent);

    const path = useIndoorPath(building?.id, currentFloor, pathStartNode, pathEndNode);

    const pathString = useSvgPathString(path);

    const svgWithPaths = useProcessedSvg(rawSvgContent, path, pathString, startRoom, nextRoom);

    if (!building || !rawSvgContent || !svgWithPaths) return null;

    return (
        <>
            <Modal visible={true} transparent animationType="fade" onRequestClose={onClose}>
                <View style={styles.overlay}>
                    <View style={styles.container}>

                        {/* ── Header ── */}
                        <View style={styles.header}>
                            <View style={styles.headerContent}>
                                <Text style={styles.title}>
                                    {building.id} - Floor {currentFloor}
                                </Text>
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

                        {/* ── Floor selector ── */}
                        {availableFloors.length > 1 && (
                            <View style={styles.floorSelectorRow}>
                                <Text style={styles.selectorLabel}>Floor</Text>
                                <View style={styles.floorButtons}>
                                    {availableFloors.map((floor) => (
                                        <TouchableOpacity
                                            key={floor}
                                            style={[
                                                styles.floorBtn,
                                                currentFloor === floor && styles.floorBtnActive,
                                            ]}
                                            onPress={() => setCurrentFloor(floor)}
                                            activeOpacity={0.75}
                                            testID={`floor-btn-${floor}`}
                                        >
                                            <Text
                                                style={[
                                                    styles.floorBtnText,
                                                    currentFloor === floor && styles.floorBtnTextActive,
                                                ]}
                                            >
                                                {floor}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* ── Room selectors ── */}
                        <View style={styles.roomSelectorRow}>
                            <TouchableOpacity
                                style={[styles.roomBtn, styles.roomBtnStart]}
                                onPress={() => setRoomPickerOpen('start')}
                                activeOpacity={0.8}
                                testID="room-picker-start"
                            >
                                <View style={[styles.roomBtnDot, { backgroundColor: '#4CAF50' }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.roomBtnHint}>FROM</Text>
                                    <Text style={styles.roomBtnValue} numberOfLines={1}>
                                        {startRoom ? `${buildingPrefix}${startRoom}` : 'Select room'}
                                    </Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-down" size={18} color="#555" />
                            </TouchableOpacity>

                            <View style={styles.arrowDivider}>
                                <MaterialCommunityIcons name="arrow-right" size={16} color="#AAA" />
                            </View>

                            <TouchableOpacity
                                style={[styles.roomBtn, styles.roomBtnEnd]}
                                onPress={() => setRoomPickerOpen('end')}
                                activeOpacity={0.8}
                                testID="room-picker-end"
                            >
                                <View style={[styles.roomBtnDot, { backgroundColor: '#2196F3' }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.roomBtnHint}>TO</Text>
                                    <Text style={styles.roomBtnValue} numberOfLines={1}>
                                        {nextRoom ? `${buildingPrefix}${nextRoom}` : 'Select room'}
                                    </Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-down" size={18} color="#555" />
                            </TouchableOpacity>
                        </View>

                        {/* ── SVG floor plan ── */}
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={true}
                            showsHorizontalScrollIndicator={true}
                        >
                            <View style={styles.svgContainer}>
                                <SvgXml
                                    xml={svgWithPaths}
                                    width={screenWidth - 40}
                                    height={screenWidth - 40}
                                    onError={(e) => console.log('SVG Error: ', e)}
                                />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Start-room picker */}
            <RoomPickerModal
                visible={roomPickerOpen === 'start'}
                title="Select start room"
                rooms={roomList}
                prefix={buildingPrefix}
                selectedRoom={startRoom}
                onSelect={(svgLabel) => setStartRoom(svgLabel)}
                onClose={() => setRoomPickerOpen(null)}
            />

            {/* Destination-room picker */}
            <RoomPickerModal
                visible={roomPickerOpen === 'end'}
                title="Select destination room"
                rooms={roomList}
                prefix={buildingPrefix}
                selectedRoom={nextRoom}
                onSelect={(svgLabel) => setNextRoom(svgLabel)}
                onClose={() => setRoomPickerOpen(null)}
            />
        </>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
    },
    container: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        maxHeight: screenHeight * 0.92,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 36,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerContent: { flex: 1 },
    title: {
        fontSize: 19,
        fontWeight: '700',
        color: '#1f1f1f',
        marginBottom: 2,
    },
    subtitle: { fontSize: 13, color: '#666' },
    closeButton: {
        backgroundColor: '#F1F3F4',
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },

    // Floor selector
    floorSelectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        gap: 10,
    },
    selectorLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600',
    },
    floorButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    floorBtn: {
        paddingHorizontal: 20,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#DDD',
        backgroundColor: '#F7F7F7',
    },
    floorBtnActive: {
        backgroundColor: '#912338',
        borderColor: '#912338',
    },
    floorBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },
    floorBtnTextActive: { color: '#fff' },

    // Room selectors
    roomSelectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    roomBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        gap: 8,
    },
    roomBtnStart: { borderLeftWidth: 3, borderLeftColor: '#4CAF50' },
    roomBtnEnd:   { borderLeftWidth: 3, borderLeftColor: '#2196F3' },
    roomBtnDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    arrowDivider: {
        paddingHorizontal: 4,
        alignItems: 'center',
    },
    roomBtnHint: {
        fontSize: 9,
        color: '#999',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    roomBtnValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1f1f1f',
    },

    // SVG
    scrollView: { flex: 0 },
    scrollContent: { padding: 16, alignItems: 'center' },
    svgContainer: {
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
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
