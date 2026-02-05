import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Alert, StyleSheet, View, TouchableOpacity, Text, Animated, Modal, Linking, AppState, AppStateStatus } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import BuildingPolygon from './src/components/BuildingPolygon';
import { useEffect, useRef, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons'
import BuildingInfo from './src/components/BuildingInfo';
import FloorPlanViewer from './src/components/FloorPlanViewer';

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
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [locationStatus, setLocationStatus] = useState<Location.PermissionStatus | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const appState = useRef(AppState.currentState);

  const centerOnUser = async () => {
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
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationStatus(status);

    if (status === 'granted') {
      setShowLocationModal(false);
      await centerOnUser();
      return true;
    }

    Alert.alert(
      'Location needed',
      'Please allow location so we can show where you are on the map.'
    );
    return false;
  };

  useEffect(() => {
    // Request foreground location permission on app load so iOS/Android show the system prompt.
    (async () => {
      await requestLocationPermission();
    })();
  }, []);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const { status } = await Location.getForegroundPermissionsAsync();
        setLocationStatus(status);

        if (status === 'granted') {
          setShowLocationModal(false);
          centerOnUser();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
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

  const handleBuildingSelect = (building: any) => {
    setSelectedBuilding(building);

    if (building?.floorPlans) {
      setShowFloorPlan(true);
    } else {
      setShowFloorPlan(false);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        mapPadding={{ top: 100, right: 20, bottom: 0, left: 20 }}
        showsUserLocation
        showsMyLocationButton
        initialRegion={INITIAL_REGION}
      >
      <BuildingPolygon onSelectBuilding={handleBuildingSelect} />
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

      <BuildingInfo building={selectedBuilding} onClose={() => setSelectedBuilding(null)} />

      {showFloorPlan && (
        <FloorPlanViewer
          building={selectedBuilding}
          floorLevel='8'
          onClose={() => setShowFloorPlan(false)}
        />
      )}

      {locationStatus === 'denied' && (
        <TouchableOpacity
          style={styles.locationOffButton}
          onPress={() => setShowLocationModal(true)}
          accessibilityLabel="Location permission off"
          testID="location-off-button"
        >
          <MaterialIcons name="location-off" size={26} color="#fff" />
        </TouchableOpacity>
      )}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="fade"
        testID="location-modal"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="location-off" size={24} color="#912338" />
              <Text style={styles.modalTitle}>Location is off</Text>
            </View>
            <Text style={styles.modalBody}>
              Turn on location to show your position on the map and recenter quickly.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={requestLocationPermission}
                testID="request-permission-button"
              >
                <Text style={styles.primaryButtonText}>Turn on location</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowLocationModal(false);
                  Linking.openSettings();
                }}
                testID="open-settings-button"
              >
                <Text style={styles.secondaryButtonText}>Open settings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowLocationModal(false)}
              >
                <Text style={styles.secondaryButtonText}>Not now</Text>
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
    paddingTop: 28,
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
  locationOffButton: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    backgroundColor: '#912338',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  modalBody: {
    fontSize: 15,
    color: '#444',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalActions: {
    rowGap: 10,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e3e3e3',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#912338',
    borderColor: '#912338',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#3d3d3d',
    fontWeight: '600',
  },
});
