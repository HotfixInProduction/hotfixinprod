import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import RouteInfo from '../src/components/RouteInfo';

const defaultProps = {
  duration: 15,
  distance: 5,
  mode: 'DRIVING' as const,
  onModeChange: jest.fn(),
  onStart: jest.fn(),
  onClose: jest.fn(),
};

describe('Arrival Time', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calculates and displays the correct arrival time', () => {
    const duration = 15; // in minutes
    const now = new Date();

    render(
      <RouteInfo
        duration={duration}
        distance={5}
        mode="DRIVING"
        onModeChange={() => {}}
        onStart={() => {}}
        onClose={() => {}}
      />
    );

    const expectedTime = new Date(now.getTime() + duration * 60000)
      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    expect(screen.getByText(new RegExp(`Arrive at\\s*${expectedTime}`, 'i'))).toBeTruthy();
  });
});

describe('Mode Selection', () => {
  it('calls onModeChange with the correct mode when a mode button is pressed', () => {
    const onModeChange = jest.fn();
    render(<RouteInfo {...defaultProps} onModeChange={onModeChange} />);

    fireEvent.press(screen.getByTestId('route-info-mode-walking'));
    expect(onModeChange).toHaveBeenCalledWith('WALKING');
  });

  it('shows shuttle details and schedule action when shuttle mode is active', () => {
    const onOpenShuttleSchedule = jest.fn();
    render(
      <RouteInfo
        {...defaultProps}
        mode="SHUTTLE"
        allowShuttleMode
        shuttleInfo={{
          nextDepartureInMinutes: 8,
          nextDepartureTimeLabel: '03:20 PM',
          intervalMinutes: 20,
        }}
        onOpenShuttleSchedule={onOpenShuttleSchedule}
      />
    );

    expect(screen.getByText('Next shuttle in 8 min')).toBeTruthy();
    fireEvent.press(screen.getByTestId('route-info-open-shuttle-schedule'));
    expect(onOpenShuttleSchedule).toHaveBeenCalled();
  });
});
