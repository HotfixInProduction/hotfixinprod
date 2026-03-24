import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import POIFilter from '../src/components/POIFilter';

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

describe('POIFilter', () => {
  it('renders filter modal when visible', () => {
    const { getByText } = render(
      <POIFilter 
        visible={true} 
        onClose={() => {}} 
        selectedFilters={new Set(['food', 'cafe'])}
        onFilterChange={() => {}}
      />
    );
    expect(getByText('Filter POI')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <POIFilter 
        visible={false} 
        onClose={() => {}} 
        selectedFilters={new Set(['food'])}
        onFilterChange={() => {}}
      />
    );
    expect(queryByText('Filter POI')).toBeNull();
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <POIFilter 
        visible={true} 
        onClose={onClose} 
        selectedFilters={new Set(['food'])}
        onFilterChange={() => {}}
      />
    );
    fireEvent.press(getByTestId('poi-filter-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('toggles category selection', () => {
    const onFilterChange = jest.fn();
    const { getByTestId } = render(
      <POIFilter 
        visible={true} 
        onClose={() => {}} 
        selectedFilters={new Set(['food'])}
        onFilterChange={onFilterChange}
      />
    );
    
    fireEvent.press(getByTestId('poi-filter-food'));
    expect(onFilterChange).toHaveBeenCalled();
  });

  it('displays select all button', () => {
    const { getByTestId } = render(
      <POIFilter 
        visible={true} 
        onClose={() => {}} 
        selectedFilters={new Set()}
        onFilterChange={() => {}}
      />
    );
    expect(getByTestId('poi-select-all')).toBeTruthy();
  });

  it('displays clear all button', () => {
    const { getByTestId } = render(
      <POIFilter 
        visible={true} 
        onClose={() => {}} 
        selectedFilters={new Set(['food', 'cafe'])}
        onFilterChange={() => {}}
      />
    );
    expect(getByTestId('poi-clear-all')).toBeTruthy();
  });

  it('calls onFilterChange when select all is pressed', () => {
    const onFilterChange = jest.fn();
    const { getByTestId } = render(
      <POIFilter 
        visible={true} 
        onClose={() => {}} 
        selectedFilters={new Set()}
        onFilterChange={onFilterChange}
      />
    );
    fireEvent.press(getByTestId('poi-select-all'));
    expect(onFilterChange).toHaveBeenCalled();
  });

  it('calls onFilterChange when clear all is pressed', () => {
    const onFilterChange = jest.fn();
    const { getByTestId } = render(
      <POIFilter 
        visible={true} 
        onClose={() => {}} 
        selectedFilters={new Set(['food', 'cafe'])}
        onFilterChange={onFilterChange}
      />
    );
    fireEvent.press(getByTestId('poi-clear-all'));
    expect(onFilterChange).toHaveBeenCalled();
  });
});
