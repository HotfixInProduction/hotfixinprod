import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Modal,
    ScrollView, Dimensions, Switch,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFloorPlanState } from '../hooks/useFloorPlanState';
import { useIndoorPath, useSvgPathForFloor, usePathFloors } from '../hooks/useIndoorPath';
import { useProcessedSvg } from '../hooks/useProcessedSvg';
import { useAmenities, AmenityElement } from '../hooks/useAmenities';
import AmenityInfoModal from './AmenityInfoModal';
import AmenityOverlay from './AmenityOverlay';
import CrossBuildingRoomPicker from './CrossBuildingRoomPicker';
import { Building, RoomSelection } from '../types/building';

type Props = Readonly<{
    building: Building | null;
    floorLevel?: string;
    onClose: () => void;
    startRoom?: string;
    nextRoom?: string;
    startRoomSelection?: RoomSelection | null;
    destinationRoomSelection?: RoomSelection | null;
    onStartRoomChange?: (selection: RoomSelection | null) => void;
    onDestinationRoomChange?: (selection: RoomSelection | null) => void;
}>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Extracted helper types
type RoomButtonType = 'start' | 'end';

// Extracted RoomButton component to reduce complexity
function RoomButton({
    type,
    buildingPrefix,
    effectiveRoom,
    buildingLabel,
    onPress,
}: Readonly<{
    type: RoomButtonType;
    buildingPrefix: string;
    effectiveRoom: string;
    buildingLabel: string | null;
    onPress: () => void;
}>) {
    const isStart = type === 'start';
    const dotColor = isStart ? '#4CAF50' : '#2196F3';
    const styleType = isStart ? styles.roomBtnStart : styles.roomBtnEnd;
    const hint = isStart ? 'FROM' : 'TO';
    const testId = isStart ? 'room-picker-start' : 'room-picker-end';

    return (
        <TouchableOpacity
            style={[styles.roomBtn, styleType, buildingLabel && styles.roomBtnExternal]}
            onPress={onPress}
            activeOpacity={0.8}
            testID={testId}
        >
            <View style={[styles.roomBtnDot, { backgroundColor: dotColor }]} />
            <View style={{ flex: 1 }}>
                <Text style={styles.roomBtnHint}>{hint}</Text>
                {buildingLabel ? (
                    <Text style={styles.roomBtnValueExternal} numberOfLines={1}>
                        {buildingLabel}: {effectiveRoom}
                    </Text>
                ) : (
                    <Text style={styles.roomBtnValue} numberOfLines={1}>
                        {effectiveRoom ? `${buildingPrefix}${effectiveRoom}` : 'Select room'}
                    </Text>
                )}
            </View>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#555" />
        </TouchableOpacity>
    );
}

// Extracted PathStatus component
function PathStatus({
    path,
    isMultiFloorPath,
    startRoom,
    nextRoom,
}: Readonly<{
    path: any;
    isMultiFloorPath: boolean;
    startRoom: string;
    nextRoom: string;
}>) {
    if (path && !isMultiFloorPath) {
        return (
            <View style={styles.pathStatus}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
                <Text style={styles.pathStatusText}>Path found on this floor</Text>
            </View>
        );
    }
    
    if (!path && startRoom && nextRoom) {
        return (
            <View style={styles.pathStatus}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#FF9800" />
                <Text style={styles.pathStatusTextWarn}>No path found</Text>
            </View>
        );
    }
    
    return null;
}

// Extracted MultiFloorIndicator component
function MultiFloorIndicator({
    pathFloors,
    accessibleOnly,
}: Readonly<{
    pathFloors: number[];
    accessibleOnly: boolean;
}>) {
    if (pathFloors.length <= 1) return null;
    
    return (
        <View style={styles.multiFloorIndicator}>
            <MaterialCommunityIcons
                name={accessibleOnly ? "elevator" : "stairs"}
                size={16}
                color="#912338"
            />
            <Text style={styles.multiFloorText}>
                Path spans {pathFloors.length} floors: {pathFloors.join(' → ')}
                {accessibleOnly && ' (via elevator)'}
            </Text>
        </View>
    );
}

// Extracted CrossBuildingIndicator component
function CrossBuildingIndicator({
    isStartBuilding,
    otherBuildingId,
}: Readonly<{
    isStartBuilding: boolean;
    otherBuildingId: string;
}>) {
    return (
        <View style={styles.crossBuildingIndicator}>
            <MaterialCommunityIcons
                name="exit-run"
                size={16}
                color="#912338"
            />
            <Text style={styles.crossBuildingText}>
                {isStartBuilding 
                    ? `Exit to reach ${otherBuildingId}` 
                    : `Enter from ${otherBuildingId}`}
            </Text>
        </View>
    );
}

