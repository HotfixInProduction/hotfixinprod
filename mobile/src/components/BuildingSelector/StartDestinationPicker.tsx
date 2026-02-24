import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import BuildingSelector from './BuildingSelector';
import Config from "react-native-config";
import * as Location from 'expo-location';
import { buildings } from '../../data/buildings';
import type { MapStep, TravelMode } from '../../types/map';

export type Place = {
  name: string;
  address: string;
  location: { lat: number; lng: number };
};

type StartDestinationPickerProps = {
  userLocation: { latitude: number; longitude: number } | null;
  start: Place | null;
  destination: Place | null;
  setStart: (place: Place | null) => void;
  setDestination: (place: Place | null) => void;
  setInstructions: (val: MapStep[]) => void;
  transportMode: TravelMode;
  mapSelectionTarget?: 'start' | 'destination' | null;
  setMapSelectionTarget?: (target: 'start' | 'destination' | null) => void;
};

const GOOGLE_DIRECTIONS_MODE: Record<TravelMode, string> = {
  DRIVING: 'driving',
  WALKING: 'walking',
  BICYCLING: 'bicycling',
  TRANSIT: 'transit',
};

const StartDestinationPicker: React.FC<StartDestinationPickerProps> = ({ userLocation, start, destination, setStart, setDestination, setInstructions, transportMode, mapSelectionTarget, setMapSelectionTarget }) => {
  const googleMapsApiKey = Config.GOOGLE_MAPS_ANDROID_API_KEY;
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);

  // Calculate distance between two coordinates in meters using Haversine formula
  const calculateDistance = (latitude1: number, longitude1: number, latitude2: number, longitude2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const latitude1InRadians = latitude1 * Math.PI / 180;
    const latitude2InRadians = latitude2 * Math.PI / 180;
    const deltaLatitude = (latitude2 - latitude1) * Math.PI / 180;
    const deltaLongitude = (longitude2 - longitude1) * Math.PI / 180;

    const a = Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
      Math.cos(latitude1InRadians) * Math.cos(latitude2InRadians) *
      Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const handleUseCurrentLocation = async () => {
    setLoadingCurrentLocation(true);
    try {
      // Get fresh current location
      const { coords } = await Location.getCurrentPositionAsync({});
      const currentLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      // First, check if we're near a Concordia building
      let nearestBuilding: any = null;
      let minDistance = Infinity;

      buildings.forEach((building: any) => {
        if (building.labelCoord) {
          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            building.labelCoord.latitude,
            building.labelCoord.longitude
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestBuilding = building;
          }
        }
      });

      // If we're within 100 meters of a Concordia building, use it
      if (nearestBuilding && minDistance <= 100) {
        setStart({
          name: nearestBuilding.id,
          address: nearestBuilding.address || nearestBuilding.id,
          location: {
            lat: nearestBuilding.labelCoord.latitude,
            lng: nearestBuilding.labelCoord.longitude,
          },
        });
      } else {
        // Fall back to reverse geocoding
        const results = await Location.reverseGeocodeAsync({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });

        if (results && results.length > 0) {
          const location = results[0];
          const placeName = location.street || location.city || location.name || 'Current Location';
          const address = [
            location.street,
            location.city,
            location.region,
          ].filter(Boolean).join(', ');

          setStart({
            name: placeName,
            address: address || 'Current Location',
            location: {
              lat: currentLocation.latitude,
              lng: currentLocation.longitude,
            },
          });
        } else {
          // Fallback if reverse geocoding doesn't return results
          setStart({
            name: 'Current Location',
            address: `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`,
            location: {
              lat: currentLocation.latitude,
              lng: currentLocation.longitude,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error getting location name:', error);
      // If we can't get fresh location, try using the prop location as fallback
      if (userLocation) {
        setStart({
          name: 'Current Location',
          address: `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`,
          location: {
            lat: userLocation.latitude,
            lng: userLocation.longitude,
          },
        });
      }
    } finally {
      setLoadingCurrentLocation(false);
    }
  };

  useEffect(() => {
    const fetchDirections = async () => {
      if (start && destination) {

        if (!googleMapsApiKey) {
          return;
        }

        const params = new URLSearchParams({
          origin: `${start.location.lat},${start.location.lng}`,
          destination: `${destination.location.lat},${destination.location.lng}`,
          key: googleMapsApiKey,
          mode: GOOGLE_DIRECTIONS_MODE[transportMode],
        });

        const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;

        try {
          const response = await fetch(url);
          const data = await response.json();
          if (data.routes.length > 0) {
            setInstructions(data.routes[0].legs[0].steps);
            console.log(data.routes[0].legs[0].steps)
          }
        } catch (error) {
          console.error("Fetch failed", error);
        }
      }
    }
    fetchDirections();
  }, [start, destination, googleMapsApiKey, setInstructions, transportMode]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Start Building</Text>
      <View style={styles.selectorRow}>
        <View style={styles.selectorWrapper}>
          <BuildingSelector
            placeholder="Select start building"
            onSelect={data => setStart(data)}
            userLocation={userLocation}
            value={start?.name}
            testID="start-building-selector"
          />
        </View>
        {start && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setStart(null)}
            testID="clear-start-button"
          >
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      {start && (
        <Text style={styles.selectedText}>Selected: {start.name}</Text>
      )}
      {setMapSelectionTarget && (
        <TouchableOpacity
          style={[
            styles.selectOnMapButton,
            mapSelectionTarget === 'start' && styles.selectOnMapButtonActive,
          ]}
          onPress={() => setMapSelectionTarget(mapSelectionTarget === 'start' ? null : 'start')}
          testID="select-start-on-map"
        >
          <MaterialIcons name="map" size={18} color={mapSelectionTarget === 'start' ? '#fff' : '#912338'} />
          <Text style={[
            styles.selectOnMapText,
            mapSelectionTarget === 'start' && styles.selectOnMapTextActive,
          ]}>
            {mapSelectionTarget === 'start' ? 'Selecting on map...' : 'Select on Map'}
          </Text>
        </TouchableOpacity>
      )}

      {userLocation && (
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleUseCurrentLocation}
          disabled={loadingCurrentLocation}
        >
          {loadingCurrentLocation ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <>
              <MaterialIcons name="my-location" size={18} color="#007AFF" />
              <Text style={styles.currentLocationText}>Use Current Location</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <Text style={styles.label}>Destination Building</Text>
      <View style={styles.selectorRow}>
        <View style={styles.selectorWrapper}>
          <BuildingSelector
            placeholder="Select destination building"
            onSelect={data => setDestination(data)}
            userLocation={userLocation}
            value={destination?.name}
            testID="destination-building-selector"
          />
        </View>
        {destination && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setDestination(null)}
            testID="clear-destination-button"
          >
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      {destination && (
        <Text style={styles.selectedText}>Selected: {destination.name}</Text>
      )}
      {setMapSelectionTarget && (
        <TouchableOpacity
          style={[
            styles.selectOnMapButton,
            mapSelectionTarget === 'destination' && styles.selectOnMapButtonActive,
          ]}
          onPress={() => setMapSelectionTarget(mapSelectionTarget === 'destination' ? null : 'destination')}
          testID="select-destination-on-map"
        >
          <MaterialIcons name="map" size={18} color={mapSelectionTarget === 'destination' ? '#fff' : '#912338'} />
          <Text style={[
            styles.selectOnMapText,
            mapSelectionTarget === 'destination' && styles.selectOnMapTextActive,
          ]}>
            {mapSelectionTarget === 'destination' ? 'Selecting on map...' : 'Select on Map'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 15,
    marginBottom: 8,
    fontWeight: '600',
    color: '#1f1f1f',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
  currentLocationText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  selectorWrapper: {
    flex: 1,
  },
  selectedText: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  clearButton: {
    marginTop: 0,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3e3e3',
    borderRadius: 10,
    height: 44,
  },
  selectOnMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#912338',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 8,
    gap: 6,
  },
  selectOnMapButtonActive: {
    backgroundColor: '#912338',
    borderColor: '#912338',
  },
  selectOnMapText: {
    color: '#912338',
    fontSize: 13,
    fontWeight: '600',
  },
  selectOnMapTextActive: {
    color: '#fff',
  },
});

export default StartDestinationPicker;
