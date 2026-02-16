import React, {useState} from 'react';
import { StyleSheet } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';

type BuildingSelectorProps = {
  placeholder: string;
  onSelect: (place: {
    name: string;
    address: string;
    location: { lat: number; lng: number };
  }) => void;
  userLocation: { latitude: number; longitude: number } | null;
};

const BuildingSelector: React.FC<BuildingSelectorProps> = ({ placeholder, onSelect, userLocation }) => {
  const apiKey = Constants.expoConfig?.extra?.googleApiKey;
  
  console.log('BuildingSelector - API Key exists:', !!apiKey);
  
  const queryConfig: any = {
    key: apiKey,
    language: 'en',
    types: 'establishment', // This helps get buildings/places
  };

  // Add location-based filtering if user location is available
  // Restrict suggestions to places within 50km radius
  if (userLocation) {
    queryConfig.location = `${userLocation.latitude},${userLocation.longitude}`;
    queryConfig.radius = 50000; // 50km in meters
    queryConfig.strictbounds = true; // Enforce strict boundary restrictions
  }

  return (
    <GooglePlacesAutocomplete
      placeholder={placeholder}
      fetchDetails={true}
      requestUrl={{
        useOnPlatform: 'all',
        url: 'https://maps.googleapis.com/maps/api',
      }}
      onFail={(error) => {
          console.error('Places API error:', error);
          console.error('API Key present:', !!apiKey);
        }}
      onPress={(data, details = null) => {
        if (!details) {
          console.warn('No details returned from Places API');
          return;
        }
        const place = {
          name: data.structured_formatting.main_text,
          address: details.formatted_address || '',
          location: details.geometry?.location || { lat: 0, lng: 0 },
        };
        console.log('Creating place object:', place);
        onSelect(place);
      }}
      query={queryConfig}
      styles={autocompleteStyles}
      debounce={300}
      enablePoweredByContainer={false}
      listViewDisplayed="auto"
      keepResultsAfterBlur={false}
      minLength={2}
      suppressDefaultStyles={false}
    />
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

export default BuildingSelector;
