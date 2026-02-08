import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BuildingInfo from '../src/components/BuildingInfo';

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

const mockBuilding = {
  id: 'Hall Building',
  address: '1455 De Maisonneuve Blvd. W.',
};

describe('BuildingInfo', () => {
  it('returns null when building is null', () => {
    const { queryByTestId } = render(<BuildingInfo building={null} onClose={() => {}} />);
    expect(queryByTestId('building-title')).toBeNull();
  });

  it('renders title, address, and close button', () => {
    const { getByTestId, getByText } = render(<BuildingInfo building={mockBuilding} onClose={() => {}} />);
    expect(getByTestId('building-title')).toHaveTextContent('Hall Building');
    expect(getByText('1455 De Maisonneuve Blvd. W.')).toBeTruthy();
    expect(getByTestId('building-close')).toBeTruthy();
  });

  it('calls onClose when close button pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<BuildingInfo building={mockBuilding} onClose={onClose} />);
    fireEvent.press(getByTestId('building-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it.each([
    [{ isAccessible: true }, 'icon-wheelchair'],
    [{ hasParking: true }, 'icon-parking'],
    [{ hasBikeRacks: true }, 'icon-bike'],
  ])('shows correct icon for %p', (amenities, iconId) => {
    const { getByTestId } = render(<BuildingInfo building={{ ...mockBuilding, ...amenities }} onClose={() => {}} />);
    expect(getByTestId(iconId)).toBeTruthy();
  });

  it('hides all icons when no amenities', () => {
    const { queryByTestId } = render(<BuildingInfo building={mockBuilding} onClose={() => {}} />);
    expect(queryByTestId('icon-wheelchair')).toBeNull();
    expect(queryByTestId('icon-parking')).toBeNull();
    expect(queryByTestId('icon-bike')).toBeNull();
  });

  it('renders departments column with items', () => {
    const building = { ...mockBuilding, departments: ['CS', 'Math'] };
    const { getByTestId, getByText } = render(<BuildingInfo building={building} onClose={() => {}} />);
    expect(getByTestId('departments-column')).toBeTruthy();
    expect(getByText('CS')).toBeTruthy();
    expect(getByText('Math')).toBeTruthy();
  });

  it('renders services column with items', () => {
    const building = { ...mockBuilding, services: ['IT', 'Library'] };
    const { getByTestId, getByText } = render(<BuildingInfo building={building} onClose={() => {}} />);
    expect(getByTestId('services-column')).toBeTruthy();
    expect(getByText('IT')).toBeTruthy();
    expect(getByText('Library')).toBeTruthy();
  });

  it('hides columns when empty', () => {
    const building = { ...mockBuilding, departments: [], services: [] };
    const { queryByTestId } = render(<BuildingInfo building={building} onClose={() => {}} />);
    expect(queryByTestId('departments-column')).toBeNull();
    expect(queryByTestId('services-column')).toBeNull();
  });
});
