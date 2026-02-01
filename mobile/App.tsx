import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Alert, StyleSheet, View, TouchableOpacity, Text, Animated} from 'react-native';
import MapView from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import BuildingPolygon from './src/components/BuildingPolygon';
import { useEffect, useRef, useState } from 'react';

const INITIAL_REGION = {
  latitude: 45.497,
  longitude: -73.579,
  latitudeDelta: 0.004,
  longitudeDelta: 0.004,
};

const CAMPUSES = {
  downtown: {
    name: 'Downtown',
    latitude: 45.4972,
    longitude: -73.5789,
    latitudeDelta: 0.004,
    longitudeDelta: 0.004,
  },
  loyola: {
    name: 'Loyola',
    latitude: 45.4582,
    longitude: -73.6402,
    latitudeDelta: 0.004,
    longitudeDelta: 0.004,
  },
};

type CampusKey = keyof typeof CAMPUSES;

export default function App() {
  const mapRef = useRef<MapView>(null);
  const [selectedCampus, setSelectedCampus] = useState<CampusKey>('downtown');
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Request foreground location permission on app load so iOS/Android show the system prompt.
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location needed',
          'Please allow location so we can show where you are on the map.'
        );
        return;
      }

      try {
        const { coords } = await Location.getCurrentPositionAsync({});
        mapRef.current?.animateToRegion(
          {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          600
        );
      } catch (error) {
        // Location retrieval failed (timeout, services disabled, etc.)
        // App continues to work with default map view
        console.warn('Failed to get current location:', error);
      }
    })();
  }, []);

  const handleCampusChange = (campusKey: CampusKey) => {
    setSelectedCampus(campusKey);
    
    // Animate slider
    Animated.spring(slideAnim, {
      toValue: campusKey === 'downtown' ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    // Animate map
    const campus = CAMPUSES[campusKey];
    mapRef.current?.animateToRegion({
      latitude: campus.latitude,
      longitude: campus.longitude,
      latitudeDelta: campus.latitudeDelta,
      longitudeDelta: campus.longitudeDelta,
    }, 500);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapPadding={{ top: 100, right: 20, bottom: 0, left: 20 }}
        showsUserLocation
        showsMyLocationButton
        initialRegion={INITIAL_REGION}
      >
        <BuildingPolygon onSelectBuilding={setSelectedBuilding} />
      </MapView>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.campusSelectorContainer}>
          <View style={styles.campusSelector}>
            <Animated.View
              style={[
                styles.sliderPill,
                {
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 136],
                      }),
                    },
                  ],
                },
              ]}
            />
            <TouchableOpacity
              style={styles.campusOption}
              onPress={() => handleCampusChange('downtown')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.campusText,
                selectedCampus === 'downtown' && styles.campusTextActive
              ]}>
                Downtown
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.campusOption}
              onPress={() => handleCampusChange('loyola')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.campusText,
                selectedCampus === 'loyola' && styles.campusTextActive
              ]}>
                Loyola
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {selectedBuilding && (
        <View style={styles.buildingModal}>

          <Text style={styles.buildingTitle}>{selectedBuilding.id}</Text>
          <Text style={styles.buildingAddress}>{selectedBuilding.address}</Text>

          <TouchableOpacity style={{position:'absolute', right: 20, top:10}} onPress={() => setSelectedBuilding(null)} activeOpacity={0.7}>
            <Text style={{ marginTop: 10}}>X</Text>
          </TouchableOpacity>
        </View>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  safeArea: {
    position: 'absolute',
    width: '100%',
    pointerEvents: 'box-none',
  },
  campusSelectorContainer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  campusSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sliderPill: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    width: 136,
    backgroundColor: '#912338',
    borderRadius: 20,
    shadowColor: '#912338',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  campusOption: {
    width: 136,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  campusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    zIndex: 1,
  },
  campusTextActive: {
    color: '#FFFFFF',
  },
  buildingModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  buildingTitle: {
    fontSize: 18,
  },
  buildingAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  }
});
