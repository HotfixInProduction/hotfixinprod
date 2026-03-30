import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Alert, StyleSheet, View, TouchableOpacity, Text, Animated, Modal, Linking, AppState, AppStateStatus, ScrollView } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import BuildingPolygon from '../components/BuildingPolygon';
import { useEffect, useRef, useState, useCallback } from 'react';
import StartDestinationPicker, { Place } from '../components/BuildingSelector/StartDestinationPicker';
import { MaterialIcons } from '@expo/vector-icons'
import BuildingInfo from '../components/BuildingInfo';
import FloorPlanViewer from '../components/FloorPlanViewer';
import Constants from "expo-constants";
import RouteInfo from '../components/RouteInfo';
import RouteInstructions from '../components/RouteInstructions';
import { useRouteProcessor } from '../hooks/useRouteProcessor';
import { usePOIState } from '../hooks/usePOIState';
import { RoutePolylineSteps } from '../components/RoutePolylineSteps';
import type { MapStep, TravelMode } from '../types/map';
import { useShuttleRouting } from '../hooks/useShuttleRouting';
import { RoomSelection, Building } from '../types/building';
import { buildings } from '../data/buildings';
import { outdoorPOIs } from '../data/outdoorPOI';
import type { OutdoorPOI } from '../data/outdoorPOI';
import POIInfoPanel from '../components/POIInfoPanel';
import POIFilter from '../components/POIFilter';
import NearestPOIBanner from '../components/NearestPOIBanner';
import { findNearestPOI } from '../utils/distanceUtils';
import { getPOICategoryIcon, getPOICategoryLabel, getPOICategoryColor } from '../utils/poiMarkerUtils';
import { useAppSettings } from '../hooks/useAppSettings';
import {
  CAMPUSES,
  INITIAL_REGION,
  SHUTTLE_SHERBROOKE_WAYPOINTS,
  getCoordinates,
  getPlaceName,
  type CampusKey,
} from '../models/MapRouting';
import MapViewDirections from 'react-native-maps-directions';
import { createPlaceFromUserLocation, createPlaceFromBuilding, createPlaceFromPOI } from '../utils/placeUtils';

import { useNavigationState } from '../hooks/useNavigationState';
import { useRoute } from '@react-navigation/native';
import type { ClassEvent, NextClassRouteParam } from '../types/calendar';

const GOOGLE_DIRECTIONS_MODE: Record<TravelMode, string> = {
  DRIVING: 'driving',
  WALKING: 'walking',
  BICYCLING: 'bicycling',
  TRANSIT: 'transit',
  SHUTTLE: 'shuttle'
};

