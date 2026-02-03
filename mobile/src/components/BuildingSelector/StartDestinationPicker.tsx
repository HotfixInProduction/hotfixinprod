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
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '500',
  },
  selected: {
    marginBottom: 12,
    color: '#555',
  },
});

export default StartDestinationPicker;
