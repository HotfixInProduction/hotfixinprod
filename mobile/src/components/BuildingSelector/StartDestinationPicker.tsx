import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BuildingSelector from './BuildingSelector';

type Place = {
  name: string;
  address: string;
  location: { lat: number; lng: number };
};

const StartDestinationPicker: React.FC = () => {
  const [start, setStart] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);


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
      <BuildingSelector placeholder="Select start building" onSelect={setStart} />
      {start && <Text style={styles.selected}>Selected: {start.name}</Text>}

      <Text style={styles.label}>Destination Building</Text>
      <BuildingSelector placeholder="Select destination building" onSelect={setDestination} />
      {destination && <Text style={styles.selected}>Selected: {destination.name}</Text>}
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