export default function MapScreen() {
  const [directionsFloorPlan, setDirectionsFloorPlan] = useState<{
      building: Building;
      floor?: string;
  } | null>(null);
  const mapRef = useRef<MapView>(null);
  const [selectedCampus, setSelectedCampus] = useState<CampusKey>('downtown');
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buildingInfoSlideAnim = useRef(new Animated.Value(300)).current;
  const [locationStatus, setLocationStatus] = useState<Location.PermissionStatus | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [buildingSelectorVisible, setBuildingSelectorVisible] = useState(false);
  const buildingSelectorSlideAnim = useRef(new Animated.Value(-400)).current;
  const appState = useRef(AppState.currentState);
  const [start, setStart] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [instructions, setInstructions] = useState<MapStep[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [transportMode, setTransportMode] = useState<TravelMode>('DRIVING');
  const [currentDelta, setCurrentDelta] = useState(INITIAL_REGION.latitudeDelta);
  const [showShuttleSchedule, setShowShuttleSchedule] = useState(false);
  const [mapSelectionTarget, setMapSelectionTarget] = useState<'start' | 'destination' | null>(null);
  const [directionsGoogle, setDirectionsGoogle] = useState<any>(null);
  const processedSteps = useRouteProcessor(directionsGoogle);
  const googleMapsApiKey = Constants.expoConfig?.extra?.googleApiKey as string | undefined;
  const [enableRoomSelection, setEnableRoomSelection] = useState(false);
  const [showRoutePreview, setShowRoutePreview] = useState(false);
  const { settings } = useAppSettings();
  const route = useRoute<any>();
  const nextClassFromParams = route.params?.nextClass as NextClassRouteParam | undefined;
  const startFromCurrentLocation = route.params?.startFromCurrentLocation as boolean | undefined;
  
  // POI state
  const {
    selectedPOI,
    setSelectedPOI,
    showPOIFilter,
    setShowPOIFilter,
    poiFilters,
    setPoiFilters,
    nearestPOI,
    setNearestPOI,
    poiInfoSlideAnim,
  } = usePOIState();
  
  // Room selection state for cross-building persistence
  const [startRoomSelection, setStartRoomSelection] = useState<RoomSelection | null>(null);
  const [destinationRoomSelection, setDestinationRoomSelection] = useState<RoomSelection | null>(null);

  // Navigation state using custom hook
  const {
    navigationSteps,
    currentStepIndex,
    isNavigating,
    activeStep,
    handleStartNavigation,
    handleNextStep,
    handlePrevStep,
    handleExitNavigation,
  } = useNavigationState({
    transportMode,
    startRoomSelection,
    destinationRoomSelection,
    instructions,
    start,
    destination,
    googleMapsApiKey,
    onShowShuttleSchedule: () => setShowShuttleSchedule(true),
    onShowInstructions: () => setShowInstructions(true),
    onExit: () => {
      setShowRoutePreview(false);
      setBuildingSelectorVisible(true);
    },
    onRestoreRouteInfo: (routeInfo) => setRouteInfo(routeInfo),
  });

  // Helper function to find building by ID
  const findBuildingById = useCallback((buildingId: string) => {
    return buildings.find(b => b.id === buildingId);
  }, []);

  const isStartComplete = enableRoomSelection
      ? !!start && !!startRoomSelection?.buildingId && !!startRoomSelection?.floor && !!startRoomSelection?.room
      : !!start;

    const isDestinationComplete = enableRoomSelection
      ? !!destination && !!destinationRoomSelection?.buildingId && !!destinationRoomSelection?.floor && !!destinationRoomSelection?.room
      : !!destination;

  // Sync room selections to start/destination places for cross-building navigation
  useEffect(() => {
    if (startRoomSelection) {
      const building = findBuildingById(startRoomSelection.buildingId);
      if (building) {
        setStart(createPlaceFromBuilding(building));
      }
    }

    // Sync destination room selection
    if (destinationRoomSelection) {
      const destBuilding = findBuildingById(destinationRoomSelection.buildingId);
      if (destBuilding) {
        setDestination(createPlaceFromBuilding(destBuilding));
      }
    }
  }, [startRoomSelection, destinationRoomSelection, findBuildingById]);

  const {
    isShuttleRoute,
    shuttleData,
    shuttleRouteSegments,
    shuttleRouteInfo,
  } = useShuttleRouting({
    start,
    destination,
    transportMode,
    onTransportModeChange: setTransportMode,
  });
  useEffect(() => {
    if (shuttleRouteInfo) {
      setRouteInfo(shuttleRouteInfo);
    }
  }, [shuttleRouteInfo]);

  useEffect(() => {
    if (!isShuttleRoute) {
      setShowShuttleSchedule(false);
    }
  }, [isShuttleRoute]);

  const centerOnUser = async () => {
    try {
      const { coords } = await Location.getCurrentPositionAsync({});
      setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
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
    requestLocationPermission();
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

  useEffect(() => {
    setShowRoutePreview(false);
  }, [
    startRoomSelection,
    destinationRoomSelection,
    enableRoomSelection,
  ]);

  useEffect(() => {
    if (selectedBuilding) {
      Animated.spring(buildingInfoSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      Animated.timing(buildingInfoSlideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedBuilding]);

  useEffect(() => {
    if (buildingSelectorVisible) {
      Animated.spring(buildingSelectorSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      Animated.timing(buildingSelectorSlideAnim, {
        toValue: -400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [buildingSelectorVisible]);

  // Handle POI info panel animation
  useEffect(() => {
    if (selectedPOI) {
      Animated.spring(poiInfoSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      Animated.timing(poiInfoSlideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedPOI]);

  // Calculate nearest POI when user location changes
  useEffect(() => {
    const filteredPOIsForCampus = getFilteredPOIs();
    const poiRange = settings?.poiRangeMeters ?? 500;
    const nearest = findNearestPOI(userLocation, filteredPOIsForCampus, poiRange);
    if (nearest) {
      setNearestPOI(nearest as OutdoorPOI & { distance: number });
    } else {
      setNearestPOI(null);
    }
  }, [userLocation, selectedCampus, poiFilters, settings]);

  // auto-fit map to show both start and destination
  useEffect(() => {
    if (!mapRef.current) return;

    const startCoords = getCoordinates(start);
    const destCoords = getCoordinates(destination);

    // both start and destination are selected -> fit both
    if (startCoords && destCoords) {
      mapRef.current.fitToCoordinates(
        [startCoords, destCoords],
        {
          edgePadding: { top: 150, right: 60, bottom: 60, left: 60 },
          animated: true,
        }
      );
    }
    // only start is selected -> zoom to start
    else if (startCoords) {
      mapRef.current.animateToRegion({
        ...startCoords,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      }, 1000);
    }
    // only destination is selected -> zoom to destination
    else if (destCoords) {
      mapRef.current.animateToRegion({
        ...destCoords,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      }, 1000);
    }
  }, [start, destination]);

  useEffect(() => {
    const fetchDirections = async () => {
      if (transportMode === 'SHUTTLE') {
        setDirectionsGoogle(null);
        setInstructions([]);
        return;
      }

      if (!start || !destination || !googleMapsApiKey) return;

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
        if (data.routes.length === 0) return;

        setDirectionsGoogle(data);
        setInstructions(data.routes[0].legs[0].steps);
        setRouteInfo({
          distance: data.routes[0].legs[0].distance.value / 1000,
          duration: Math.ceil(data.routes[0].legs[0].duration.value / 60),
        });
      } catch (error) {
        console.error("Fetch failed", error);
      }
    };
    fetchDirections();
  }, [start, destination, googleMapsApiKey, setInstructions, transportMode]);


  const handleCloseBuilding = () => {
    Animated.timing(buildingInfoSlideAnim, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSelectedBuilding(null);
    });
  };

  const toggleBuildingSelector = () => {
    setBuildingSelectorVisible(!buildingSelectorVisible);
  };

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
    if (mapSelectionTarget) {
      const place: Place = {
        name: building.id,
        address: building.address || building.id,
        location: {
          lat: building.labelCoord.latitude,
          lng: building.labelCoord.longitude,
        },
      };
      if (mapSelectionTarget === 'start') {
        setStart(place);
      } else {
        setDestination(place);
      }
      setMapSelectionTarget(null);
      setBuildingSelectorVisible(true);
      return;
    }
    setSelectedBuilding(building);
    setShowFloorPlan(false);
  };

  const handleDirectionsError = useCallback((errorMessage: string) => {
    console.warn('MapViewDirections failed:', errorMessage);
    Alert.alert('Route Error', 'Unable to load the shuttle route.');
  }, []);

  const handleClearRoute = () => {
    setStart(null);
    setDestination(null);
    setRouteInfo(null);
    setInstructions([]);
    setShowInstructions(false);
    setDirectionsGoogle(null);
    setShowShuttleSchedule(false);
    setShowRoutePreview(false);
    mapRef.current?.animateToRegion(INITIAL_REGION, 1000);
  }
  // Helper function to get POIs for current campus and active filters
  const getFilteredPOIs = useCallback(() => {
    return outdoorPOIs.filter(
      poi => poi.campus === selectedCampus && poiFilters.has(poi.category)
    );
  }, [selectedCampus, poiFilters]);

  // Helper function to get POI color based on category
  const getPOIMarkerColor = useCallback((category: OutdoorPOI['category'], isNearest: boolean = false): string => {
    return getPOICategoryColor(category, isNearest);
  }, []);

  const handlePOISelect = useCallback((poi: OutdoorPOI) => {
    setSelectedPOI(poi);
  }, []);

  const handleClosePOI = useCallback(() => {
    setSelectedPOI(null);
  }, []);

  const handleSetPOIAsDestination = useCallback((poi: OutdoorPOI) => {
    if (!userLocation) return;

    setStart(createPlaceFromUserLocation(userLocation));
    setDestination(createPlaceFromPOI(poi));
    setShowRoutePreview(true);

    // Close POI panel
    setSelectedPOI(null);
  }, [userLocation]);

  const handleSetBuildingAsDestination = useCallback((destination: Place) => {
    if (!userLocation) return;

    setStart(createPlaceFromUserLocation(userLocation));
    setDestination(destination);
    setShowRoutePreview(true);

    // Close building panel
    setSelectedBuilding(null);
  }, [userLocation]);

  const activeModal = (() => {
    if (isNavigating) return 'navigation';
    if (selectedBuilding) return 'buildingInfo';
    if (showInstructions) return 'routeInstructions';
    if (showRoutePreview && routeInfo && isStartComplete && isDestinationComplete) return 'routeInfo';
    return 'none';
  })();
  const showCompactRouteHeader = activeModal === 'routeInfo' || activeModal === 'routeInstructions' || activeModal === 'navigation';

  const getFloorFromRoom = useCallback((room: string): string => {
    const trimmed = room.trim();
    return trimmed.length > 0 ? trimmed.charAt(0) : '';
  }, []);

  const findBuildingForClassEvent = useCallback((classEvent: NextClassRouteParam) => {
    const raw = classEvent.building?.trim() || classEvent.location?.trim();
    if (!raw) return undefined;

    const normalized = raw.toLowerCase();

    return buildings.find((b) => {
      const id = (b.id ?? '').trim().toLowerCase();
      const label = (b.label ?? '').trim().toLowerCase();

      return (
        id === normalized ||
        label === normalized ||
        normalized.startsWith(`${label}-`) ||
        normalized.startsWith(`${id.toLowerCase()} `)
      );
    });
  }, []);


const handleDirectionsToNextClass = useCallback((nextClass: NextClassRouteParam) => {
  if (!userLocation) {
    Alert.alert('Location needed', 'Please enable location to get directions to your next class.');
    return;
  }

  const building = findBuildingForClassEvent(nextClass);

  if (!building) {
    Alert.alert(
      'Building not found',
      `Could not match ${nextClass.building ?? nextClass.location ?? 'this class location'} to a campus building.`
    );
    return;
  }

  const floor = getFloorFromRoom(nextClass.room);

  console.log('Next class room routing:', {
    buildingId: building.id,
    floor,
    room: nextClass.room,
  });

  setInstructions([]);
  setRouteInfo(null);
  setDirectionsGoogle(null);
  setShowInstructions(false);
  setShowShuttleSchedule(false);

  setEnableRoomSelection(false);

  setStart(createPlaceFromUserLocation(userLocation));
  setStartRoomSelection(null);

  setDestination(createPlaceFromBuilding(building));

  const hasFloorPlanForFloor =
    !!building.floorPlans &&
    Object.prototype.hasOwnProperty.call(building.floorPlans, floor);

  if (floor && nextClass.room && hasFloorPlanForFloor) {
    setDestinationRoomSelection({
      buildingId: building.id,
      floor,
      room: nextClass.room,
    });
  } else {
    setDestinationRoomSelection(null);
  }

  setSelectedBuilding(null);
  setShowFloorPlan(false);

  setBuildingSelectorVisible(true);

  setShowRoutePreview(false);
}, [userLocation, findBuildingForClassEvent, getFloorFromRoom]);

    useEffect(() => {
      if (!nextClassFromParams || !startFromCurrentLocation || !userLocation) return;

      handleDirectionsToNextClass(nextClassFromParams);
    }, [
      nextClassFromParams,
      startFromCurrentLocation,
      userLocation,
      handleDirectionsToNextClass,
    ]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        testID="map"
        mapPadding={{ top: 100, right: 20, bottom: 0, left: 20 }}
        showsUserLocation
        showsMyLocationButton
        initialRegion={INITIAL_REGION}
        onRegionChangeComplete={(region) => setCurrentDelta(region.latitudeDelta)}
      >
        <BuildingPolygon
          onSelectBuilding={handleBuildingSelect}
          selectedBuildingId={selectedBuilding?.id || null}
          currentDelta={currentDelta}
          startBuildingId={start?.name || null}
          destinationBuildingId={destination?.name || null}
          disabled={selectedBuilding !== null || activeModal === 'routeInfo'}
        />

        {start && destination && googleMapsApiKey && (
          
          <RoutePolylineSteps processedSteps={processedSteps} />
        )}

        {shuttleRouteSegments && googleMapsApiKey && (
          <>
            <MapViewDirections
              key="map-directions-shuttle"
              origin={shuttleRouteSegments.originTerminal}
              destination={shuttleRouteSegments.destinationTerminal}
              waypoints={SHUTTLE_SHERBROOKE_WAYPOINTS}
              apikey={googleMapsApiKey}
              strokeWidth={4}
              strokeColor="#912338"
              mode="DRIVING"
              onError={handleDirectionsError}
            />

            {shuttleRouteSegments.startWalking && (
              <MapViewDirections
                key="map-directions-shuttle-start-walking"
                origin={shuttleRouteSegments.startWalking[0]}
                destination={shuttleRouteSegments.startWalking[1]}
                apikey={googleMapsApiKey}
                strokeWidth={3}
                strokeColor="#555"
                mode="WALKING"
                lineDashPattern={[8, 8]}
                onError={handleDirectionsError}
              />
            )}

            {shuttleRouteSegments.destinationWalking && (
              <MapViewDirections
                key="map-directions-shuttle-destination-walking"
                origin={shuttleRouteSegments.destinationWalking[0]}
                destination={shuttleRouteSegments.destinationWalking[1]}
                apikey={googleMapsApiKey}
                strokeWidth={3}
                strokeColor="#555"
                mode="WALKING"
                lineDashPattern={[8, 8]}
                onError={handleDirectionsError}
              />
            )}
          </>
        )}

        {/* POI Markers */}
        {getFilteredPOIs().map((poi) => {
          const isNearest = nearestPOI?.id === poi.id;
          const icon = getPOICategoryIcon(poi.category);
          const label = getPOICategoryLabel(poi.category);
          return (
            <Marker
              key={poi.id}
              coordinate={poi.coordinates}
              title={`${icon} ${poi.name}`}
              description={`${label}${isNearest ? ' - Nearest!' : ''}`}
              pinColor={getPOIMarkerColor(poi.category, isNearest)}
              onPress={() => handlePOISelect(poi)}
              testID={`poi-marker-${poi.id}`}
              opacity={1}
            />
          );
        })}

        {start && (
          <Marker coordinate={getCoordinates(start)!} title="Start" pinColor="blue" testID="start-marker" />
        )}

        {destination && (
          <Marker coordinate={getCoordinates(destination)!} title="Destination" pinColor="red" testID="destination-marker" />
        )}
      </MapView>
      
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']} testID="safe-area-view">
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
              testID="campus-selector-downtown"
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
              testID="campus-selector-loyola"
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

        {/* Nearest POI Banner */}
        {settings?.showNearestPOIBanner !== false &&
          !buildingSelectorVisible &&
          !showRoutePreview &&
          !showCompactRouteHeader &&
          !start &&
          !destination && (
            <NearestPOIBanner
              poi={nearestPOI}
              onPress={() => {
                if (nearestPOI) {
                  handlePOISelect(nearestPOI);
                }
              }}
            />
        )}

        {!showCompactRouteHeader && (
          <>
            <TouchableOpacity
              style={styles.buildingSelectorToggleButton}
              onPress={toggleBuildingSelector}
              activeOpacity={0.7}
              testID="building-selector-toggle"
            >
              <MaterialIcons
                name={buildingSelectorVisible ? 'close' : 'directions'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.poiFilterButton}
              onPress={() => setShowPOIFilter(true)}
              activeOpacity={0.7}
              testID="poi-filter-toggle"
            >
              <MaterialIcons name="filter-list" size={24} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>

      {showCompactRouteHeader ? (
        <View style={styles.compactRouteHeader} testID="compact-route-header">
          <Text style={styles.compactRouteLabel} numberOfLines={1}>
            {getPlaceName(start)}
          </Text>
          <MaterialIcons name="arrow-forward" size={16} color="#912338" />
          <Text style={styles.compactRouteLabel} numberOfLines={1}>
            {getPlaceName(destination)}
          </Text>
        </View>
      ) : (
        <Animated.View
          style={[
            styles.buildingSelectorPanel,
            {
              transform: [{ translateX: buildingSelectorSlideAnim }],
            },
          ]}
          pointerEvents={buildingSelectorVisible ? 'auto' : 'none'}
        >

          <StartDestinationPicker
            locations={{
              userLocation,
              start,
              destination,
              setStart,
              setDestination,
            }}
            route={{
              transportMode,
              setInstructions,
              setDirectionsGoogle,
              setRouteInfo,
            }}
            mapSelection={{
              target: mapSelectionTarget,
              setTarget: (target) => {
                setMapSelectionTarget(target);
                if (target) {
                  setBuildingSelectorVisible(false);
                }
              },
            }}
            roomSelection={{
              enabled: enableRoomSelection,
              setEnabled: setEnableRoomSelection,
              startSelection: startRoomSelection,
              setStartSelection: setStartRoomSelection,
              destinationSelection: destinationRoomSelection,
              setDestinationSelection: setDestinationRoomSelection,
            }}
            directionsAction={{
              canShow: isStartComplete && isDestinationComplete,
              onShow: () => setShowRoutePreview(true),
            }}
          />
        </Animated.View>
      )}

      {mapSelectionTarget && (
        <View style={styles.mapSelectionBanner} testID="map-selection-banner">
          <MaterialIcons name="touch-app" size={20} color="#fff" />
          <Text style={styles.mapSelectionBannerText}>
            Tap a building to set as {mapSelectionTarget === 'start' ? 'Start' : 'Destination'}
          </Text>
          <TouchableOpacity onPress={() => {
              setMapSelectionTarget(null);
              setBuildingSelectorVisible(true);
              }} testID="cancel-map-selection">
            <MaterialIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {showFloorPlan && (
        <FloorPlanViewer
          building={selectedBuilding}
          onClose={() => setShowFloorPlan(false)}
          startRoomSelection={startRoomSelection}
          destinationRoomSelection={destinationRoomSelection}
          onStartRoomChange={setStartRoomSelection}
          onDestinationRoomChange={setDestinationRoomSelection}
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

      {activeModal === 'buildingInfo' && (
        <Animated.View
          testID="building-info-container"
          style={{
            transform: [{ translateY: buildingInfoSlideAnim }],
          }}
          pointerEvents={selectedBuilding ? 'auto' : 'none'}
        >
          <BuildingInfo
            building={selectedBuilding}
            onClose={handleCloseBuilding}
            onViewFloorPlan={selectedBuilding?.floorPlans ? () => setShowFloorPlan(true) : undefined}
            onSetAsDestination={handleSetBuildingAsDestination}
            hasUserLocation={userLocation !== null}
          />
        </Animated.View>
      )}

      {activeModal === 'routeInstructions' && (
        <RouteInstructions
          instructions={instructions}
          start={start}
          destination={destination}
          onClose={() => setShowInstructions(false)}
          onViewFloorPlan={(buildingId, floor) => {
            const building = buildings.find(b => b.id === buildingId);

            if (!building) return;
            setDirectionsFloorPlan({ building, floor });
          }}
        />
      )}

      {activeModal === 'routeInfo' && routeInfo && (
        <View testID="route-info-container"> 
        <RouteInfo
          duration={routeInfo.duration}
          distance={routeInfo.distance}
          mode={transportMode}
          onModeChange={setTransportMode}
          allowShuttleMode={isShuttleRoute}
          shuttleInfo={transportMode === 'SHUTTLE' && shuttleData ? {
            nextDepartureInMinutes: shuttleData.nextDepartureInMinutes,
            nextDepartureTimeLabel: shuttleData.nextDepartureTimeLabel,
          } : null}
          onOpenShuttleSchedule={() => setShowShuttleSchedule(true)}
          onStart={handleStartNavigation}
          onClose={handleClearRoute}
        />
        </View>
      )}

      {/* RouteInstructions during navigation (both indoor and outdoor steps) */}
      {isNavigating && (
        <RouteInstructions
          instructions={instructions}
          start={start}
          destination={destination}
          onClose={handleExitNavigation}
          onViewFloorPlan={(buildingId, floor) => {
            const building = buildings.find(b => b.id === buildingId);
            if (!building) return;
            setDirectionsFloorPlan({ building, floor });
          }}
          navigationMode={activeStep?.type === 'outdoor' ? 'outdoor' : 'indoor'}
          navigationInstruction={activeStep?.type === 'indoor' ? (activeStep).instruction : undefined}
          onNextStep={handleNextStep}
          onPrevStep={handlePrevStep}
          isFirstStep={currentStepIndex === 0}
          isLastStep={currentStepIndex === navigationSteps.length - 1}
        />
      )}

      {/* Active Navigation Indoor FloorPlanViewer */}
      {activeStep?.type === 'indoor' && (
        <FloorPlanViewer
          building={findBuildingById((activeStep).buildingId) || selectedBuilding}
          onClose={handleExitNavigation}
          startRoomSelection={startRoomSelection}
          destinationRoomSelection={destinationRoomSelection}
          onStartRoomChange={setStartRoomSelection}
          onDestinationRoomChange={setDestinationRoomSelection}
          activeNavigationStep={activeStep}
          onNextStep={handleNextStep}
          onPrevStep={handlePrevStep}
          onExitNavigation={handleExitNavigation}
          isFirstStep={currentStepIndex === 0}
          isLastStep={currentStepIndex === navigationSteps.length - 1}
        />
      )}

      {/* Outdoor navigation controls are now in RouteInstructions */}

      <Modal
        visible={showShuttleSchedule && Boolean(shuttleData)}
        transparent
        animationType="fade"
        testID="shuttle-schedule-modal"
        onRequestClose={() => setShowShuttleSchedule(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.shuttleCard}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="airport-shuttle" size={24} color="#912338" />
              <Text style={styles.modalTitle}>Shuttle Schedule</Text>
            </View>
            {shuttleData && (
              <>
                <Text style={styles.shuttleDirectionText}>{shuttleData.directionLabel}</Text>
                {shuttleData.nextDepartureInMinutes > 60 ? (
                  <Text style={styles.shuttleNextText}>No more shuttle departures today</Text>
                ) : (
                  <Text style={styles.shuttleNextText}>
                    Next shuttle in {shuttleData.nextDepartureInMinutes} min ({shuttleData.nextDepartureTimeLabel})
                  </Text>
                )}
                {shuttleData.serviceResumesNextWeekday && (
                  <Text style={styles.shuttleServiceResumeText}>
                    Service has ended for today. Resumes next weekday at {shuttleData.nextDepartureTimeLabel}.
                  </Text>
                )}
                <Text style={styles.shuttleServiceText}>Monday – Thursday only</Text>

                {shuttleData.loyScheduleLabels.length > 0 ? (
                  <>
                    <View style={styles.scheduleTableHeader}>
                      <Text style={styles.scheduleTableHeaderCell}>Loyola departures</Text>
                      <Text style={styles.scheduleTableHeaderCell}>SGW departures</Text>
                    </View>
                    <ScrollView style={styles.scheduleTable} contentContainerStyle={styles.scheduleTableContent}>
                      {shuttleData.loyScheduleLabels.map((loyTime, idx) => {
                        const sgwTime = shuttleData.sgwScheduleLabels[idx] ?? '';
                        const rowKey = `${loyTime}-${sgwTime}`;
                        const isLast = idx === shuttleData.loyScheduleLabels.length - 1;
                        return (
                          <View key={rowKey} style={[styles.scheduleTableRow, idx % 2 === 1 && styles.scheduleTableRowAlt]}>
                            <Text style={[styles.scheduleTableCell, isLast && styles.scheduleTableCellLast]}>
                              {loyTime}{isLast ? ' *' : ''}
                            </Text>
                            <Text style={[styles.scheduleTableCell, isLast && styles.scheduleTableCellLast]}>
                              {sgwTime}{isLast ? ' *' : ''}
                            </Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                    <Text style={styles.scheduleLastBusNote}>* Last bus / Dernier départ</Text>
                  </>
                ) : (
                  <Text style={styles.shuttleServiceResumeText}>
                    No service today. Resumes next weekday.
                  </Text>
                )}
              </>
            )}
            <TouchableOpacity
              style={[styles.modalButton, styles.primaryButton]}
              onPress={() => setShowShuttleSchedule(false)}
            >
              <Text style={styles.primaryButtonText}>Close schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* POI Info Panel */}
      <POIInfoPanel
        poi={selectedPOI}
        onClose={handleClosePOI}
        slideAnim={poiInfoSlideAnim}
        isVisible={selectedPOI !== null}
        onSetAsDestination={handleSetPOIAsDestination}
        hasUserLocation={userLocation !== null}
      />

      {/* POI Filter Modal */}
      <POIFilter
        visible={showPOIFilter}
        onClose={() => setShowPOIFilter(false)}
        selectedFilters={poiFilters}
        onFilterChange={setPoiFilters}
      />

      <StatusBar style="auto" />

      {directionsFloorPlan && (
            <FloorPlanViewer
              building={directionsFloorPlan.building}
              floorLevel={directionsFloorPlan.floor}
              onClose={() => setDirectionsFloorPlan(null)}
            />
          )}

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
    position: 'absolute',
    top: 55,
    left: 70, // Adjusted to align horizontally with the toggle button
    alignItems: 'center',
    paddingTop: 0,
    zIndex: 10,
  },
  buildingSelectorToggleButton: {
    position: 'absolute',
    left: 10, // Adjusted to align horizontally with the campus selector
    top: 55, // Same vertical alignment as campus selector
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
    zIndex: 10,
  },
  poiFilterButton: {
    position: 'absolute',
    right: 10,
    top: 55,
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
    zIndex: 10,
  },
  mapSelectionBanner: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#912338',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 20,
  },
  mapSelectionBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buildingSelectorPanel: {
    position: 'absolute',
    left: 10,
    top: 110,
    marginTop: 0,
    width: 350,
    maxWidth: '85%',
    zIndex: 9,
  },
  compactRouteHeader: {
    position: 'absolute',
    top: 115,
    left: 10,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    columnGap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  compactRouteLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#912338',
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
    bottom: 90,
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
  shuttleCard: {
    width: '100%',
    maxHeight: '85%',
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
  shuttleDirectionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 6,
  },
  shuttleNextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#912338',
    marginBottom: 4,
  },
  shuttleServiceText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
  },
  shuttleServiceResumeText: {
    fontSize: 13,
    color: '#6a3f45',
    marginBottom: 8,
  },
  shuttleSectionTitle: {
    marginTop: 8,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#912338',
  },
  scheduleTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#912338',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  scheduleTableHeaderCell: {
    flex: 1,
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  scheduleTable: {
    maxHeight: 220,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#f0d9de',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  scheduleTableContent: {
    paddingBottom: 4,
  },
  scheduleTableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  scheduleTableRowAlt: {
    backgroundColor: '#fff9fa',
  },
  scheduleTableCell: {
    flex: 1,
    fontSize: 13,
    color: '#1f1f1f',
    fontWeight: '600',
    textAlign: 'center',
  },
  scheduleTableCellLast: {
    color: '#912338',
  },
  scheduleLastBusNote: {
    fontSize: 11,
    color: '#6a3f45',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
});
