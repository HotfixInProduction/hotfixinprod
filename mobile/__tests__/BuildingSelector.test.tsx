import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import BuildingSelector from '../src/components/BuildingSelector/BuildingSelector';

// Mock the Google Places Autocomplete
jest.mock('react-native-google-places-autocomplete', () => {
  const React = require('react');
  return {
    GooglePlacesAutocomplete: (props: any) => {
      const MockComponent = require('react-native').View;
      // Store props for testing
      (MockComponent as any).mockProps = props;
      return React.createElement(MockComponent, { testID: 'google-places-autocomplete' });
    },
  };
});

// Mock expo-constants
jest.mock('expo-constants', () => {
  const Constants = {
    expoConfig: {
      extra: {
        googleApiKey: 'test-api-key',
      },
    },
  };
  return {
    __esModule: true,
    default: Constants,
  };
});

describe('BuildingSelector', () => {
  const mockOnSelect = jest.fn();
  const placeholder = 'Select a building';

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  it('renders without crashing', () => {
    const { getByTestId } = render(
      <BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value={''} />
    );
    expect(getByTestId('google-places-autocomplete')).toBeTruthy();
  });

  it('passes correct placeholder to GooglePlacesAutocomplete', () => {
    render(<BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value={''} />);
    const { GooglePlacesAutocomplete } = require('react-native-google-places-autocomplete');
    const View = require('react-native').View;
    expect(View.mockProps.placeholder).toBe(placeholder);
  });

  it('configures GooglePlacesAutocomplete with correct query parameters', () => {
    render(<BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value={''} />);
    const View = require('react-native').View;
    expect(View.mockProps.query).toEqual({
      key: 'test-api-key',
      language: 'en',
    });
  });

  it('sets fetchDetails to true', () => {
    render(<BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value={''} />);
    const View = require('react-native').View;
    expect(View.mockProps.fetchDetails).toBe(true);
  });

  it('sets debounce to 300', () => {
    render(<BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value={''} />);
    const View = require('react-native').View;
    expect(View.mockProps.debounce).toBe(300);
  });

  it('handles onPress with valid details', () => {
    render(<BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value={''} />);
    const View = require('react-native').View;

    const mockData = {
      structured_formatting: {
        main_text: 'Test Building',
      },
    };

    const mockDetails = {
      formatted_address: '123 Test St',
      geometry: {
        location: { lat: 40.7128, lng: -74.006 },
      },
    };

    View.mockProps.onPress(mockData, mockDetails);

    expect(console.log).toHaveBeenCalledWith('Creating place object:', {
      name: 'Test Building',
      address: '123 Test St',
      location: { lat: 40.7128, lng: -74.006 },
    });

    expect(mockOnSelect).toHaveBeenCalledWith({
      name: 'Test Building',
      address: '123 Test St',
      location: { lat: 40.7128, lng: -74.006 },
    });
  });

  it('handles onPress when details is null', () => {
    render(<BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value={''} />);
    const View = require('react-native').View;

    const mockData = {
      structured_formatting: {
        main_text: 'Test Building',
      },
    };

    View.mockProps.onPress(mockData, null);

    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('handles onPress with missing formatted_address', () => {
    render(<BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value={''} />);
    const View = require('react-native').View;

    const mockData = {
      structured_formatting: {
        main_text: 'Test Building',
      },
    };

    const mockDetails = {
      geometry: {
        location: { lat: 40.7128, lng: -74.006 },
      },
    };

    View.mockProps.onPress(mockData, mockDetails);

    expect(mockOnSelect).toHaveBeenCalledWith({
      name: 'Test Building',
      address: '',
      location: { lat: 40.7128, lng: -74.006 },
    });
  });

  it('handles onPress with missing geometry location', () => {
    render(<BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value={''} />);
    const View = require('react-native').View;

    const mockData = {
      structured_formatting: {
        main_text: 'Test Building',
      },
    };

    const mockDetails = {
      formatted_address: '123 Test St',
    };

    View.mockProps.onPress(mockData, mockDetails);

    expect(mockOnSelect).toHaveBeenCalledWith({
      name: 'Test Building',
      address: '123 Test St',
      location: { lat: 0, lng: 0 },
    });
  });

  it('handles onFail callback', () => {
    render(<BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value={''} />);
    const View = require('react-native').View;

    const mockError = new Error('API Error');
    View.mockProps.onFail(mockError);

    expect(console.log).toHaveBeenCalledWith('Places API error:', mockError);
  });

  it('applies custom styles to GooglePlacesAutocomplete', () => {
    render(<BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value={''} />);
    const View = require('react-native').View;
    
    expect(View.mockProps.styles).toBeDefined();
    expect(View.mockProps.styles.textInputContainer).toBeDefined();
    expect(View.mockProps.styles.textInput).toBeDefined();
    expect(View.mockProps.styles.listView).toBeDefined();
  });
});
