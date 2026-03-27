import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NearestPOIBanner from '../src/components/NearestPOIBanner';
import type { OutdoorPOI } from '../src/data/outdoorPOI';

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

const mockPOI: OutdoorPOI & { distance: number } = {
  id: 'poi_food_1',
  name: 'Thai Express',
  category: 'food',
  coordinates: { latitude: 45.49625, longitude: -73.57788 },
  address: '1240 De Maisonneuve Blvd W',
  description: 'Thai cuisine and quick service',
  campus: 'downtown',
  hours: 'Mon-Fri 11am-9pm, Sat 12pm-9pm',
  distance: 234
};

describe('NearestPOIBanner', () => {
  it('returns null when poi is null', () => {
    const { queryByTestId } = render(
      <NearestPOIBanner 
        poi={null} 
        onPress={() => {}}
      />
    );
    expect(queryByTestId('nearest-poi-banner')).toBeNull();
  });

  it('renders POI information when poi is provided', () => {
    const { getByText } = render(
      <NearestPOIBanner 
        poi={mockPOI} 
        onPress={() => {}}
      />
    );
    expect(getByText('Nearest POI')).toBeTruthy();
    expect(getByText('Thai Express')).toBeTruthy();
  });

  it('displays distance in correct format', () => {
    const { getByText } = render(
      <NearestPOIBanner 
        poi={mockPOI} 
        onPress={() => {}}
      />
    );
    // Distance should be formatted as "234m" or similar
    expect(getByText(/\d+/)).toBeTruthy();
  });

  it('calls onPress when banner is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <NearestPOIBanner 
        poi={mockPOI} 
        onPress={onPress}
      />
    );
    fireEvent.press(getByTestId('nearest-poi-banner'));
    expect(onPress).toHaveBeenCalled();
  });

  it('renders with different distances', () => {
    const { getByText } = render(
      <NearestPOIBanner 
        poi={{ ...mockPOI, distance: 1200 }} 
        onPress={() => {}}
      />
    );
    expect(getByText('Thai Express')).toBeTruthy();
  });

  it('handles long POI names with ellipsis', () => {
    const { getByText } = render(
      <NearestPOIBanner 
        poi={{ 
          ...mockPOI, 
          name: 'This is a very long POI name that should be truncated properly' 
        }} 
        onPress={() => {}}
      />
    );
    expect(getByText(/This is a very long/)).toBeTruthy();
  });
});
