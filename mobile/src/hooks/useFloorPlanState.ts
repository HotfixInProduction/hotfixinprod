import { useState, useMemo, useCallback } from 'react';
import { Building } from '../types/indoor';

type RoomPickerTarget = 'start' | 'end' | null;

type FloorPlanState = {
  currentFloor: string;
  startRoom: string;
  nextRoom: string;
  roomPickerOpen: RoomPickerTarget;
};

type FloorPlanActions = {
  setCurrentFloor: (floor: string) => void;
  setStartRoom: (room: string) => void;
  setNextRoom: (room: string) => void;
  setRoomPickerOpen: (target: RoomPickerTarget) => void;
  openStartRoomPicker: () => void;
  openNextRoomPicker: () => void;
  closeRoomPicker: () => void;
};

/**
 * Fallback prefix map for buildings that don't set `label` in buildings.js.
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

export function useFloorPlanState(
  building: Building | null,
  initialStartRoom: string,
  initialNextRoom: string,
  initialFloor?: string
) {
  const availableFloors = useMemo(
    () => Object.keys(building?.floorPlans ?? {}).sort((a, b) => a.localeCompare(b)),
    [building]
  );

  const defaultFloor = initialFloor ?? availableFloors[0];

  const [currentFloor, setCurrentFloor] = useState<string>(defaultFloor);
  const [startRoom, setStartRoom] = useState<string>(initialStartRoom);
  const [nextRoom, setNextRoom] = useState<string>(initialNextRoom);
  const [roomPickerOpen, setRoomPickerOpen] = useState<RoomPickerTarget>(null);

  const buildingPrefix = useMemo(
    () => building?.label ?? BUILDING_PREFIX_MAP[building?.id ?? ''] ?? '',
    [building]
  );

  const rawSvgContent = building?.floorPlans?.[currentFloor];

  const openStartRoomPicker = useCallback(() => setRoomPickerOpen('start'), []);
  const openNextRoomPicker = useCallback(() => setRoomPickerOpen('end'), []);
  const closeRoomPicker = useCallback(() => setRoomPickerOpen(null), []);

  return {
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
    openStartRoomPicker,
    openNextRoomPicker,
    closeRoomPicker,
  };
}

export type { FloorPlanState, FloorPlanActions, RoomPickerTarget };
