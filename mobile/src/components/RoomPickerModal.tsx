import React, { useState, useMemo, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Modal,
    TextInput, FlatList, Dimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const { height: screenHeight } = Dimensions.get('window');

// Types

export type RoomPickerProps = Readonly<{
    visible: boolean;
    title: string;
    rooms: string[];
    prefix: string;
    selectedRoom: string;
    onSelect: (svgLabel: string) => void;
    onClose: () => void;
}>;

type RoomItemProps = {
    item: string;
    prefix: string;
    isSelected: boolean;
    onSelect: (svgLabel: string) => void;
};

// Room Item Component

const RoomItem = React.memo(function RoomItem({ item, prefix, isSelected, onSelect }: RoomItemProps) {
    const handlePress = useCallback(() => onSelect(item), [onSelect, item]);

    return (
        <TouchableOpacity
            style={[
                styles.roomItem,
                isSelected && styles.roomItemSelected,
            ]}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <Text
                style={[
                    styles.roomLabel,
                    isSelected && styles.roomLabelSelected,
                ]}
            >
                {prefix}{item}
            </Text>
            {isSelected && (
                <MaterialCommunityIcons name="check" size={18} color="#912338" />
            )}
        </TouchableOpacity>
    );
});

const ItemSeparator = () => <View style={styles.separator} />;

// Main Component

export default function RoomPickerModal({
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
                    <View style={styles.legendRow}>
                        <Text style={styles.legendText}>
                            Showing {filtered.length} room{filtered.length === 1 ? '' : 's'}
                            {prefix ? ` · Prefix "${prefix}" = ${prefix}XXX` : ''}
                        </Text>
                    </View>

                    {/* List */}
                    <FlatList
                        data={filtered}
                        keyExtractor={(item) => item}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <RoomItem
                                item={item}
                                prefix={prefix}
                                isSelected={item === selectedRoom}
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
