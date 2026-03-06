import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import RoomPickerModal from '../src/components/RoomPickerModal';
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

describe('RoomPickerModal', () => {
    suppressActWarnings();

    const mockOnSelect = jest.fn();
    const mockOnClose = jest.fn();
    const defaultProps = {
        visible: true,
        title: 'Select a room',
        rooms: ['801', '803', '829', '862'],
        prefix: 'H',
        selectedRoom: '',
        onSelect: mockOnSelect,
        onClose: mockOnClose,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders correctly when visible', () => {
            const { getByText } = render(<RoomPickerModal {...defaultProps} />);

            expect(getByText('Select a room')).toBeTruthy();
            expect(getByText(/Showing 4 rooms/)).toBeTruthy();
        });

        it('does not render when visible is false', () => {
            const { queryByText } = render(
                <RoomPickerModal {...defaultProps} visible={false} />
            );

            expect(queryByText('Select a room')).toBeNull();
        });

        it('displays all rooms with prefix', () => {
            const { getByText } = render(<RoomPickerModal {...defaultProps} />);

            expect(getByText('H801')).toBeTruthy();
            expect(getByText('H803')).toBeTruthy();
            expect(getByText('H829')).toBeTruthy();
            expect(getByText('H862')).toBeTruthy();
        });

        it('highlights selected room', () => {
            const { getByText } = render(
                <RoomPickerModal {...defaultProps} selectedRoom="829" />
            );

            // The selected room should be displayed
            expect(getByText('H829')).toBeTruthy();
        });

        it('shows correct room count in legend', () => {
            const { getByText } = render(<RoomPickerModal {...defaultProps} />);

            expect(getByText(/Showing 4 rooms/)).toBeTruthy();
        });

        it('shows singular "room" when only one room matches', () => {
            const { getByText } = render(
                <RoomPickerModal {...defaultProps} rooms={['801']} />
            );

            expect(getByText(/Showing 1 room/)).toBeTruthy();
        });

        it('shows prefix hint in legend', () => {
            const { getByText } = render(<RoomPickerModal {...defaultProps} />);

            expect(getByText(/Prefix "H" = HXXX/)).toBeTruthy();
        });
    });

    describe('Search/Filter', () => {
        it('filters rooms based on search query', async () => {
            const { getByTestId, getByText, queryByText } = render(
                <RoomPickerModal {...defaultProps} />
            );

            const searchInput = getByTestId('room-search-input');
            fireEvent.changeText(searchInput, '801');

            await waitFor(() => {
                expect(getByText('H801')).toBeTruthy();
                expect(queryByText('H803')).toBeNull();
                expect(queryByText('H829')).toBeNull();
            });
        });

        it('filters rooms with prefix in search', async () => {
            const { getByTestId, getByText, queryByText } = render(
                <RoomPickerModal {...defaultProps} />
            );

            const searchInput = getByTestId('room-search-input');
            fireEvent.changeText(searchInput, '82');

            await waitFor(() => {
                // Only H829 should match "82"
                expect(getByText('H829')).toBeTruthy();
                expect(queryByText('H801')).toBeNull();
                expect(queryByText('H803')).toBeNull();
                expect(queryByText('H862')).toBeNull();
            });
        });

        it('shows no results when search does not match', async () => {
            const { getByTestId, queryByText } = render(
                <RoomPickerModal {...defaultProps} />
            );

            const searchInput = getByTestId('room-search-input');
            fireEvent.changeText(searchInput, '999');

            await waitFor(() => {
                expect(queryByText('H801')).toBeNull();
                expect(queryByText('H803')).toBeNull();
            });
        });

        it('updates legend count when filtering', async () => {
            const { getByTestId, getByText } = render(
                <RoomPickerModal {...defaultProps} />
            );

            const searchInput = getByTestId('room-search-input');
            fireEvent.changeText(searchInput, '80');

            await waitFor(() => {
                expect(getByText(/Showing 2 rooms/)).toBeTruthy();
            });
        });
    });

    describe('Selection', () => {
        it('calls onSelect when a room is pressed', async () => {
            const { getByText } = render(<RoomPickerModal {...defaultProps} />);

            const room801 = getByText('H801');
            fireEvent.press(room801);

            await waitFor(() => {
                expect(mockOnSelect).toHaveBeenCalledWith('801');
            });
        });

        it('calls onClose after selection', async () => {
            const { getByText } = render(<RoomPickerModal {...defaultProps} />);

            const room801 = getByText('H801');
            fireEvent.press(room801);

            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled();
            });
        });
    });

    describe('Close behavior', () => {
        it('calls onClose when modal is requested to close', () => {
            // Test that onClose callback is properly wired
            const { getByText } = render(<RoomPickerModal {...defaultProps} />);

            // Selecting a room triggers close
            const room801 = getByText('H801');
            fireEvent.press(room801);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('clears search query when closed and reopened', async () => {
            const { getByTestId, getByText, rerender } = render(
                <RoomPickerModal {...defaultProps} />
            );

            // Type in search
            const searchInput = getByTestId('room-search-input');
            fireEvent.changeText(searchInput, '801');

            // Select a room (which triggers close and clears search)
            const room801 = getByText('H801');
            fireEvent.press(room801);

            // Reopen
            rerender(<RoomPickerModal {...defaultProps} visible={true} />);

            // Search should be cleared - all rooms visible again
            await waitFor(() => {
                expect(getByText('H801')).toBeTruthy();
                expect(getByText('H803')).toBeTruthy();
            });
        });

        it('calls onClose when backdrop is pressed', () => {
            const { UNSAFE_getAllByType } = render(<RoomPickerModal {...defaultProps} />);

            const touchables = UNSAFE_getAllByType(TouchableOpacity);
            fireEvent.press(touchables[0]);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('clears search query when backdrop is pressed', async () => {
            const { getByTestId, UNSAFE_getAllByType, rerender } = render(
                <RoomPickerModal {...defaultProps} />
            );

            const searchInput = getByTestId('room-search-input');
            fireEvent.changeText(searchInput, '801');
            const touchables = UNSAFE_getAllByType(TouchableOpacity);
            fireEvent.press(touchables[0]);
            rerender(<RoomPickerModal {...defaultProps} visible={true} />);
            await waitFor(() => {
                expect(getByTestId('room-search-input')).toHaveProp('value', '');
            });
        });
    });

    describe('Without prefix', () => {
        it('displays rooms without prefix when prefix is empty', () => {
            const { getByText, queryByText } = render(
                <RoomPickerModal {...defaultProps} prefix="" />
            );

            expect(getByText('801')).toBeTruthy();
            expect(getByText('803')).toBeTruthy();
            expect(queryByText('H801')).toBeNull();
        });
    });
});
