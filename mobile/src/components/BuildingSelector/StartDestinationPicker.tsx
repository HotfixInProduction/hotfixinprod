import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import BuildingSelector from './BuildingSelector';
import * as Location from 'expo-location';
import { buildings } from '../../data/buildings';

type Place = {
  name: string;
  address: string;
  location: { lat: number; lng: number };
};

type StartDestinationPickerProps = {
  userLocation: { latitude: number; longitude: number } | null;
};

const StartDestinationPicker: React.FC<StartDestinationPickerProps> = ({ userLocation }) => {
  const [start, setStart] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);

  // Calculate distance between two coordinates in meters using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
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
      if (start) {
        console.log('Start building selected:', start);
      }
    }, [start]);


    useEffect(() => {
      if (destination) {
        console.log('Destination building selected:', destination);
      }
    }, [destination]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Start Building</Text>
      <View style={styles.selectorRow}>
        <View style={styles.selectorWrapper}>
          <BuildingSelector 
            placeholder="Select start building" 
            onSelect={setStart} 
            userLocation={userLocation}
            value={start?.name}
          />
        </View>
        {start && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setStart(null)}
          >
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      {start && (
        <Text style={styles.selectedText}>Selected: {start.name}</Text>
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
            onSelect={setDestination} 
            userLocation={userLocation}
            value={destination?.name}
          />
        </View>
        {destination && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setDestination(null)}
          >
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      {destination && (
        <Text style={styles.selectedText}>Selected: {destination.name}</Text>
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
});

export default StartDestinationPicker;
