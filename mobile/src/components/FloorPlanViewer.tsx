import React, { useState, useMemo, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Modal,
    ScrollView, Dimensions, TextInput, FlatList,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { findPath, generateSvgPath } from '../utils/Pathfinding';

type FloorPlanMap = {
    [key: string]: string;
};

type Building = {
    id: string;
    /** Short label used as the room-number prefix, e.g. "H" for Hall Building */
    label?: string;
    address?: string;
    floorPlans?: FloorPlanMap;
};

type Props = Readonly<{
    building: Building | null;
    /** Initial floor to display. Defaults to the first available floor. */
    floorLevel?: string;
    onClose: () => void;
    pathStartNode?: number;
    pathEndNode?: number;
    /** Initial SVG label for the start room highlight (e.g. "829") */
    startRoom?: string;
    /** Initial SVG label for the destination room highlight (e.g. "862") */
    nextRoom?: string;
}>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Fallback prefix map for buildings that don't set `label` in buildings.js.
 * The prefix is what Concordia appends before the room number on signage,
 * e.g. room 829 on floor 8 of the Hall Building is called "H-829".
 */
const BUILDING_PREFIX_MAP: Record<string, string> = {
    'Hall Building': 'H',
    'John Molson Building': 'MB',
    'Webster Library': 'LB',
    'EV Building': 'EV',
    'GM Building': 'GM',
    'SP Building': 'SP',
    'VA Building': 'VA',
    'LS Building': 'LS',
};

/**
 * Extract all named rooms from an SVG string by reading `inkscape:label` attributes.
 * Labels that look like layer/group names are filtered out.
 */
function extractRoomsFromSvg(svgContent: string): string[] {
    const regex = /inkscape:label=["']([^"']+)["']/g;
    const rooms = new Set<string>();
    let match;
    while ((match = regex.exec(svgContent)) !== null) {
        const label = match[1].trim();
        if (label && !/^(Floor|Layer|layer|S[12] vec)/i.test(label)) {
            rooms.add(label);
        }
    }
    return Array.from(rooms).sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
    });
}

