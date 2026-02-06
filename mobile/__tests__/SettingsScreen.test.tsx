import React from 'react';
import { render } from '@testing-library/react-native';
import SettingsScreen from '../src/screens/SettingsScreen';

// Mock safe area context
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: (props: any) => <View {...props} />,
  };
});

describe('SettingsScreen', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Settings')).toBeTruthy();
  });

  it('displays the correct title', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Settings')).toBeTruthy();
  });

  it('displays the subtitle message', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('App settings will appear here')).toBeTruthy();
  });

  it('renders with correct styling', () => {
    const { getByText } = render(<SettingsScreen />);
    const title = getByText('Settings');
    
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
