import React from 'react';
import { render } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from '../App';
import BuildingInfo from '../src/components/BuildingInfo';
import {
  mockBuilding,
  suppressActWarnings,
  setupAppStateMock,
} from './utils/testUtils';

// Setup all mocks using factory functions
jest.mock('expo-location', () => require('./utils/testUtils').createLocationMock());
jest.mock('react-native-maps', () => require('./utils/testUtils').createMapMock());
jest.mock('react-native-safe-area-context', () => require('./utils/testUtils').createSafeAreaMock());
jest.mock('@expo/vector-icons', () => require('./utils/testUtils').createVectorIconsMock(), { virtual: true });
jest.mock('../src/components/BuildingPolygon', () => require('./utils/testUtils').createBuildingPolygonMock());

// Mock React Navigation
jest.mock('@react-navigation/native', () => require('./utils/testUtils').createNavigationMock());
jest.mock('@react-navigation/bottom-tabs', () => require('./utils/testUtils').createBottomTabsMock());

jest.spyOn(Alert, 'alert');

suppressActWarnings();
setupAppStateMock();

describe('App', () => {
  it('renders without crashing', () => {
    const result = render(<App />);
    expect(result).toBeTruthy();
  });

  describe('Display Building Info', () => {
    test('returns null when building is null', () => {
      const { queryByTestId } = render(
        <BuildingInfo building={null} onClose={() => { }} />
      );
      expect(queryByTestId('building-title')).toBeNull();
    })

    // no icons are displayed if a building does not have an accessible entrance, parking lots, and bike racks
    test('hide all icons', () => {
      const b = { ...mockBuilding, isAccessible: false, hasParking: false, hasBikeRacks: false };
      const { queryByTestId } = render(
        <BuildingInfo building={b} onClose={() => { }} />
      );
      expect(queryByTestId('icon-wheelchair')).toBeNull();
      expect(queryByTestId('icon-parking')).toBeNull();
      expect(queryByTestId('icon-bike')).toBeNull();
    })

    test('shows parking icon if parking lots are available', () => {
      const b = { ...mockBuilding, isAccessible: false, hasParking: true, hasBikeRacks: false };
      const { getByTestId, queryByTestId } = render(
        <BuildingInfo building={b} onClose={() => { }} />
      );
      expect(getByTestId('icon-parking')).toBeTruthy();
      expect(queryByTestId('icon-wheelchair')).toBeNull();
      expect(queryByTestId('icon-bike')).toBeNull();
    })

    test('shows wheelchair icon if building entrance is accessible', () => {
      const b = { ...mockBuilding, isAccessible: true, hasParking: false, hasBikeRacks: false };
      const { getByTestId, queryByTestId } = render(
        <BuildingInfo building={b} onClose={() => { }} />
      );
      expect(getByTestId('icon-wheelchair')).toBeTruthy();
      expect(queryByTestId('icon-parking')).toBeNull();
      expect(queryByTestId('icon-bike')).toBeNull();
    })

    test('shows bike icon if bike racks are available', () => {
      const b = { ...mockBuilding, isAccessible: false, hasParking: false, hasBikeRacks: true };
      const { getByTestId, queryByTestId } = render(
        <BuildingInfo building={b} onClose={() => { }} />
      );
      expect(getByTestId('icon-bike')).toBeTruthy();
      expect(queryByTestId('icon-wheelchair')).toBeNull();
      expect(queryByTestId('icon-parking')).toBeNull();
    })

    // no columns are displayed if a building has no departments and services associated to it
    test('hides columns when no departments or services', () => {
      const b = { ...mockBuilding, departments: [], services: [] };
      const { queryByTestId, queryByText } = render(
        <BuildingInfo building={b} onClose={() => { }} />
      );
      expect(queryByTestId('departments-column')).toBeNull();
      expect(queryByTestId('services-column')).toBeNull();
      expect(queryByText('Departments')).toBeNull();
      expect(queryByText('Services')).toBeNull();
    })

    // if a building has services but no departments
    test('renders services column only', () => {
      const b = { ...mockBuilding, departments: [], services: ['IT Service'] };
      const { getByTestId, queryByTestId, getByText } = render(
        <BuildingInfo building={b} onClose={() => { }} />
      );
      expect(getByTestId('services-column')).toBeTruthy();
      expect(queryByTestId('departments-column')).toBeNull();
      expect(getByText('IT Service')).toBeTruthy();
    })

    test('renders multiple departments', () => {
      const b = { ...mockBuilding, departments: ['Economics', 'Political Science'] };
      const { getByText } = render(
        <BuildingInfo building={b} onClose={() => { }} />
      );
      expect(getByText('Economics')).toBeTruthy();
      expect(getByText('Political Science')).toBeTruthy();
    })
  })

});

