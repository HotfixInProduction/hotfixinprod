/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of first coordinate
 * @param lon1 Longitude of first coordinate
 * @param lat2 Latitude of second coordinate
 * @param lon2 Longitude of second coordinate
 * @returns Distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance * 1000; // Convert to meters
};

/**
 * Finds the nearest POI within a specified range
 * @param userCoordinates User's current location
 * @param pois Array of POIs to search
 * @param rangeInMeters Maximum distance in meters (default: 500)
 * @returns POI with distance info if found, null otherwise
 */
export const findNearestPOI = (
  userCoordinates: { latitude: number; longitude: number } | null,
  pois: Array<{ coordinates: { latitude: number; longitude: number }; [key: string]: any }>,
  rangeInMeters = 500
): (typeof pois[0] & { distance: number }) | null => {
  if (!userCoordinates || pois.length === 0) {
    return null;
  }

  let nearestPOI: (typeof pois[0] & { distance: number }) | null = null;

  for (const poi of pois) {
    const distance = calculateDistance(
      userCoordinates.latitude,
      userCoordinates.longitude,
      poi.coordinates.latitude,
      poi.coordinates.longitude
    );

    if (distance <= rangeInMeters) {
      if (!nearestPOI || distance < nearestPOI.distance) {
        nearestPOI = { ...poi, distance };
      }
    }
  }

  return nearestPOI;
};

/**
 * Finds all POIs within a specified range
 * @param userCoordinates User's current location
 * @param pois Array of POIs to search
 * @param rangeInMeters Maximum distance in meters (default: 500)
 * @returns Array of POIs within range, sorted by distance
 */
export const findPOIsInRange = (
  userCoordinates: { latitude: number; longitude: number } | null,
  pois: Array<{ coordinates: { latitude: number; longitude: number }; [key: string]: any }>,
  rangeInMeters = 500
): Array<typeof pois[0] & { distance: number }> => {
  if (!userCoordinates) {
    return [];
  }

  const poisInRange = pois
    .map((poi) => ({
      ...poi,
      distance: calculateDistance(
        userCoordinates.latitude,
        userCoordinates.longitude,
        poi.coordinates.latitude,
        poi.coordinates.longitude
      ),
    }))
    .filter((poi) => poi.distance <= rangeInMeters)
    .sort((a, b) => a.distance - b.distance);

  return poisInRange;
};

/**
 * Formats distance for display
 * @param distanceInMeters Distance in meters
 * @returns Formatted distance string
 */
export const formatDistance = (distanceInMeters: number): string => {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  }
  return `${(distanceInMeters / 1000).toFixed(1)}km`;
};
