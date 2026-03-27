import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import InlineRoomSelector from '../src/components/BuildingSelector/InlineRoomSelector';
import { useFloorPlanState } from '../src/hooks/useFloorPlanState';
import { useRoomList } from '../src/hooks/useRoomList';

jest.mock('../src/hooks/useFloorPlanState');
jest.mock('../src/hooks/useRoomList');

jest.mock('../src/data/buildings', () => ({
  buildings: [
    {
      id: 'Hall Building',
      address: '1455 De Maisonneuve Blvd. W.',
      labelCoord: { latitude: 45.497, longitude: -73.579 },
    },
    {
      id: 'EV Building',
      address: '1515 St. Catherine St. W.',
      labelCoord: { latitude: 45.495, longitude: -73.578 },
    },
  ],
}));

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockMaterialCommunityIcons(props: any) {
    return <Text {...props}>{props.name}</Text>;
  };
});

const mockedUseFloorPlanState = useFloorPlanState as jest.Mock;
const mockedUseRoomList = useRoomList as jest.Mock;

describe('InlineRoomSelector', () => {
  const defaultOnChange = jest.fn();
  const defaultSetCurrentFloor = jest.fn();

  const baseFloorPlanState = {
    currentFloor: '8',
    availableFloors: ['8', '9'],
    buildingPrefix: 'H-',
    rawSvgContent: '<svg />',
    setCurrentFloor: defaultSetCurrentFloor,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseFloorPlanState.mockReturnValue(baseFloorPlanState);
    mockedUseRoomList.mockReturnValue(['820', '821', '822']);
  });

  it('renders placeholder values when no building is selected', () => {
    const { getByText } = render(
      <InlineRoomSelector
        label="Start"
        buildingId={null}
        selection={null}
        onChange={defaultOnChange}
      />
    );

    expect(getByText('Floor')).toBeTruthy();
    expect(getByText('Room')).toBeTruthy();
    expect(getByText('No building selected')).toBeTruthy();
  });

  it('renders selected building text when building is provided', () => {
    const { getByText } = render(
      <InlineRoomSelector
        label="Start"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '8', room: '820' }}
        onChange={defaultOnChange}
      />
    );

    expect(getByText('Building: Hall Building • Floor 8 • H-820')).toBeTruthy();
  });

  it('shows selected floor in floor input', () => {
    const { getByText } = render(
      <InlineRoomSelector
        label="Start"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '8', room: '' }}
        onChange={defaultOnChange}
      />
    );

    expect(getByText('Floor: 8')).toBeTruthy();
  });

  it('shows selected room in room input', () => {
    const { getByText } = render(
      <InlineRoomSelector
        label="Start"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '8', room: '821' }}
        onChange={defaultOnChange}
      />
    );

    expect(getByText('Room: H-821')).toBeTruthy();
  });

  it('initializes first floor when no floor is selected and floors exist', async () => {
    render(
      <InlineRoomSelector
        label="Start"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '', room: '' }}
        onChange={defaultOnChange}
      />
    );

    await waitFor(() => {
      expect(defaultSetCurrentFloor).toHaveBeenCalledWith('8');
      expect(defaultOnChange).toHaveBeenCalledWith({
        buildingId: 'Hall Building',
        floor: '8',
        room: '',
      });
    });
  });

  it('resets to first floor when selected floor does not exist', async () => {
    render(
      <InlineRoomSelector
        label="Start"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '99', room: '' }}
        onChange={defaultOnChange}
      />
    );

    await waitFor(() => {
      expect(defaultSetCurrentFloor).toHaveBeenCalledWith('8');
      expect(defaultOnChange).toHaveBeenCalledWith({
        buildingId: 'Hall Building',
        floor: '8',
        room: '',
      });
    });
  });

  it('syncs currentFloor when selected floor differs from hook currentFloor', async () => {
    mockedUseFloorPlanState.mockReturnValue({
      ...baseFloorPlanState,
      currentFloor: '8',
    });

    render(
      <InlineRoomSelector
        label="Start"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '9', room: '' }}
        onChange={defaultOnChange}
      />
    );

    await waitFor(() => {
      expect(defaultSetCurrentFloor).toHaveBeenCalledWith('9');
    });
  });

  it('clears selected room when room no longer exists on current floor', async () => {
    mockedUseRoomList.mockReturnValue(['820', '821']);

    render(
      <InlineRoomSelector
        label="Start"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '8', room: '999' }}
        onChange={defaultOnChange}
      />
    );

    await waitFor(() => {
      expect(defaultOnChange).toHaveBeenCalledWith({
        buildingId: 'Hall Building',
        floor: '8',
        room: '',
      });
    });
  });

  it('closes both dropdowns when building becomes unavailable', async () => {
    const { rerender, queryByText } = render(
      <InlineRoomSelector
        label="Start"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '8', room: '' }}
        onChange={defaultOnChange}
      />
    );

    fireEvent.press(queryByText('Floor: 8')!);

    await waitFor(() => {
      expect(queryByText('Floor 8')).toBeTruthy();
    });

    rerender(
      <InlineRoomSelector
        label="Start"
        buildingId={null}
        selection={null}
        onChange={defaultOnChange}
      />
    );

    await waitFor(() => {
      expect(queryByText('Floor 8')).toBeNull();
    });
  });

  it('opens floor dropdown when floor input is pressed', async () => {
    const { getByText } = render(
      <InlineRoomSelector
        label="Start"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '8', room: '' }}
        onChange={defaultOnChange}
      />
    );

    fireEvent.press(getByText('Floor: 8'));

    await waitFor(() => {
      expect(getByText('Floor 8')).toBeTruthy();
      expect(getByText('Floor 9')).toBeTruthy();
    });
  });

  it('selects a floor and clears room when floor is chosen', async () => {
    const { getByText } = render(
      <InlineRoomSelector
        label="Start"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '8', room: '820' }}
        onChange={defaultOnChange}
      />
    );

    fireEvent.press(getByText('Floor: 8'));
    await waitFor(() => {
      expect(getByText('Floor 9')).toBeTruthy();
    });

    fireEvent.press(getByText('Floor 9'));

    await waitFor(() => {
      expect(defaultSetCurrentFloor).toHaveBeenCalledWith('9');
      expect(defaultOnChange).toHaveBeenCalledWith({
        buildingId: 'Hall Building',
        floor: '9',
        room: '',
      });
    });
  });

  it('opens room dropdown when room input is pressed', async () => {
    const { getByText } = render(
      <InlineRoomSelector
        label="Start"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '8', room: '' }}
        onChange={defaultOnChange}
      />
    );

    fireEvent.press(getByText('Room: Select'));

    await waitFor(() => {
      expect(getByText('H-820')).toBeTruthy();
      expect(getByText('H-821')).toBeTruthy();
      expect(getByText('H-822')).toBeTruthy();
    });
  });

  it('selects a room when pressed', async () => {
    const { getByText } = render(
      <InlineRoomSelector
        label="Start"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '8', room: '' }}
        onChange={defaultOnChange}
      />
    );

    fireEvent.press(getByText('Room: Select'));

    await waitFor(() => {
      expect(getByText('H-821')).toBeTruthy();
    });

    fireEvent.press(getByText('H-821'));

    await waitFor(() => {
      expect(defaultOnChange).toHaveBeenCalledWith({
        buildingId: 'Hall Building',
        floor: '8',
        room: '821',
      });
    });
  });

  it('shows helper text when no rooms exist for current floor', async () => {
    mockedUseRoomList.mockReturnValue([]);

    const { getByText } = render(
      <InlineRoomSelector
        label="Start"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '8', room: '' }}
        onChange={defaultOnChange}
      />
    );

    fireEvent.press(getByText('Room: Select'));

    await waitFor(() => {
      expect(getByText('No rooms available for this floor.')).toBeTruthy();
    });
  });

  it('does not open floor dropdown when floor input is disabled', async () => {
    const { getByText, queryByText } = render(
      <InlineRoomSelector
        label="Start"
        buildingId={null}
        selection={null}
        onChange={defaultOnChange}
      />
    );

    fireEvent.press(getByText('Floor'));

    await waitFor(() => {
      expect(queryByText('Floor 8')).toBeNull();
    });
  });

  it('does not open room dropdown when room input is disabled', async () => {
    const { getByText, queryByText } = render(
      <InlineRoomSelector
        label="Start"
        buildingId={null}
        selection={null}
        onChange={defaultOnChange}
      />
    );

    fireEvent.press(getByText('Room'));

    await waitFor(() => {
      expect(queryByText('H-820')).toBeNull();
    });
  });

  it('closes room dropdown when floor dropdown is opened', async () => {
    const { getByText, queryByText } = render(
      <InlineRoomSelector
        label="Start"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '8', room: '' }}
        onChange={defaultOnChange}
      />
    );

    fireEvent.press(getByText('Room: Select'));
    await waitFor(() => {
      expect(getByText('H-820')).toBeTruthy();
    });

    fireEvent.press(getByText('Floor: 8'));

    await waitFor(() => {
      expect(getByText('Floor 8')).toBeTruthy();
      expect(queryByText('H-820')).toBeNull();
    });
  });

  it('closes floor dropdown when room dropdown is opened', async () => {
    const { getByText, queryByText } = render(
      <InlineRoomSelector
        label="Start"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '8', room: '' }}
        onChange={defaultOnChange}
      />
    );

    fireEvent.press(getByText('Floor: 8'));
    await waitFor(() => {
      expect(getByText('Floor 8')).toBeTruthy();
    });

    fireEvent.press(getByText('Room: Select'));

    await waitFor(() => {
      expect(getByText('H-820')).toBeTruthy();
      expect(queryByText('Floor 8')).toBeNull();
    });
  });

  it('passes correct arguments to useFloorPlanState', () => {
    render(
      <InlineRoomSelector
        label="Destination"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '9', room: '822' }}
        onChange={defaultOnChange}
      />
    );

    expect(mockedUseFloorPlanState).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'Hall Building' }),
      '822',
      '',
      '9'
    );
  });

  it('passes correct arguments to useRoomList', () => {
    render(
      <InlineRoomSelector
        label="Destination"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '8', room: '820' }}
        onChange={defaultOnChange}
      />
    );

    expect(mockedUseRoomList).toHaveBeenCalledWith('<svg />', 'Hall Building', '8');
  });

  it('shows room placeholder when building exists but no room is selected', () => {
    const { getByText } = render(
      <InlineRoomSelector
        label="Destination"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '8', room: '' }}
        onChange={defaultOnChange}
      />
    );

    expect(getByText('Room: Select')).toBeTruthy();
  });

  it('shows floor placeholder when building exists but no floor is selected before auto-init', () => {
    mockedUseFloorPlanState.mockReturnValue({
      ...baseFloorPlanState,
      currentFloor: '',
      availableFloors: [],
    });

    const { getByText } = render(
      <InlineRoomSelector
        label="Destination"
        buildingId="Hall Building"
        selection={{ buildingId: 'Hall Building', floor: '', room: '' }}
        onChange={defaultOnChange}
      />
    );

    expect(getByText('Floor: Select')).toBeTruthy();
  });
});