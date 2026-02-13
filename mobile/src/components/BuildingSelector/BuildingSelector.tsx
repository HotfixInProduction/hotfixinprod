import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';

type BuildingSelectorProps = {
  placeholder: string;
  onSelect: (place: {
    name: string;
    address: string;
    location: { lat: number; lng: number };
  }) => void;
  userLocation: { latitude: number; longitude: number } | null;
  value: string; // Add value prop to control input text 
};

const BuildingSelector: React.FC<BuildingSelectorProps> = ({ placeholder, onSelect, userLocation, value }) => {
  const ref = useRef<GooglePlacesAutocompleteRef>(null);

  useEffect(() => {
    if (!value && ref.current) {
      ref.current.setAddressText(''); // Clear input when value is reset
      ref.current.clear();
    }
  }, [value]);

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

  return (
    <GooglePlacesAutocomplete
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
        onSelect(place);
      }}
      query={queryConfig}
      styles={autocompleteStyles}
      debounce={300}
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
