import React, { useState, useMemo, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Modal,
    TextInput, FlatList, Dimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRoomsForBuilding, RoomWithBuilding } from '../hooks/useAllRooms';
import { RoomSelection } from '../types/building';

const { height: screenHeight } = Dimensions.get('window');

export type CrossBuildingRoomPickerProps = Readonly<{
    visible: boolean;
    title: string;
    buildingId: string;
    onSelect: (selection: RoomSelection) => void;
    onClose: () => void;
}>;

type RoomItemProps = {
    item: RoomWithBuilding;
    isSelected: boolean;
    onSelect: (selection: RoomSelection) => void;
};

const RoomItem = React.memo(function RoomItem({ item, isSelected, onSelect }: RoomItemProps) {
    const handlePress = useCallback(() => {
        onSelect({
            buildingId: item.buildingId,
            floor: item.floor,
            room: item.room,
        });
    }, [onSelect, item]);

    return (
        <TouchableOpacity
            style={[
                styles.roomItem,
                isSelected && styles.roomItemSelected,
            ]}
            onPress={handlePress}
            activeOpacity={0.7}
            testID={`room-item-${item.prefix}${item.room}`}
        >
            <View style={styles.roomContent}>
                <Text
                    style={[
                        styles.roomLabel,
                        isSelected && styles.roomLabelSelected,
                    ]}
                    numberOfLines={1}
                >
                    {item.prefix}{item.room}
                </Text>
                <Text
                    style={[
                        styles.roomDetails,
                        isSelected && styles.roomDetailsSelected,
                    ]}
                    numberOfLines={1}
                >
                    {item.displayLabel}
                </Text>
            </View>
            {isSelected && (
                <MaterialCommunityIcons name="check" size={18} color="#912338" />
            )}
        </TouchableOpacity>
    );
});

const ItemSeparator = () => <View style={styles.separator} />;

export default function CrossBuildingRoomPicker({
    visible, title, buildingId, onSelect, onClose,
}: CrossBuildingRoomPickerProps) {
    const [query, setQuery] = useState('');
    const allRoomsInBuilding = useRoomsForBuilding(buildingId);

    const filtered = useMemo(() => {
        const q = query.trim().toUpperCase();
        if (!q) return allRoomsInBuilding;
        return allRoomsInBuilding.filter((room) => {
            const roomLabel = `${room.prefix}${room.room}`.toUpperCase();
            const floorLabel = `FLOOR ${room.floor}`;
            return (
                roomLabel.includes(q) ||
                room.room.toUpperCase().includes(q) ||
                floorLabel.includes(q)
            );
        });
    }, [query, allRoomsInBuilding]);

    const handleSelect = useCallback(
        (selection: RoomSelection) => {
            onSelect(selection);
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
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
                <View style={styles.sheet}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>{title}</Text>
                        <TouchableOpacity
                            onPress={handleClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialCommunityIcons name="close" size={22} color="#555" />
                        </TouchableOpacity>
                    </View>

                    {/* Search */}
                    <View style={styles.searchRow}>
                        <MaterialCommunityIcons name="magnify" size={18} color="#888" style={{ marginRight: 6 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search (e.g. 801 or Floor 8)"
                            placeholderTextColor="#aaa"
                            value={query}
                            onChangeText={setQuery}
                            autoCapitalize="characters"
                            clearButtonMode="while-editing"
                            testID="cross-building-room-search"
                        />
                    </View>

                    {/* Legend */}
                    <View style={styles.legendRow}>
                        <Text style={styles.legendText}>
                            Showing {filtered.length} room{filtered.length === 1 ? '' : 's'}
                        </Text>
                    </View>

                    {/* List */}
                    <FlatList
                        data={filtered}
                        keyExtractor={(item) => `${item.buildingId}-${item.floor}-${item.room}`}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <RoomItem
                                item={item}
                                isSelected={false}
                                onSelect={handleSelect}
                            />
                        )}
                        ItemSeparatorComponent={ItemSeparator}
                        contentContainerStyle={{ paddingBottom: 32 }}
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    backdrop: {
        flex: 1,
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: screenHeight * 0.8,
        paddingBottom: 0,
    },
    handle: {
        alignSelf: 'center',
        width: 48,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#DDD',
        marginVertical: 8,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    sheetTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f1f1f',
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    searchInput: {
        flex: 1,
        height: 36,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#1f1f1f',
    },
    legendRow: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FAFAFA',
    },
    legendText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },
    roomItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        justifyContent: 'space-between',
    },
    roomItemSelected: {
        backgroundColor: '#FFF3F5',
    },
    roomContent: {
        flex: 1,
    },
    roomLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f1f1f',
        marginBottom: 2,
    },
    roomLabelSelected: {
        color: '#912338',
    },
    roomDetails: {
        fontSize: 12,
        color: '#888',
    },
    roomDetailsSelected: {
        color: '#912338',
    },
    separator: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginHorizontal: 16,
    },
});
