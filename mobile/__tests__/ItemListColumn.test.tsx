import React from 'react';
import { render } from '@testing-library/react-native';
import ItemListColumn from '../src/components/ItemListColumn';

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('ItemListColumn', () => {
  it('renders title correctly', () => {
    const { getByText } = render(
      <ItemListColumn title="Departments" items={['CS', 'Math']} />
    );
    expect(getByText('Departments')).toBeTruthy();
  });

  it('renders all items in the list', () => {
    const items = ['Computer Science', 'Mathematics', 'Physics'];
    const { getByText } = render(
      <ItemListColumn title="Departments" items={items} />
    );
    
    items.forEach((item) => {
      expect(getByText(item)).toBeTruthy();
    });
  });

  it('renders with testID when provided', () => {
    const { getByTestId } = render(
      <ItemListColumn 
        title="Services" 
        items={['IT', 'Library']} 
        testID="services-column"
      />
    );
    expect(getByTestId('services-column')).toBeTruthy();
  });

  it('renders empty list when items array is empty', () => {
    const { getByText, queryByText } = render(
      <ItemListColumn title="Departments" items={[]} />
    );
    expect(getByText('Departments')).toBeTruthy();
    expect(queryByText(/^(?!Departments)/)).toBeNull();
  });

  it('renders single item correctly', () => {
    const { getByText } = render(
      <ItemListColumn title="Services" items={['Library']} />
    );
    expect(getByText('Library')).toBeTruthy();
  });
});
