export type MapScreenModal =
  | 'navigation'
  | 'buildingInfo'
  | 'routeInstructions'
  | 'routeInfo'
  | 'none';

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
