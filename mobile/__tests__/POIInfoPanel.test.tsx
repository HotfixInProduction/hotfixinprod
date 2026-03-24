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

  describe('Optional POI fields', () => {
    it('renders without address', () => {
      const poiNoAddress = { ...mockPOIWithDistance, address: undefined };
      const { queryByText } = render(
        <POIInfoPanel 
          poi={poiNoAddress} 
          onClose={() => {}} 
          slideAnim={slideAnim}
          isVisible={true}
        />
      );
      expect(queryByText('1240 De Maisonneuve Blvd W')).toBeNull();
    });

    it('renders without description', () => {
      const poiNoDescription = { ...mockPOIWithDistance, description: undefined };
      const { queryByText, getByText } = render(
        <POIInfoPanel 
          poi={poiNoDescription} 
          onClose={() => {}} 
          slideAnim={slideAnim}
          isVisible={true}
        />
      );
      expect(queryByText('Thai cuisine and quick service')).toBeNull();
      expect(getByText('Thai Express')).toBeTruthy();
    });

    it('renders without hours', () => {
      const poiNoHours = { ...mockPOIWithDistance, hours: undefined };
      const { queryByText } = render(
        <POIInfoPanel 
          poi={poiNoHours} 
          onClose={() => {}} 
          slideAnim={slideAnim}
          isVisible={true}
        />
      );
      expect(queryByText('Mon-Fri 11am-9pm, Sat 12pm-9pm')).toBeNull();
    });

    it('renders without phone', () => {
      const poiNoPhone = { ...mockPOIWithDistance, phone: undefined };
      const { queryByText } = render(
        <POIInfoPanel 
          poi={poiNoPhone} 
          onClose={() => {}} 
          slideAnim={slideAnim}
          isVisible={true}
        />
      );
      expect(queryByText('(514) 555-0100')).toBeNull();
    });

    it('renders with all optional fields', () => {
      const { getByText } = render(
        <POIInfoPanel 
          poi={mockPOIWithDistance} 
          onClose={() => {}} 
          slideAnim={slideAnim}
          isVisible={true}
        />
      );
      expect(getByText('1240 De Maisonneuve Blvd W')).toBeTruthy();
      expect(getByText('Thai cuisine and quick service')).toBeTruthy();
      expect(getByText('Mon-Fri 11am-9pm, Sat 12pm-9pm')).toBeTruthy();
      expect(getByText('(514) 555-0100')).toBeTruthy();
    });

    it('renders minimal POI with only required fields', () => {
      const minimalPOI: OutdoorPOI & { distance?: number } = {
        id: 'poi_min_1',
        name: 'Minimal POI',
        category: 'food',
        coordinates: { latitude: 45.5, longitude: -73.5 },
        campus: 'downtown',
      };

      const { getByText, queryByTestId } = render(
        <POIInfoPanel 
          poi={minimalPOI} 
          onClose={() => {}} 
          slideAnim={slideAnim}
          isVisible={true}
        />
      );
      expect(getByText('Minimal POI')).toBeTruthy();
      expect(getByText('FOOD')).toBeTruthy();
      expect(queryByTestId('poi-info-panel')).toBeTruthy();
    });
  });

  describe('POI category display', () => {
    it.each([
      ['food', 'FOOD'],
      ['cafe', 'CAFE'],
      ['restroom', 'RESTROOM'],
      ['parking', 'PARKING'],
      ['bike_rack', 'BIKE RACK'],
      ['emergency', 'EMERGENCY'],
    ])('displays %s category as %s', (category, expectedDisplay) => {
      const poi: OutdoorPOI & { distance?: number } = {
        ...mockPOIWithDistance,
        category: category as any,
      };
      const { getByText } = render(
        <POIInfoPanel 
          poi={poi} 
          onClose={() => {}} 
          slideAnim={slideAnim}
          isVisible={true}
        />
      );
      expect(getByText(expectedDisplay)).toBeTruthy();
    });
  });

  describe('isVisible prop behavior', () => {
    it('sets correct pointerEvents when isVisible is true', () => {
      const { getByTestId } = render(
        <POIInfoPanel 
          poi={mockPOI} 
          onClose={() => {}} 
          slideAnim={slideAnim}
          isVisible={true}
        />
      );
      const panel = getByTestId('poi-info-panel');
      expect(panel.props.pointerEvents).toBe('auto');
    });

    it('sets correct pointerEvents when isVisible is false', () => {
      const { getByTestId } = render(
        <POIInfoPanel 
          poi={mockPOI} 
          onClose={() => {}} 
          slideAnim={slideAnim}
          isVisible={false}
        />
      );
      const panel = getByTestId('poi-info-panel');
      expect(panel.props.pointerEvents).toBe('none');
    });
  });
});
