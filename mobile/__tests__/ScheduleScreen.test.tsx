import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ScheduleScreen from '../src/screens/ScheduleScreen';

jest.mock('../src/hooks/useGoogleCalendar', () => ({
  useGoogleCalendar: () => ({
    state: {
      isAuthenticated: true,
      isLoading: false,
      error: null,
      token: null,
      user: { name: 'Test User', email: 'test@example.com', picture: '' },
      events: [
        {
          id: 'event-1',
          title: 'Test Class',
          location: 'Hall 101',
          building: 'Hall',
          room: '101',
          startTime: new Date('2024-02-19T11:00:00'),
          endTime: new Date('2024-02-19T12:00:00'),
          dayOfWeek: 1,
          color: '#4A90E2',
        },
      ],
    },
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

// Mock MaterialIcons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

describe('ScheduleScreen', () => {
  beforeEach(() => {
    // Mock current time to a consistent value for testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-02-19T10:00:00')); // Monday 10 AM
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    const { getByTestId } = render(<ScheduleScreen />);
    expect(getByTestId).toBeTruthy();
  });

  describe('Next Class Card', () => {
    it('displays next class card when there is an upcoming class', () => {
      const { getByText } = render(<ScheduleScreen />);
      
      expect(getByText('NEXT CLASS')).toBeTruthy();
    });

    it('displays directions button with MaterialIcons', () => {
      const { UNSAFE_getAllByType } = render(<ScheduleScreen />);
      const MaterialIcons = require('@expo/vector-icons').MaterialIcons;
      
      const icons = UNSAFE_getAllByType(MaterialIcons);
      // Should have 3 icons: person, logout (from ConnectedUserBar), and directions (from NextClassCard)
      expect(icons.length).toBe(3);
      expect(icons.some((icon: any) => icon.props.name === 'directions')).toBe(true);
    });
  });

  describe('Weekly Calendar', () => {
    it('renders time column with hours', () => {
      const { getAllByText } = render(<ScheduleScreen />);
      
      const sevenAM = getAllByText(/7:00/);
      expect(sevenAM.length).toBeGreaterThan(0);
      
      const noon = getAllByText(/12:00/);
      expect(noon.length).toBeGreaterThan(0);
    });

    it('renders day headers for weekdays', () => {
      const { getByText } = render(<ScheduleScreen />);
      
      expect(getByText('Mon')).toBeTruthy();
      expect(getByText('Tue')).toBeTruthy();
      expect(getByText('Wed')).toBeTruthy();
      expect(getByText('Thu')).toBeTruthy();
      expect(getByText('Fri')).toBeTruthy();
    });

    it('calendar container exists', () => {
      const { UNSAFE_getAllByType } = render(<ScheduleScreen />);
      const View = require('react-native').View;
      
      const views = UNSAFE_getAllByType(View);
      expect(views.length).toBeGreaterThan(0);
    });
  });

  describe('Scrolling Behavior', () => {
    it('calendar is vertically scrollable', () => {
      const { UNSAFE_getAllByType } = render(<ScheduleScreen />);
      const ScrollView = require('react-native').ScrollView;
      
      const scrollViews = UNSAFE_getAllByType(ScrollView);
      expect(scrollViews.length).toBeGreaterThan(0);
    });

    it('calendar is horizontally scrollable', () => {
      const { UNSAFE_getAllByType } = render(<ScheduleScreen />);
      const ScrollView = require('react-native').ScrollView;
      
      const scrollViews = UNSAFE_getAllByType(ScrollView);
      const horizontalScrollView = scrollViews.find(
        (sv: any) => sv.props.horizontal === true
      );
      
      expect(horizontalScrollView).toBeTruthy();
    });
  });

  describe('Time Formatting', () => {
    it('displays times in the calendar', () => {
      const { getAllByText } = render(<ScheduleScreen />);
      
      // Check for any AM/PM time display
      const amPmTimes = getAllByText(/AM|PM/);
      expect(amPmTimes.length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    it('applies Concordia maroon color to next class label', () => {
      const { getByText } = render(<ScheduleScreen />);
      
      const label = getByText('NEXT CLASS');
      expect(label.props.style).toEqual(
        expect.objectContaining({
          color: '#912338',
        })
      );
    });
  });
});