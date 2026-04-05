export type MapScreenModal =
  | 'navigation'
  | 'buildingInfo'
  | 'routeInstructions'
  | 'routeInfo'
  | 'none';

type RoomSelectionLike = {
  readonly buildingId?: string;
  readonly floor?: string;
  readonly room?: string;
} | null;

type GetActiveMapModalParams = {
  readonly isNavigating: boolean;
  readonly hasSelectedBuilding: boolean;
  readonly showInstructions: boolean;
  readonly showRoutePreview: boolean;
  readonly hasRouteInfo: boolean;
  readonly isStartComplete: boolean;
  readonly isDestinationComplete: boolean;
};

export function getActiveMapModal({
  isNavigating,
  hasSelectedBuilding,
  showInstructions,
  showRoutePreview,
  hasRouteInfo,
  isStartComplete,
  isDestinationComplete,
}: Readonly<GetActiveMapModalParams>): MapScreenModal {
  if (isNavigating) return 'navigation';
  if (hasSelectedBuilding) return 'buildingInfo';
  if (showInstructions) return 'routeInstructions';
  if (showRoutePreview && hasRouteInfo && isStartComplete && isDestinationComplete) return 'routeInfo';
  return 'none';
}

type GetDestinationCompleteParams = {
  readonly destination: unknown;
  readonly enableRoomSelection: boolean;
  readonly destinationRoomSelection: RoomSelectionLike;
};

export function getIsDestinationComplete({
  destination,
  enableRoomSelection,
  destinationRoomSelection,
}: Readonly<GetDestinationCompleteParams>): boolean {
  const hasDestinationRoomSelection = Boolean(
    destinationRoomSelection?.buildingId &&
    destinationRoomSelection?.floor &&
    destinationRoomSelection?.room
  );

  return Boolean(destination) &&
    (!enableRoomSelection || hasDestinationRoomSelection);
}

export function shouldShowCompactRouteHeader(activeModal: MapScreenModal): boolean {
  return activeModal === 'routeInfo' ||
    activeModal === 'routeInstructions' ||
    activeModal === 'navigation';
}
