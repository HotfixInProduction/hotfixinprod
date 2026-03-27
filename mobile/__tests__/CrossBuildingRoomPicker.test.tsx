import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CrossBuildingRoomPicker from '../src/components/CrossBuildingRoomPicker';
import { suppressActWarnings } from './utils/testUtils';

// Mock vector-icons
jest.mock('@expo/vector-icons', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        MaterialCommunityIcons: (props: any) => React.createElement(Text, {
            testID: `icon-${props.name}`,
        }, props.name),
    };
});

// Mock the useAllRooms hook
jest.mock('../src/hooks/useAllRooms', () => ({
    useRoomsForBuilding: jest.fn((buildingId: string) => {
        const roomsByBuilding: Record<string, any[]> = {
            'Hall Building': [
                { room: '801', prefix: 'H-', buildingId: 'Hall Building', floor: '8', displayLabel: 'H-801 (Floor 8)' },
                { room: '802', prefix: 'H-', buildingId: 'Hall Building', floor: '8', displayLabel: 'H-802 (Floor 8)' },
                { room: '829', prefix: 'H-', buildingId: 'Hall Building', floor: '8', displayLabel: 'H-829 (Floor 8)' },
                { room: '901', prefix: 'H-', buildingId: 'Hall Building', floor: '9', displayLabel: 'H-901 (Floor 9)' },
            ],
            'MB': [
                { room: '101', prefix: 'MB-', buildingId: 'MB', floor: '1', displayLabel: 'MB-101 (Floor 1)' },
                { room: '102', prefix: 'MB-', buildingId: 'MB', floor: '1', displayLabel: 'MB-102 (Floor 1)' },
            ],
        };
        return roomsByBuilding[buildingId] || [];
    }),
}));