function highlightRoomInSvg(
    svgContent: string,
    startRoom: string | undefined,
    nextRoom: string | undefined
): string {
    let result = svgContent;

    if (startRoom) {
        const startRegex = new RegExp(
            `(<(?:rect|path)([^>]*?)inkscape:label=["']${startRoom}["']([^>]*?)>)`,
            'gi'
        );
        result = result.replace(startRegex, (match) => {
            if (/style=["']/i.test(match)) {
                return match.replace(
                    /style=["']([^"']*)["']/i,
                    'style="fill:#4CAF50;fill-opacity:0.7;stroke:#2E7D32;stroke-width:3;stroke-opacity:1;"'
                );
            }
            return match.replace(/>$/, ' style="fill:#4CAF50;fill-opacity:0.7;stroke:#2E7D32;stroke-width:3;stroke-opacity:1;">');
        });
    }

    if (nextRoom) {
        const nextRegex = new RegExp(
            `(<(?:rect|path)([^>]*?)inkscape:label=["']${nextRoom}["']([^>]*?)>)`,
            'gi'
        );
        result = result.replace(nextRegex, (match) => {
            if (/style=["']/i.test(match)) {
                return match.replace(
                    /style=["']([^"']*)["']/i,
                    'style="fill:#2196F3;fill-opacity:0.7;stroke:#1565C0;stroke-width:3;stroke-opacity:1;"'
                );
            }
            return match.replace(/>$/, ' style="fill:#2196F3;fill-opacity:0.7;stroke:#1565C0;stroke-width:3;stroke-opacity:1;">');
        });
    }

    return result;
}

// ─── Room Picker Bottom Sheet ─────────────────────────────────────────────────

type RoomPickerProps = {
    visible: boolean;
    title: string;
    /** All SVG room labels available on this floor (e.g. ["801","803","829"]) */
    rooms: string[];
    /** Building prefix shown in the UI (e.g. "H") */
    prefix: string;
    /** Currently selected SVG label */
    selectedRoom: string;
    onSelect: (svgLabel: string) => void;
    onClose: () => void;
};

function RoomPickerModal({
    visible, title, rooms, prefix, selectedRoom, onSelect, onClose,
}: RoomPickerProps) {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toUpperCase();
        if (!q) return rooms;
        return rooms.filter((r) => {
            const display = (prefix + r).toUpperCase();
            return display.includes(q) || r.toUpperCase().includes(q);
        });
    }, [query, rooms, prefix]);

    const handleSelect = useCallback(
        (svgLabel: string) => {
            onSelect(svgLabel);
            setQuery('');
            onClose();
        },
        [onSelect, onClose]
    );

    const handleClose = useCallback(() => {
        setQuery('');
        onClose();
    }, [onClose]);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <View style={pickerStyles.overlay}>
                <TouchableOpacity style={pickerStyles.backdrop} activeOpacity={1} onPress={handleClose} />
                <View style={pickerStyles.sheet}>
                    {/* Handle */}
                    <View style={pickerStyles.handle} />

                    {/* Header */}
                    <View style={pickerStyles.sheetHeader}>
                        <Text style={pickerStyles.sheetTitle}>{title}</Text>
                        <TouchableOpacity
                            onPress={handleClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialCommunityIcons name="close" size={22} color="#555" />
                        </TouchableOpacity>
                    </View>

                    {/* Search */}
                    <View style={pickerStyles.searchRow}>
                        <MaterialCommunityIcons name="magnify" size={18} color="#888" style={{ marginRight: 6 }} />
                        <TextInput
                            style={pickerStyles.searchInput}
                            placeholder={`Search (e.g. ${prefix}829)`}
                            placeholderTextColor="#aaa"
                            value={query}
                            onChangeText={setQuery}
                            autoCapitalize="characters"
                            clearButtonMode="while-editing"
                            testID="room-search-input"
                        />
                    </View>

                    {/* Legend */}
                    <View style={pickerStyles.legendRow}>
                        <Text style={pickerStyles.legendText}>
                            Showing {filtered.length} room{filtered.length !== 1 ? 's' : ''}
                            {prefix ? ` · Prefix "${prefix}" = ${prefix}XXX` : ''}
                        </Text>
                    </View>

                    {/* List */}
                    <FlatList
                        data={filtered}
                        keyExtractor={(item) => item}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => {
                            const isSelected = item === selectedRoom;
                            return (
                                <TouchableOpacity
                                    style={[
                                        pickerStyles.roomItem,
                                        isSelected && pickerStyles.roomItemSelected,
                                    ]}
                                    onPress={() => handleSelect(item)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            pickerStyles.roomLabel,
                                            isSelected && pickerStyles.roomLabelSelected,
                                        ]}
                                    >
                                        {prefix}{item}
                                    </Text>
                                    {isSelected && (
                                        <MaterialCommunityIcons name="check" size={18} color="#912338" />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                        ItemSeparatorComponent={() => <View style={pickerStyles.separator} />}
                        contentContainerStyle={{ paddingBottom: 32 }}
                    />
                </View>
            </View>
        </Modal>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FloorPlanViewer({
    building,
    floorLevel,
    onClose,
    pathStartNode = 6,
    pathEndNode = 60,
    startRoom: startRoomProp = '829',
    nextRoom: nextRoomProp = '862',
}: Props) {
    const availableFloors = useMemo(
        () => Object.keys(building?.floorPlans ?? {}).sort(),
        [building]
    );

    const initialFloor = floorLevel ?? availableFloors[0] ?? '8';

    const [currentFloor, setCurrentFloor] = useState<string>(initialFloor);
    const [startRoom, setStartRoom] = useState<string>(startRoomProp);
    const [nextRoom, setNextRoom] = useState<string>(nextRoomProp);
    const [roomPickerOpen, setRoomPickerOpen] = useState<'start' | 'end' | null>(null);

    // Resolve the building's room prefix (H, MB, etc.)
    const buildingPrefix = building?.label ?? BUILDING_PREFIX_MAP[building?.id ?? ''] ?? '';

    const rawSvgContent = building?.floorPlans?.[currentFloor];

    // Extract all labelled rooms from the current floor's SVG
    const roomList = useMemo(
        () => (rawSvgContent ? extractRoomsFromSvg(rawSvgContent) : []),
        [rawSvgContent]
    );

    const path = useMemo(() => {
        if (pathStartNode !== undefined && pathEndNode !== undefined && building?.id) {
            return findPath(building.id, currentFloor, pathStartNode, pathEndNode);
        }
        return null;
    }, [pathStartNode, pathEndNode, building?.id, currentFloor]);

    const svgWithPaths = useMemo(() => {
        const highlighted = rawSvgContent
            ? highlightRoomInSvg(rawSvgContent, startRoom, nextRoom)
            : rawSvgContent;

        if (!highlighted || !path || path.length === 0) {
            return highlighted;
        }

        const pathString = generateSvgPath(path);
        const pathSvg = `<path d="${pathString}" stroke="#007AFF" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="1"/>`;
        const startNode = path[0];
        const endNode = path.at(-1)!;
        const markers =
            `<circle cx="${startNode.data?.x}" cy="${startNode.data?.y}" r="12" fill="#34C759" stroke="#fff" stroke-width="3"/>` +
            `<circle cx="${endNode.data?.x}" cy="${endNode.data?.y}" r="12" fill="#FF3B30" stroke="#fff" stroke-width="3"/>`;

        return highlighted.replace('</svg>', `${pathSvg}${markers}</svg>`);
    }, [rawSvgContent, path, startRoom, nextRoom]);

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

const pickerStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: screenHeight * 0.72,
        paddingTop: 8,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#DDD',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 8,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    sheetTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f1f1f',
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginVertical: 10,
        backgroundColor: '#F2F2F2',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1f1f1f',
    },
    legendRow: {
        paddingHorizontal: 20,
        paddingBottom: 6,
    },
    legendText: {
        fontSize: 11,
        color: '#999',
    },
    roomItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 13,
    },
    roomItemSelected: {
        backgroundColor: '#FFF5F6',
    },
    roomLabel: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    roomLabelSelected: {
        color: '#912338',
        fontWeight: '700',
    },
    separator: {
        height: 1,
        backgroundColor: '#F2F2F2',
        marginHorizontal: 16,
    },
});
