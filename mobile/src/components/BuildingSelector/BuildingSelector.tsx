import React, {useState} from 'react';
import { StyleSheet } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_API_KEY } from '../../../config';

type BuildingSelectorProps = {
  placeholder: string;
  onSelect: (place: {
    name: string;
    address: string;
    location: { lat: number; lng: number };
  }) => void;
};

const BuildingSelector: React.FC<BuildingSelectorProps> = ({ placeholder, onSelect }) => {
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
      query={{
        key: GOOGLE_API_KEY,
        language: 'en',
      }}
      styles={autocompleteStyles}
      debounce={300}
    />
  );
};

const autocompleteStyles = StyleSheet.create({
  textInputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 10,
  },
  textInput: {
    height: 44,
    color: '#000',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  listView: {
    backgroundColor: '#fff',
  },
});

export default BuildingSelector;
