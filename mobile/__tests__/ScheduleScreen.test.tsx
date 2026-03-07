import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ScheduleScreen from '../src/screens/ScheduleScreen';

const mockSelectCalendar = jest.fn();
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();

const mockCalendars = [
  { id: 'primary', summary: 'My Calendar', backgroundColor: '#4A90E2', primary: true },
  { id: 'work@example.com', summary: 'Work', backgroundColor: '#E94B3C' },
];

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
      calendars: [
        { id: 'primary', summary: 'My Calendar', backgroundColor: '#4A90E2', primary: true },
        { id: 'work@example.com', summary: 'Work', backgroundColor: '#E94B3C' },
      ],
      selectedCalendarId: 'primary',
    },
    connect: mockConnect,
    disconnect: mockDisconnect,
    selectCalendar: mockSelectCalendar,
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

describe('ScheduleScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-02-19T10:00:00')); // Monday 10 AM
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    const { getByTestId } = render(<ScheduleScreen />);
    expect(getByTestId).toBeTruthy();
  });

  // CalendarPicker

  describe('CalendarPicker', () => {
    it('renders the calendar picker when authenticated', () => {
      const { getByText } = render(<ScheduleScreen />);
      expect(getByText('My Calendar')).toBeTruthy();
    });

    it('opens the calendar picker modal on press', () => {
      const { getByText, queryByText } = render(<ScheduleScreen />);

      expect(queryByText('Select Calendar')).toBeNull();
      fireEvent.press(getByText('My Calendar'));
      expect(getByText('Select Calendar')).toBeTruthy();
    });

    it('shows all calendars in the modal', () => {
      const { getByText, getAllByText } = render(<ScheduleScreen />);

      fireEvent.press(getByText('My Calendar'));
      expect(getAllByText('My Calendar').length).toBeGreaterThan(0);
      expect(getByText('Work')).toBeTruthy();
    });

    it('calls selectCalendar when a calendar is selected', () => {
      const { getByText } = render(<ScheduleScreen />);

      fireEvent.press(getByText('My Calendar'));
      fireEvent.press(getByText('Work'));

      expect(mockSelectCalendar).toHaveBeenCalledWith('work@example.com');
    });

    it('closes modal after selecting a calendar', () => {
      const { getByText, queryByText } = render(<ScheduleScreen />);

      fireEvent.press(getByText('My Calendar'));
      expect(getByText('Select Calendar')).toBeTruthy();

      fireEvent.press(getByText('Work'));
      expect(queryByText('Select Calendar')).toBeNull();
    });

    it('closes modal when overlay is pressed', () => {
      const { getByText, getByTestId, queryByText } = render(<ScheduleScreen />);

      fireEvent.press(getByText('My Calendar'));
      expect(getByText('Select Calendar')).toBeTruthy();

      fireEvent(getByTestId('calendar-picker-overlay'), 'press');
      expect(queryByText('Select Calendar')).toBeNull();
    });

    it('closes modal on hardware back request', () => {
      const { getByText, queryByText } = render(<ScheduleScreen />);

      fireEvent.press(getByText('My Calendar'));
      expect(getByText('Select Calendar')).toBeTruthy();

      fireEvent(getByText('Select Calendar'), 'requestClose');
      expect(queryByText('Select Calendar')).toBeNull();
    });
  });

  // Next Class Card

  describe('Next Class Card', () => {
    it('displays next class card when there is an upcoming class', () => {
      const { getByText } = render(<ScheduleScreen />);
      expect(getByText('NEXT CLASS')).toBeTruthy();
    });

    it('displays directions button with MaterialIcons', () => {
      const { UNSAFE_getAllByType } = render(<ScheduleScreen />);
      const MaterialIcons = require('@expo/vector-icons').MaterialIcons;

      const icons = UNSAFE_getAllByType(MaterialIcons);
      expect(icons.some((icon: any) => icon.props.name === 'directions')).toBe(true);
    });
  });

  // Weekly Calendar

  describe('Weekly Calendar', () => {
    it('renders time column with hours', () => {
      const { getAllByText } = render(<ScheduleScreen />);
      expect(getAllByText(/7:00/).length).toBeGreaterThan(0);
      expect(getAllByText(/12:00/).length).toBeGreaterThan(0);
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
      expect(UNSAFE_getAllByType(View).length).toBeGreaterThan(0);
    });
  });

  // Time formatting

  describe('Time Formatting', () => {
    it('displays times in the calendar', () => {
      const { getAllByText } = render(<ScheduleScreen />);
      const amPmTimes = getAllByText(/AM|PM/);
      expect(amPmTimes.length).toBeGreaterThan(0);
    });
  });

  // Styling

  describe('Styling', () => {
    it('applies Concordia maroon color to next class label', () => {
      const { getByText } = render(<ScheduleScreen />);
      const label = getByText('NEXT CLASS');
      expect(label.props.style).toEqual(
        expect.objectContaining({ color: '#912338' })
      );
    });
  });

  // Timer

  describe('Timer cleanup', () => {
    it('fires the interval callback and clears the interval timer on unmount', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const { unmount } = render(<ScheduleScreen />);

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
      jest.setSystemTime(new Date('2024-02-19T10:30:00'));
      const { getByText } = render(<ScheduleScreen />);

      await waitFor(() => {
        expect(getByText(/^in \d+m$/)).toBeTruthy();
      });
    });
  });
});