describe('CrossBuildingRoomPicker', () => {
    suppressActWarnings();

    const mockOnSelect = jest.fn();
    const mockOnClose = jest.fn();

    const defaultProps = {
        visible: true,
        title: 'Select a room',
        buildingId: 'Hall Building',
        onSelect: mockOnSelect,
        onClose: mockOnClose,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders when visible is true', () => {
            const { getByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            expect(getByText('Select a room')).toBeTruthy();
        });

        it('does not render when visible is false', () => {
            const { queryByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} visible={false} />
            );

            expect(queryByText('Select a room')).toBeNull();
        });

        it('renders all rooms for the building', () => {
            const { getByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            expect(getByText('H-801')).toBeTruthy();
            expect(getByText('H-802')).toBeTruthy();
            expect(getByText('H-829')).toBeTruthy();
            expect(getByText('H-901')).toBeTruthy();
        });

        it('displays correct room count in legend', () => {
            const { getByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            expect(getByText('Showing 4 rooms')).toBeTruthy();
        });

        it('shows singular "room" when only one room matches', () => {
            const { getByTestId, getByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            const searchInput = getByTestId('cross-building-room-search');
            fireEvent.changeText(searchInput, '901');

            expect(getByText('Showing 1 room')).toBeTruthy();
        });

        it('renders search input with placeholder', () => {
            const { getByTestId } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            const searchInput = getByTestId('cross-building-room-search');
            expect(searchInput.props.placeholder).toContain('Search');
        });
    });

    describe('Search/Filter', () => {
        it('filters rooms based on room number search', () => {
            const { getByTestId, getByText, queryByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            const searchInput = getByTestId('cross-building-room-search');
            fireEvent.changeText(searchInput, '801');

            expect(getByText('H-801')).toBeTruthy();
            expect(queryByText('H-802')).toBeNull();
            expect(queryByText('H-829')).toBeNull();
        });

        it('filters rooms based on partial room number', () => {
            const { getByTestId, getByText, queryByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            const searchInput = getByTestId('cross-building-room-search');
            fireEvent.changeText(searchInput, '80');

            expect(getByText('H-801')).toBeTruthy();
            expect(getByText('H-802')).toBeTruthy();
            expect(queryByText('H-829')).toBeNull();
        });

        it('filters rooms based on floor number', () => {
            const { getByTestId, getByText, queryByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            const searchInput = getByTestId('cross-building-room-search');
            fireEvent.changeText(searchInput, 'Floor 9');

            expect(getByText('H-901')).toBeTruthy();
            expect(queryByText('H-801')).toBeNull();
        });

        it('is case-insensitive', () => {
            const { getByTestId, getByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            const searchInput = getByTestId('cross-building-room-search');
            fireEvent.changeText(searchInput, 'floor 8');

            // Should still match rooms on floor 8
            expect(getByText('H-801')).toBeTruthy();
        });

        it('shows no results when search does not match', () => {
            const { getByTestId, queryByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            const searchInput = getByTestId('cross-building-room-search');
            fireEvent.changeText(searchInput, '999');

            expect(queryByText('Showing 0 rooms')).toBeTruthy();
            expect(queryByText('H-801')).toBeNull();
        });

        it('updates legend count when filtering', () => {
            const { getByTestId, getByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            const searchInput = getByTestId('cross-building-room-search');
            fireEvent.changeText(searchInput, '80');

            expect(getByText('Showing 2 rooms')).toBeTruthy();
        });

        it('clears filter and shows all rooms when search is cleared', () => {
            const { getByTestId, getByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            const searchInput = getByTestId('cross-building-room-search');
            fireEvent.changeText(searchInput, '801');
            fireEvent.changeText(searchInput, '');

            expect(getByText('Showing 4 rooms')).toBeTruthy();
            expect(getByText('H-801')).toBeTruthy();
            expect(getByText('H-829')).toBeTruthy();
        });
    });

    describe('Selection', () => {
        it('calls onSelect when a room is pressed', async () => {
            const { getByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            const room801 = getByText('H-801');
            fireEvent.press(room801);

            await waitFor(() => {
                expect(mockOnSelect).toHaveBeenCalledWith({
                    buildingId: 'Hall Building',
                    floor: '8',
                    room: '801',
                });
            });
        });

        it('calls onClose after selection', async () => {
            const { getByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            const room801 = getByText('H-801');
            fireEvent.press(room801);

            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled();
            });
        });

        it('clears search after selection', async () => {
            const { getByTestId, getByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            const searchInput = getByTestId('cross-building-room-search');
            fireEvent.changeText(searchInput, '801');

            const room801 = getByText('H-801');
            fireEvent.press(room801);

            // After selection, search should be cleared
            await waitFor(() => {
                expect(searchInput.props.value).toBe('');
            });
        });

        it('selects different rooms from different floors', async () => {
            const { getByText, rerender } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            let room901 = getByText('H-901');
            fireEvent.press(room901);

            expect(mockOnSelect).toHaveBeenCalledWith({
                buildingId: 'Hall Building',
                floor: '9',
                room: '901',
            });

            // Reset and test another room
            jest.clearAllMocks();
            rerender(<CrossBuildingRoomPicker {...defaultProps} />);

            const room801 = getByText('H-801');
            fireEvent.press(room801);

            expect(mockOnSelect).toHaveBeenCalledWith({
                buildingId: 'Hall Building',
                floor: '8',
                room: '801',
            });
        });
    });

    describe('Close behavior', () => {
        it('calls onClose when modal is closed', async () => {
            const { getByTestId, UNSAFE_getAllByType } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            // Trigger a room selection to close the modal
            const room801 = getByTestId('room-item-H-801');
            fireEvent.press(room801);

            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled();
            });
        });

        it('clears search when modal closes via selection', async () => {
            const { getByTestId } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            const searchInput = getByTestId('cross-building-room-search');
            fireEvent.changeText(searchInput, '801');
            expect(searchInput.props.value).toBe('801');

            const room801 = getByTestId('room-item-H-801');
            fireEvent.press(room801);

            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled();
            });
        });
    });

    describe('Different buildings', () => {
        it('shows correct rooms for different building IDs', () => {
            const { getByText, queryByText } = render(
                <CrossBuildingRoomPicker 
                    {...defaultProps} 
                    buildingId="MB"
                />
            );

            expect(getByText('MB-101')).toBeTruthy();
            expect(getByText('MB-102')).toBeTruthy();
            expect(queryByText('H-801')).toBeNull();
        });

        it('updates rooms when buildingId prop changes', () => {
            const { rerender, getByText, queryByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} buildingId="Hall Building" />
            );

            expect(getByText('H-801')).toBeTruthy();

            rerender(
                <CrossBuildingRoomPicker {...defaultProps} buildingId="MB" />
            );

            expect(getByText('MB-101')).toBeTruthy();
            expect(queryByText('H-801')).toBeNull();
        });
    });

    describe('Room display labels', () => {
        it('displays full room label with prefix and floor', () => {
            const { getByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            // Main label should have prefix and room
            expect(getByText('H-801')).toBeTruthy();
            // Sub label should have floor info
            expect(getByText('H-801 (Floor 8)')).toBeTruthy();
        });

        it('displays floor information in details', () => {
            const { getByText } = render(
                <CrossBuildingRoomPicker {...defaultProps} />
            );

            expect(getByText('H-801 (Floor 8)')).toBeTruthy();
            expect(getByText('H-901 (Floor 9)')).toBeTruthy();
        });
    });

    describe('Empty states', () => {
        it('handles building with no rooms', () => {
            const { getByText } = render(
                <CrossBuildingRoomPicker 
                    {...defaultProps} 
                    buildingId="Unknown Building"
                />
            );

            expect(getByText('Showing 0 rooms')).toBeTruthy();
        });
    });
});