export default function FloorPlanViewer({
    building,
    floorLevel,
    onClose,
    startRoom: startRoomProp = '829',
    nextRoom: nextRoomProp = '862',
    startRoomSelection,
    destinationRoomSelection,
    onStartRoomChange,
    onDestinationRoomChange,
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

    // Accessibility mode state
    const [accessibleOnly, setAccessibleOnly] = useState(false);
    
    // Amenity state
    const [selectedAmenity, setSelectedAmenity] = useState<AmenityElement | null>(null);
    const amenities = useAmenities(rawSvgContent);
    
    // Handle room selection with external state persistence
    const handleStartRoomSelect = (selection: RoomSelection) => {
        setStartRoom(selection.room);
        setCurrentFloor(selection.floor);
        if (onStartRoomChange && building) {
            onStartRoomChange(selection);
        }
    };
    
    const handleDestinationRoomSelect = (selection: RoomSelection) => {
        setNextRoom(selection.room);
        setCurrentFloor(selection.floor);
        if (onDestinationRoomChange && building) {
            onDestinationRoomChange(selection);
        }
    };
    
    // Use external selection if available (even if from different building)
    // Fall back to local state only if no external selection
    const effectiveStartRoom = startRoomSelection ? startRoomSelection.room : startRoom;
    const effectiveDestRoom = destinationRoomSelection ? destinationRoomSelection.room : nextRoom;
    
    // Get building label for display when selection is from different building
    const startRoomBuildingLabel = startRoomSelection && startRoomSelection.buildingId !== building?.id 
        ? startRoomSelection.buildingId 
        : null;
    const destRoomBuildingLabel = destinationRoomSelection && destinationRoomSelection.buildingId !== building?.id 
        ? destinationRoomSelection.buildingId 
        : null;

    // Determine building IDs for cross-building navigation
    const startBuildingId = startRoomSelection?.buildingId ?? building?.id;
    const destBuildingId = destinationRoomSelection?.buildingId ?? building?.id;
    
    // Find path (supports multi-floor for Hall Building and cross-building navigation)
    const path = useIndoorPath(
        building?.id,
        currentFloor,
        effectiveStartRoom,
        effectiveDestRoom,
        { 
            accessibleOnly,
            startBuildingId,
            endBuildingId: destBuildingId,
        }
    );
    
    // Get floors involved in the path
    const pathFloors = usePathFloors(path);
    
    // Generate path string for the current floor only
    const currentFloorNum = Number.parseInt(currentFloor, 10);
    const pathString = useSvgPathForFloor(path, currentFloorNum);

    const svgWithPaths = useProcessedSvg(rawSvgContent, path, pathString, startRoom, nextRoom);
    
    // Check if this is a multi-floor path
    const isMultiFloorPath = pathFloors.length > 1;
    
    // Check if this is cross-building navigation
    const isCrossBuilding = startBuildingId !== destBuildingId;
    const isStartBuilding = building?.id === startBuildingId;

    // Calculate SVG scale factor
    // SVG coordinate system is 1024x1024, displayed at (screenWidth - 40) x (screenWidth - 40)
    const displaySvgSize = screenWidth - 40;
    const originalSvgSize = 1024;
    const svgScale = displaySvgSize / originalSvgSize;

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
                            <RoomButton
                                type="start"
                                buildingPrefix={buildingPrefix}
                                effectiveRoom={effectiveStartRoom}
                                buildingLabel={startRoomBuildingLabel}
                                onPress={() => setRoomPickerOpen('start')}
                            />

                            <View style={styles.arrowDivider}>
                                <MaterialCommunityIcons name="arrow-right" size={16} color="#AAA" />
                            </View>

                            <RoomButton
                                type="end"
                                buildingPrefix={buildingPrefix}
                                effectiveRoom={effectiveDestRoom}
                                buildingLabel={destRoomBuildingLabel}
                                onPress={() => setRoomPickerOpen('end')}
                            />
                        </View>

                        {/* ── Cross-building hint ── */}
                        <View style={styles.crossBuildingHintRow}>
                            <MaterialCommunityIcons name="information" size={14} color="#888" />
                            <Text style={styles.crossBuildingHintText}>
                                Tap to select any room on any floor
                            </Text>
                        </View>

                        {/* ── Accessibility toggle ── */}
                        <View style={styles.accessibilityRow}>
                            <View style={styles.accessibilityLabel}>
                                <MaterialCommunityIcons 
                                    name="wheelchair-accessibility" 
                                    size={18} 
                                    color={accessibleOnly ? '#912338' : '#666'} 
                                />
                                <Text style={[styles.accessibilityText, accessibleOnly && styles.accessibilityTextActive]}>
                                    Accessible route
                                </Text>
                            </View>
                            <Switch
                                value={accessibleOnly}
                                onValueChange={setAccessibleOnly}
                                trackColor={{ false: '#E0E0E0', true: '#F8BBD9' }}
                                thumbColor={accessibleOnly ? '#912338' : '#BDBDBD'}
                                testID="accessibility-toggle"
                            />
                        </View>

                        {/* ── Cross-building indicator ── */}
                        {isCrossBuilding && startBuildingId && destBuildingId && (
                            <CrossBuildingIndicator
                                isStartBuilding={isStartBuilding}
                                otherBuildingId={isStartBuilding ? destBuildingId : startBuildingId}
                            />
                        )}
                        
                        {/* ── Multi-floor path indicator ── */}
                        <MultiFloorIndicator
                            pathFloors={pathFloors}
                            accessibleOnly={accessibleOnly}
                        />
                        
                        {/* ── Path status ── */}
                        <PathStatus
                            path={path}
                            isMultiFloorPath={isMultiFloorPath}
                            startRoom={startRoom}
                            nextRoom={nextRoom}
                        />

                        {/* ── SVG floor plan ── */}
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={true}
                            showsHorizontalScrollIndicator={true}
                            scrollEnabled={true}
                        >
                            <View style={styles.svgContainer}>
                                <SvgXml
                                    xml={svgWithPaths}
                                    width={screenWidth - 40}
                                    height={screenWidth - 40}
                                    onError={(e) => console.log('SVG Error: ', e)}
                                />
                                {/* Amenity overlay on top of SVG */}
                                <AmenityOverlay
                                    amenities={amenities}
                                    svgScale={svgScale}
                                    svgOffsetX={0}
                                    svgOffsetY={0}
                                    onAmenityPress={setSelectedAmenity}
                                />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Start-room picker */}
            {building && (
                <CrossBuildingRoomPicker
                    visible={roomPickerOpen === 'start'}
                    title={`Select start room - ${building.id}`}
                    buildingId={building.id}
                    onSelect={handleStartRoomSelect}
                    onClose={() => setRoomPickerOpen(null)}
                />
            )}

            {/* Destination-room picker */}
            {building && (
                <CrossBuildingRoomPicker
                    visible={roomPickerOpen === 'end'}
                    title={`Select destination room - ${building.id}`}
                    buildingId={building.id}
                    onSelect={handleDestinationRoomSelect}
                    onClose={() => setRoomPickerOpen(null)}
                />
            )}

            {/* Amenity info modal */}
            <AmenityInfoModal
                visible={!!selectedAmenity}
                amenity={selectedAmenity}
                onClose={() => setSelectedAmenity(null)}
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
    roomBtnExternal: {
        backgroundColor: '#FFF8E1',
        borderColor: '#FFE082',
    },
    roomBtnValueExternal: {
        fontSize: 13,
        fontWeight: '700',
        color: '#912338',
    },

    // Cross-building hint
    crossBuildingHintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F5F5F5',
        gap: 6,
    },
    crossBuildingHintText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },

    // Accessibility toggle
    accessibilityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: '#FAFAFA',
    },
    accessibilityLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    accessibilityText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    accessibilityTextActive: {
        color: '#912338',
        fontWeight: '600',
    },

    // Multi-floor path indicator
    multiFloorIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFF3E0',
        borderBottomWidth: 1,
        borderBottomColor: '#FFE0B2',
        gap: 8,
    },
    multiFloorText: {
        fontSize: 13,
        color: '#912338',
        fontWeight: '600',
    },
    
    // Cross-building indicator
    crossBuildingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#E3F2FD',
        borderBottomWidth: 1,
        borderBottomColor: '#BBDEFB',
        gap: 8,
    },
    crossBuildingText: {
        fontSize: 13,
        color: '#1565C0',
        fontWeight: '600',
    },
    
    // Path status
    pathStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: '#E8F5E9',
        gap: 6,
    },
    pathStatusText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '500',
    },
    pathStatusTextWarn: {
        fontSize: 12,
        color: '#FF9800',
        fontWeight: '500',
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
        position: 'relative',
        overflow: 'visible',
    },
});
