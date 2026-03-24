import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import POIInfoPanel from '../src/components/POIInfoPanel';
import { Animated } from 'react-native';
import type { OutdoorPOI } from '../src/data/outdoorPOI';

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

const mockPOI: OutdoorPOI = {
  id: 'poi_food_1',
  name: 'Thai Express',
  category: 'food',
  coordinates: { latitude: 45.49625, longitude: -73.57788 },
  address: '1240 De Maisonneuve Blvd W',
  description: 'Thai cuisine and quick service',
  campus: 'downtown',
  hours: 'Mon-Fri 11am-9pm, Sat 12pm-9pm',
  phone: '(514) 555-0100'
};

const mockPOIWithDistance: OutdoorPOI & { distance: number } = {
  ...mockPOI,
  distance: 234
};

describe('POIInfoPanel', () => {
  let slideAnim: Animated.Value;

  beforeEach(() => {
    slideAnim = new Animated.Value(400);
  });

  it('returns null when poi is null', () => {
    const { queryByTestId } = render(
      <POIInfoPanel 
        poi={null} 
        onClose={() => {}} 
        slideAnim={slideAnim}
        isVisible={false}
      />
    );
    expect(queryByTestId('poi-info-panel')).toBeNull();
  });

  it('renders POI details when poi is provided', () => {
    const { getByText } = render(
      <POIInfoPanel 
        poi={mockPOIWithDistance} 
        onClose={() => {}} 
        slideAnim={slideAnim}
        isVisible={true}
      />
    );
    expect(getByText('Thai Express')).toBeTruthy();
    expect(getByText('1240 De Maisonneuve Blvd W')).toBeTruthy();
    expect(getByText('Thai cuisine and quick service')).toBeTruthy();
  });

  it('closes panel when close button is pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <POIInfoPanel 
        poi={mockPOI} 
        onClose={onClose} 
        slideAnim={slideAnim}
        isVisible={true}
      />
    );
    fireEvent.press(getByTestId('poi-close-button'));
    expect(onClose).toHaveBeenCalled();
  });

  it('displays distance when available', () => {
    const { getByText } = render(
      <POIInfoPanel 
        poi={mockPOIWithDistance} 
        onClose={() => {}} 
        slideAnim={slideAnim}
        isVisible={true}
      />
    );
    expect(getByText(/away/)).toBeTruthy();
  });

  it('does not display set as destination button when callback is not provided', () => {
    const { queryByTestId } = render(
      <POIInfoPanel 
        poi={mockPOI} 
        onClose={() => {}} 
        slideAnim={slideAnim}
        isVisible={true}
        hasUserLocation={true}
      />
    );
    expect(queryByTestId('poi-set-destination-button')).toBeNull();
  });

  it('displays set as destination button when callback and location available', () => {
    const { getByTestId } = render(
      <POIInfoPanel 
        poi={mockPOI} 
        onClose={() => {}} 
        slideAnim={slideAnim}
        isVisible={true}
        onSetAsDestination={() => {}}
        hasUserLocation={true}
      />
    );
    expect(getByTestId('poi-set-destination-button')).toBeTruthy();
  });

  it('calls onSetAsDestination when button is pressed', () => {
    const onSetAsDestination = jest.fn();
    const { getByTestId } = render(
      <POIInfoPanel 
        poi={mockPOI} 
        onClose={() => {}} 
        slideAnim={slideAnim}
        isVisible={true}
        onSetAsDestination={onSetAsDestination}
        hasUserLocation={true}
      />
    );
    fireEvent.press(getByTestId('poi-set-destination-button'));
    expect(onSetAsDestination).toHaveBeenCalledWith(mockPOI);
  });

  it('does not show button without user location', () => {
    const { queryByTestId } = render(
      <POIInfoPanel 
        poi={mockPOI} 
        onClose={() => {}} 
        slideAnim={slideAnim}
        isVisible={true}
        onSetAsDestination={() => {}}
        hasUserLocation={false}
      />
    );
    expect(queryByTestId('poi-set-destination-button')).toBeNull();
  });
});
