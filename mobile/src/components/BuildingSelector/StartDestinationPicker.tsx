import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BuildingSelector from './BuildingSelector';
import Config from "react-native-config";

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
  setConfirmRoute: (val: boolean) => void;
  setInstructions: (val: any[]) => void;
};

const StartDestinationPicker: React.FC<StartDestinationPickerProps> = ({ userLocation, start, destination, setStart, setDestination, setConfirmRoute, setInstructions }) => {

  useEffect(() => {
    const fetchDirections = async () => {
      if (start && destination) {

        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.location.lat},${start.location.lng}&destination=${destination.location.lat},${destination.location.lng}&key=${Config.GOOGLE_MAPS_ANDROID_API_KEY}`;

        try {
          const response = await fetch(url);
          const data = await response.json();
          if (data.routes.length > 0) {
            setInstructions(data.routes[0].legs[0].steps);
            console.log(data.routes[0].legs[0].steps)
            setConfirmRoute(true);
          }
        } catch (error) {
          console.error("Fetch failed", error);
        }
      } else {
        setConfirmRoute(false);
      }
    }
    fetchDirections();
  }, [start, destination]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Start Building</Text>
      <BuildingSelector placeholder="Select start building" onSelect={data => setStart(data)} userLocation={userLocation} value={start ? start.name : ''} />
      <Text style={styles.label}>Destination Building</Text>
      <BuildingSelector placeholder="Select destination building" onSelect={data => setDestination(data)} userLocation={userLocation} value={destination ? destination.name : ''} />
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
  selected: {
    marginBottom: 12,
    marginTop: 4,
    color: '#666',
    fontSize: 13,
  },
});

export default StartDestinationPicker;
