import { useEffect, useMemo, useState } from 'react';
import {
  SHUTTLE_DISTANCE_KM,
  buildShuttleData,
  buildShuttleRouteSegments,
  resolveCampusForPlace,
  type PlaceWithLocation,
} from '../models/MapRouting';
import type { TravelMode } from '../types/map';

type UseShuttleRoutingParams = {
  start: PlaceWithLocation;
  destination: PlaceWithLocation;
  transportMode: TravelMode;
  onTransportModeChange: (mode: TravelMode) => void;
};

export function useShuttleRouting({
  start,
  destination,
  transportMode,
  onTransportModeChange,
}: UseShuttleRoutingParams) {
  const [shuttleNow, setShuttleNow] = useState(new Date());

  const startCampus = useMemo(() => resolveCampusForPlace(start), [start]);
  const destinationCampus = useMemo(() => resolveCampusForPlace(destination), [destination]);
  const isShuttleRoute = Boolean(startCampus && destinationCampus && startCampus !== destinationCampus);

  const shuttleData = useMemo(() => {
    if (!isShuttleRoute || !startCampus || !destinationCampus) {
      return null;
    }
    return buildShuttleData({
      now: shuttleNow,
      startCampus,
      destinationCampus,
    });
  }, [destinationCampus, isShuttleRoute, shuttleNow, startCampus]);

  const shuttleRouteSegments = useMemo(() => {
    if (
      transportMode !== 'SHUTTLE' ||
      !isShuttleRoute ||
      !start ||
      !destination ||
      !startCampus ||
      !destinationCampus
    ) {
      return null;
    }

    return buildShuttleRouteSegments({
      start,
      destination,
      startCampus,
      destinationCampus,
    });
  }, [destination, destinationCampus, isShuttleRoute, start, startCampus, transportMode]);

  const shuttleRouteInfo = useMemo(() => {
    if (transportMode !== 'SHUTTLE' || !shuttleData || !start || !destination) {
      return null;
    }
    return {
      distance: SHUTTLE_DISTANCE_KM,
      duration: shuttleData.totalDurationMinutes,
    };
  }, [destination, shuttleData, start, transportMode]);

  useEffect(() => {
    if (transportMode !== 'SHUTTLE' || !isShuttleRoute) return;
    const intervalId = setInterval(() => setShuttleNow(new Date()), 30000);
    return () => clearInterval(intervalId);
  }, [isShuttleRoute, transportMode]);

  useEffect(() => {
    if (transportMode === 'SHUTTLE' && !isShuttleRoute) {
      onTransportModeChange('TRANSIT');
    }
  }, [isShuttleRoute, onTransportModeChange, transportMode]);

  return {
    isShuttleRoute,
    shuttleData,
    shuttleRouteSegments,
    shuttleRouteInfo,
  };
}
