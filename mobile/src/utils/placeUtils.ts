import type { Place } from '../components/BuildingSelector/StartDestinationPicker';
import type { Building } from '../types/building';
import type { OutdoorPOI } from '../data/outdoorPOI';

/**
 * Creates a Place object from the user's current location
 */
export function createPlaceFromUserLocation(
  userLocation: { latitude: number; longitude: number }
): Place {
  return {
    name: 'Current Location',
    address: 'Your Location',
    location: {
      lat: userLocation.latitude,
      lng: userLocation.longitude,
    },
  };
}

/**
 * Creates a Place object from a Building
 */
export function createPlaceFromBuilding(building: Building): Place {
  return {
    name: building.id,
    address: building.address || building.id,
    location: {
      lat: building.labelCoord.latitude,
      lng: building.labelCoord.longitude,
    },
  };
}

/**
 * Creates a Place object from an OutdoorPOI
 */
export function createPlaceFromPOI(poi: OutdoorPOI): Place {
  return {
    name: poi.name,
    address: poi.address || poi.name,
    location: {
      lat: poi.coordinates.latitude,
      lng: poi.coordinates.longitude,
    },
  };
}
