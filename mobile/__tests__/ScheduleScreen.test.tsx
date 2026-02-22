import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ScheduleScreen from '../src/screens/ScheduleScreen';

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
      const { UNSAFE_getByType } = render(<ScheduleScreen />);
      const MaterialIcons = require('@expo/vector-icons').MaterialIcons;
      
      const icons = UNSAFE_getByType(MaterialIcons);
      expect(icons).toBeTruthy();
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

  describe('Timer cleanup', () => {
    it('fires the interval callback and clears the interval timer on unmount', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const { unmount } = render(<ScheduleScreen />);

      // Advance fake timers to trigger the setInterval callback (line 158)
      await act(async () => {
        jest.advanceTimersByTime(60000);
      });

      unmount();
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Time until class formatting', () => {
    it('displays time in minutes-only format when class is less than one hour away', async () => {
      // sampleClasses are loaded at module init with the real date (Feb 2026).
      // Monday class starts at ~Feb 16 2026 08:45. Setting fake time to 30 min
      // before ensures hours === 0, covering the minutes-only return (line 196).
      jest.setSystemTime(new Date('2026-02-16T08:15:00'));

      const { getByText } = render(<ScheduleScreen />);

      await waitFor(() => {
        // "in Xm" with no hours component confirms the hours === 0 branch
        expect(getByText(/^in \d+m$/)).toBeTruthy();
      });
    });
  });
});