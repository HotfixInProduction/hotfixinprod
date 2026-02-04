import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Alert, StyleSheet, View, TouchableOpacity, Text, Animated, TextInput, Modal, ScrollView, FlatList } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import BuildingPolygon from './src/components/BuildingPolygon';
import { buildings } from './src/data/buildings';
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
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [manualLocation, setManualLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBuildings, setFilteredBuildings] = useState<typeof buildings>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

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

  const handleMapPress = (e: any) => {
    // Map press disabled - only building search allowed
    return;
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredBuildings([]);
    } else {
      const filtered = buildings.filter(building =>
        building.id.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredBuildings(filtered);
    }
  };

  const handleSelectBuilding = (building: typeof buildings[0]) => {
    // Calculate center of building from coordinates
    const coords = building.coordinates;
    const centerLat = coords.reduce((sum, c) => sum + c.latitude, 0) / coords.length;
    const centerLng = coords.reduce((sum, c) => sum + c.longitude, 0) / coords.length;
    
    setManualLocation({ latitude: centerLat, longitude: centerLng });
    setSelectedBuilding(building.id);
    setSearchQuery(building.id);
    setFilteredBuildings([]);
    
    // Animate map to building
    mapRef.current?.animateToRegion({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: 0.002,
      longitudeDelta: 0.002,
    }, 500);
  };

  const handleSetLocation = () => {
    if (!manualLocation) {
      Alert.alert('No Location', 'Please tap on the map or select a building first');
      return;
    }
    setShowLocationModal(false);
  };

  const handleClearLocation = () => {
    setManualLocation(null);
    setSelectedBuilding(null);
    setSearchQuery('');
    setFilteredBuildings([]);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapPadding={{ top: 100, right: 20, bottom: 0, left: 20 }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        initialRegion={INITIAL_REGION}
        onPress={handleMapPress}
      >
        <BuildingPolygon />
        {manualLocation && (
          <>
            <Circle
              center={manualLocation}
              radius={30}
              fillColor="rgba(66, 133, 244, 0.3)"
              strokeColor="rgba(66, 133, 244, 0.7)"
              strokeWidth={2}
            />
            <Marker
              coordinate={manualLocation}
              title="Your Location"
            >
              <View style={styles.blueCircleMarker} />
            </Marker>
          </>
        )}
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
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowLocationModal(true)}
          >
            <Text style={styles.buttonText}>📍 Set Location</Text>
          </TouchableOpacity>
          {manualLocation && (
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClearLocation}
            >
              <Text style={styles.buttonText}>✕ Clear Location</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
      
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowLocationModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Your Location</Text>
            <Text style={styles.modalSubtitle}>Search for a building</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Search Building</Text>
              <TextInput
                style={styles.input}
                placeholder="Search (e.g., Hall, JMSB, etc.)"
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholderTextColor="#999"
              />
            </View>

            {filteredBuildings.length > 0 && (
              <View style={styles.buildingListContainer}>
                <FlatList
                  data={filteredBuildings}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.buildingItem,
                        selectedBuilding === item.id && styles.buildingItemSelected
                      ]}
                      onPress={() => handleSelectBuilding(item)}
                    >
                      <Text style={[
                        styles.buildingItemText,
                        selectedBuilding === item.id && styles.buildingItemTextSelected
                      ]}>
                        {item.id}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {manualLocation && (
              <View style={styles.locationInfo}>
                <Text style={styles.locationInfoText}>
                  📍 Location set at {selectedBuilding}
                </Text>
                <Text style={styles.coordinatesText}>
                  {manualLocation.latitude.toFixed(4)}, {manualLocation.longitude.toFixed(4)}
                </Text>
              </View>
            )}

            <View style={styles.modalButtonGroup}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLocationModal(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, !manualLocation && styles.confirmButtonDisabled]}
                onPress={handleSetLocation}
                disabled={!manualLocation}
              >
                <Text style={[styles.modalButtonText, styles.confirmButtonText]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  button: {
    backgroundColor: 'rgba(145, 35, 56, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clearButton: {
    backgroundColor: 'rgba(200, 50, 50, 0.9)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  blueCircleMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  methodButton: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  methodButtonEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  methodButtonText: {
    flex: 1,
  },
  methodButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  methodButtonDescription: {
    fontSize: 13,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  instructionBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  instructionText: {
    fontSize: 14,
    color: '#0D47A1',
    fontWeight: '500',
  },
  mapSelectionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
  },
  instructionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  locationInfoCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  mapSelectionButtonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  buildingListContainer: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 200,
  },
  buildingItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#F9F9F9',
  },
  buildingItemSelected: {
    backgroundColor: '#912338',
  },
  buildingItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  buildingItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  locationInfo: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  locationInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#558B2F',
  },
  modalButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#912338',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCC',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  confirmButtonText: {
    color: '#FFFFFF',
  },
});
