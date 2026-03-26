import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { buildings } from '../../data/buildings';
import { useFloorPlanState } from '../../hooks/useFloorPlanState';
import { useRoomList } from '../../hooks/useRoomList';
import type { Building, RoomSelection } from '../../types/building';

type InlineRoomSelectorProps = {
  buildingId?: string | null;
  label: string;
  selection: RoomSelection | null;
  onChange: (selection: RoomSelection | null) => void;
};

type FloorDropdownProps = {
  label: string;
  currentFloor: string;
  availableFloors: string[];
  onSelect: (floor: string) => void;
};

type RoomDropdownProps = {
  label: string;
  currentFloor: string;
  roomList: string[];
  selection: RoomSelection | null;
  buildingPrefix: string;
  onSelect: (room: string) => void;
};

const getFloorText = (
  building: Building | undefined,
  selection: RoomSelection | null
) => {
  if (!building) return 'Floor';
  if (selection?.floor) return `Floor: ${selection.floor}`;
  return 'Floor: Select';
};

const getRoomText = (
  building: Building | undefined,
  selection: RoomSelection | null,
  buildingPrefix: string
) => {
  if (!building) return 'Room';
  if (selection?.room) return `Room: ${buildingPrefix}${selection.room}`;
  return 'Room: Select';
};

