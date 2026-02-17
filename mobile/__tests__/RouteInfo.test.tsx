import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RouteInfo from '../src/components/RouteInfo';

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

    render(<RouteInfo duration={duration} distance={5} onStart={() => {}} onClose={() => {}} />);

    const expectedTime = new Date(now.getTime() + duration * 60000)
      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    expect(screen.getByText(new RegExp(`Arrive at\\s*${expectedTime}`, 'i'))).toBeTruthy();
  });
});