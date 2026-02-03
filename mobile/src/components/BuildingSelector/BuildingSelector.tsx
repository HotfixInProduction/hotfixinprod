import React, {useState} from 'react';
import { StyleSheet } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const GOOGLE_API_KEY = ''

type BuildingSelectorProps = {
  placeholder: string;
  onSelect: (place: {
    name: string;
    address: string;
    location: { lat: number; lng: number };
  }) => void;
};

const BuildingSelector: React.FC<BuildingSelectorProps> = ({ placeholder, onSelect }) => {
const [inputText, setInputText] = useState('');
  return (
    <GooglePlacesAutocomplete
      placeholder={placeholder}
      fetchDetails={true}
      textInputProps={{
          value: inputText,
          onChangeText: (text) => {
            setInputText(text);
          },
        }}
      onFail={(error) => {
          console.log('Places API error:', error);
          console.log('User input at failure:', inputText);
        }}
      onPress={(data, details = null) => {
        console.log('User tapped a suggestion:', data);
        console.log('Full details object:', details);

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
        key: GOOGLE_API_KEY!,
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
