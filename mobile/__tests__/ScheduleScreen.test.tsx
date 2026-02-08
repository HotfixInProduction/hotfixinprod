import React from 'react';
import { render } from '@testing-library/react-native';
import ScheduleScreen from '../src/screens/ScheduleScreen';

// Mock safe area context
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: (props: any) => <View {...props} />,
  };
});

describe('ScheduleScreen', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<ScheduleScreen />);
    expect(getByText('Schedule')).toBeTruthy();
  });

  it('displays the correct title', () => {
    const { getByText } = render(<ScheduleScreen />);
    expect(getByText('Schedule')).toBeTruthy();
  });

  it('displays the subtitle message', () => {
    const { getByText } = render(<ScheduleScreen />);
    expect(getByText('Your schedule will appear here')).toBeTruthy();
  });

  it('renders with correct styling', () => {
    const { getByText } = render(<ScheduleScreen />);
    const title = getByText('Schedule');
    
    expect(title.props.style).toEqual(
      expect.objectContaining({
        fontSize: 28,
        fontWeight: '700',
        color: '#1f1f1f',
        marginBottom: 8,
      })
    );
  });
});
