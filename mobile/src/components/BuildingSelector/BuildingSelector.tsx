import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import { buildings } from '../../data/buildings';
import type { Building } from '../../types/building';

type BuildingSelectorProps = {
  placeholder: string;
  onSelect: (place: {
    name: string;
    address: string;
    location: { lat: number; lng: number };
  }) => void;
  userLocation: { latitude: number; longitude: number } | null;
  value?: string;
  testID?: string;
};

const BuildingSelector: React.FC<BuildingSelectorProps> = ({ placeholder, onSelect, userLocation, value, testID }) => {
  const ref = useRef<GooglePlacesAutocompleteRef>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocalResults, setShowLocalResults] = useState(false);

  // Filter buildings based on search query
  const getMatchingBuildings = (query: string): Building[] => {
    if (!query.trim()) {
      return [];
    }
    const lowerQuery = query.toLowerCase();
    return buildings.filter(building => 
      building.id.toLowerCase().includes(lowerQuery) ||
      building.label.toLowerCase().includes(lowerQuery) ||
      (building.address && building.address.toLowerCase().includes(lowerQuery))
    );
  };

  const matchingBuildings = getMatchingBuildings(searchQuery);

  const handleLocalBuildingSelect = (building: Building) => {
    const place = {
      name: building.id,
      address: building.address || building.id,
      location: {
        lat: building.labelCoord.latitude,
        lng: building.labelCoord.longitude,
      },
    };
    console.log('Selected local building:', place);
    onSelect(place);
    setShowLocalResults(false);
    setSearchQuery('');
    if (ref.current) {
      ref.current.setAddressText(building.id);
      // Blur the input to dismiss Google dropdown
      ref.current.blur?.();
    }
  };

  const queryConfig: any = {
    key: Constants.expoConfig?.extra?.googleApiKey,
    language: 'en',
  };

  // Add location-based filtering if user location is available
  // Restrict suggestions to places within 50km radius
  if (userLocation) {
    queryConfig.location = `${userLocation.latitude},${userLocation.longitude}`;
    queryConfig.radius = 50000; // 50km in meters
    queryConfig.strictbounds = true; // Enforce strict boundary restrictions
  }

  useEffect(() => {
    if (ref.current) {
      if (value) {
        ref.current?.setAddressText(value);
      } else {
        ref.current?.setAddressText('');
      }
    }
  }, [value]);

  return (
    <View testID={testID ? `${testID}-container` : undefined} style={styles.mainContainer}>
      {/* Local building results overlay */}
      {showLocalResults && matchingBuildings.length > 0 && (
        <ScrollView 
          style={styles.localResultsContainer}
          scrollEnabled={true}
          nestedScrollEnabled={true}
        >
          {matchingBuildings.map((building) => (
            <TouchableOpacity
              key={building.id}
              style={styles.localResultItem}
              onPress={() => handleLocalBuildingSelect(building)}
              testID={`local-building-result-${building.id}`}
            >
              <View style={styles.localResultDotIndicator} />
              <View style={styles.localResultContent}>
                <Text style={styles.localResultLabel}>{building.label}</Text>
                <Text style={styles.localResultName}>{building.id}</Text>
                {building.address && (
                  <Text style={styles.localResultAddress}>{building.address}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      <GooglePlacesAutocomplete
        ref={ref}
        placeholder={placeholder}
        fetchDetails={true}
        onFail={(error) => {
          console.log('Places API error:', error);
        }}
        onPress={(data, details = null) => {
          if (!details) return;
          const place = {
            name: data.structured_formatting.main_text,
            address: details.formatted_address || '',
            location: details.geometry?.location || { lat: 0, lng: 0 },
          };
          console.log('Creating place object:', place);
          setShowLocalResults(false);
          onSelect(place);
        }}
        renderRow={(data) => (
          <Text testID="search-result-item" style={{ fontSize: 15, color: '#333', paddingVertical: 10, paddingHorizontal: 15 }}>
            {data.description}
          </Text>
        )}
        query={queryConfig}
        keepResultsAfterBlur={false}
        styles={autocompleteStyles}
        debounce={300}
        textInputProps={{
          testID: testID,
          onChangeText: (text) => {
            setSearchQuery(text);
            setShowLocalResults(text.trim().length > 0);
          },
        }}
      />
    </View>
  );
};

const autocompleteStyles = StyleSheet.create({
  textInputContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 10,
  },
  textInput: {
    height: 44,
    color: '#1f1f1f',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e3e3e3',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  listView: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 4,
  },
});

const styles = StyleSheet.create({
  ...autocompleteStyles,
  mainContainer: {
    // Removed flex: 1 to prevent expanding beyond content
  },
  localResultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e3e3e3',
    maxHeight: 250,
    marginTop: 4,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  localResultItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  localResultDotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginTop: 6,
    marginRight: 12,
    flexShrink: 0,
  },
  localResultContent: {
    flex: 1,
  },
  localResultLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
    marginBottom: 2,
  },
  localResultName: {
    fontSize: 15,
    color: '#1f1f1f',
    fontWeight: '600',
    marginBottom: 3,
  },
  localResultAddress: {
    fontSize: 12,
    color: '#666',
  },
});

export default BuildingSelector;