const FloorDropdown: React.FC<FloorDropdownProps> = ({
  label,
  currentFloor,
  availableFloors,
  onSelect,
}) => (
  <View style={styles.dropdownContainer}>
    <ScrollView
      style={styles.dropdownList}
      nestedScrollEnabled
      showsVerticalScrollIndicator
    >
      {availableFloors.map((floor) => {
        const floorValue = String(floor);
        const isSelected = String(currentFloor) === floorValue;

        return (
          <TouchableOpacity
            key={`${label}-floor-${floorValue}`}
            style={[
              styles.dropdownItem,
              isSelected && styles.dropdownItemSelected,
            ]}
            onPress={() => onSelect(floorValue)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.dropdownItemText,
                isSelected && styles.dropdownItemTextSelected,
              ]}
            >
              Floor {floorValue}
            </Text>

            {isSelected && (
              <MaterialCommunityIcons name="check" size={16} color="#912338" />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);

const RoomDropdown: React.FC<RoomDropdownProps> = ({
  label,
  currentFloor,
  roomList,
  selection,
  buildingPrefix,
  onSelect,
}) => {
  if (!currentFloor) return null;

  return (
    <View style={styles.dropdownContainer}>
      {roomList.length > 0 ? (
        <ScrollView
          style={styles.dropdownList}
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          {roomList.map((room) => {
            const roomValue = String(room);
            const isSelected = selection?.room === roomValue;

            return (
              <TouchableOpacity
                key={`${label}-room-${roomValue}`}
                style={[
                  styles.dropdownItem,
                  isSelected && styles.dropdownItemSelected,
                ]}
                onPress={() => onSelect(roomValue)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    isSelected && styles.dropdownItemTextSelected,
                  ]}
                >
                  {buildingPrefix}
                  {roomValue}
                </Text>

                {isSelected && (
                  <MaterialCommunityIcons name="check" size={16} color="#912338" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.helperText}>No rooms available for this floor.</Text>
      )}
    </View>
  );
};

const InlineRoomSelector: React.FC<InlineRoomSelectorProps> = ({
  buildingId,
  label,
  selection,
  onChange,
}) => {
  const [showFloorList, setShowFloorList] = useState(false);
  const [showRoomList, setShowRoomList] = useState(false);

  const building = buildingId
    ? (buildings.find((b) => b.id === buildingId) as Building | undefined)
    : undefined;

  const {
    currentFloor,
    availableFloors,
    buildingPrefix,
    rawSvgContent,
    setCurrentFloor,
  } = useFloorPlanState(
    building ?? null,
    selection?.room ?? '',
    '',
    selection?.floor || undefined
  );

  const roomList = useRoomList(rawSvgContent, building?.id, currentFloor);

  useEffect(() => {
    if (!building) {
      setShowFloorList(false);
      setShowRoomList(false);
      return;
    }

    const selectedFloor = selection?.floor;
    const selectedRoom = selection?.room;
    const firstFloor = availableFloors[0] ? String(availableFloors[0]) : '';
    const floorExists =
      !!selectedFloor && availableFloors.includes(String(selectedFloor));
    const roomExists =
      !!selectedRoom && roomList.includes(String(selectedRoom));

    if (!selectedFloor || !floorExists) {
      if (!firstFloor) return;

      setCurrentFloor(firstFloor);
      onChange({
        buildingId: building.id,
        floor: firstFloor,
        room: '',
      });
      return;
    }

    if (String(currentFloor) !== String(selectedFloor)) {
      setCurrentFloor(String(selectedFloor));
    }

    if (selectedRoom && !roomExists) {
      onChange({
        buildingId: building.id,
        floor: String(currentFloor),
        room: '',
      });
    }
  }, [
    building,
    selection,
    availableFloors,
    roomList,
    currentFloor,
    setCurrentFloor,
    onChange,
  ]);

  const floorDisabled = !building || availableFloors.length === 0;
  const roomDisabled = !building || !currentFloor;

  const handleFloorPress = () => {
    if (floorDisabled) return;
    setShowFloorList((prev) => !prev);
    setShowRoomList(false);
  };

  const handleRoomPress = () => {
    if (roomDisabled) return;
    setShowRoomList((prev) => !prev);
    setShowFloorList(false);
  };

  const handleFloorSelect = (floor: string) => {
    setCurrentFloor(floor);
    setShowFloorList(false);
    setShowRoomList(false);

    onChange({
      buildingId: buildingId || '',
      floor,
      room: '',
    });
  };

  const handleRoomSelect = (room: string) => {
    onChange({
      buildingId: buildingId || '',
      floor: String(currentFloor),
      room,
    });
    setShowRoomList(false);
  };

  const floorText = getFloorText(building, selection);
  const roomText = getRoomText(building, selection, buildingPrefix);

  return (
    <View style={styles.section}>
      <View style={styles.compactRow}>
        <TouchableOpacity
          style={[
            styles.compactInput,
            styles.compactInputLeft,
            floorDisabled && styles.compactInputDisabled,
          ]}
          onPress={handleFloorPress}
          activeOpacity={floorDisabled ? 1 : 0.8}
          disabled={floorDisabled}
        >
          <Text
            style={[
              styles.compactInputText,
              (!building || !selection?.floor) && styles.compactInputPlaceholder,
              floorDisabled && styles.compactInputDisabledText,
            ]}
            numberOfLines={1}
          >
            {floorText}
          </Text>

          <MaterialCommunityIcons
            name={showFloorList ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={floorDisabled ? '#aaa' : '#555'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.compactInput,
            roomDisabled && styles.compactInputDisabled,
          ]}
          onPress={handleRoomPress}
          activeOpacity={roomDisabled ? 1 : 0.8}
          disabled={roomDisabled}
        >
          <Text
            style={[
              styles.compactInputText,
              (!building || !selection?.room) && styles.compactInputPlaceholder,
              roomDisabled && styles.compactInputDisabledText,
            ]}
            numberOfLines={1}
          >
            {roomText}
          </Text>

          <MaterialCommunityIcons
            name={showRoomList ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={roomDisabled ? '#aaa' : '#555'}
          />
        </TouchableOpacity>
      </View>

      {showFloorList && building && (
        <FloorDropdown
          label={label}
          currentFloor={String(currentFloor)}
          availableFloors={availableFloors.map(String)}
          onSelect={handleFloorSelect}
        />
      )}

      {showRoomList && building && !!currentFloor && (
        <RoomDropdown
          label={label}
          currentFloor={String(currentFloor)}
          roomList={roomList.map(String)}
          selection={selection}
          buildingPrefix={buildingPrefix}
          onSelect={handleRoomSelect}
        />
      )}

      <Text style={styles.selectedText}>
        {buildingId ? `Building: ${buildingId}` : 'No building selected'}
        {selection?.floor ? ` • Floor ${selection.floor}` : ''}
        {selection?.room ? ` • ${buildingPrefix}${selection.room}` : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  compactRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  compactInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactInputLeft: {
    flex: 0.9,
  },
  compactInputDisabled: {
    backgroundColor: '#f7f7f7',
    borderColor: '#e3e3e3',
  },
  compactInputText: {
    flex: 1,
    fontSize: 13,
    color: '#1f1f1f',
    fontWeight: '500',
  },
  compactInputPlaceholder: {
    color: '#888',
    fontWeight: '400',
  },
  compactInputDisabledText: {
    color: '#999',
  },
  dropdownContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dropdownList: {
    maxHeight: 180,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemSelected: {
    backgroundColor: '#FFF5F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: '#912338',
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    color: '#777',
    padding: 12,
  },
  selectedText: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default InlineRoomSelector;