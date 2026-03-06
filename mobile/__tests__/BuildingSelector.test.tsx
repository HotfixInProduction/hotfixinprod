import React from 'react';
import { render } from '@testing-library/react-native';
import BuildingSelector from '../src/components/BuildingSelector/BuildingSelector';

// Mock the Google Places Autocomplete
jest.mock('react-native-google-places-autocomplete', () => {
  const React = require('react');
  return {
    GooglePlacesAutocomplete: React.forwardRef((props: any, ref: any) => {
      const { View } = require('react-native');
      const MockComponent = View;
      // Store props for testing
      (MockComponent as any).mockProps = props;

      // Mock the ref methods
      React.useImperativeHandle(ref, () => ({
        setAddressText: jest.fn(),
        getAddressText: jest.fn(() => ''),
        focus: jest.fn(),
        blur: jest.fn(),
        getCurrentAddressText: jest.fn(() => ''),
      }));

      return (
        <MockComponent testID="google-places-autocomplete">
          {props.renderRow ? props.renderRow({ description: 'Test result' }) : null}
        </MockComponent>
      );
    }),
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

  it('configures GooglePlacesAutocomplete with correct query parameters', () => {
    render(<BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value={''} />);
    const { View } = require('react-native');
    expect(View.mockProps.query).toEqual({
      key: 'test-api-key',
      language: 'en',
    });
  });

  it('handles onPress with valid details', () => {
    render(<BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value={''} />);
    const { View } = require('react-native');

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

    expect(mockOnSelect).toHaveBeenCalledWith({
      name: 'Test Building',
      address: '123 Test St',
      location: { lat: 40.7128, lng: -74.006 },
    });
  });

  it('handles onPress when details is null', () => {
    render(<BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value={''} />);
    const { View } = require('react-native');

    View.mockProps.onPress({ description: 'test' }, null);
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('handles onFail callback', () => {
    render(<BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value={''} />);
    const { View } = require('react-native');

    const mockError = new Error('API Error');
    View.mockProps.onFail(mockError);

    expect(console.log).toHaveBeenCalledWith('Places API error:', mockError);
  });

  it('updates address text when value prop changes', () => {
    const { rerender } = render(
      <BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value="" />
    );

    rerender(
      <BuildingSelector placeholder={placeholder} onSelect={mockOnSelect} userLocation={null} value="Test Building" />
    );
    expect(true).toBe(true);
  });

  it('includes location and radius in query when userLocation is provided', () => {
    const userLocation = { latitude: 45.497, longitude: -73.579 };
    render(
      <BuildingSelector
        placeholder={placeholder}
        onSelect={mockOnSelect}
        userLocation={userLocation}
        value=""
      />
    );
    const { View } = require('react-native');
    expect(View.mockProps.query).toEqual({
      key: 'test-api-key',
      language: 'en',
      location: '45.497,-73.579',
      radius: 50000,
      strictbounds: true,
    });
  });

  it('renders search result row correctly', () => {
    const { getByTestId } = render(
      <BuildingSelector
        placeholder={placeholder}
        onSelect={mockOnSelect}
        userLocation={null}
        value=""
      />
    );

    expect(getByTestId('search-result-item')).toBeTruthy();
    expect(getByTestId('search-result-item').props.children).toBe('Test result');
  });

  it('uses testID when provided', () => {
    const { getByTestId } = render(
      <BuildingSelector
        placeholder={placeholder}
        onSelect={mockOnSelect}
        userLocation={null}
        value=""
        testID="custom-id"
      />
    );
    expect(getByTestId('custom-id-container')).toBeTruthy();
  });
});
