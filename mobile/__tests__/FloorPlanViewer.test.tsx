import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FloorPlanViewer from '../src/components/FloorPlanViewer';

jest.mock('react-native-svg', () => {
    const { View } = require('react-native');
    return {
        SvgXml: (props: any) => (
            <View 
                testID={props.testID || 'svg-xml'} 
                {...props} 
            />
        ),
    };
});

jest.mock('@expo/vector-icons', () => {
    const { Text } = require('react-native');
    return {
        MaterialCommunityIcons: (props: any) => (
            <Text {...props}>{props.name}</Text>
        ),
    };
});

describe('FloorPlanViewer', () => {
    const mockOnClose = jest.fn();
    const mockBuilding = {
        id: 'Hall Building',
        address: '1455 De Maisonneuve Blvd. W.',
        floorPlans: {
            '8': '<svg>Floor 8</svg>',
            '9': '<svg>Floor 9</svg>',
        },
    };

    it('renders correctly when building and floor exist', () => {
        const { getByText, getByTestId } = render(
            <FloorPlanViewer building={mockBuilding} floorLevel="8" onClose={mockOnClose} />
        );

        expect(getByText('Hall Building - Floor 8')).toBeTruthy();
        expect(getByText('1455 De Maisonneuve Blvd. W.')).toBeTruthy();
        expect(getByTestId('svg-xml')).toBeTruthy();
    });

    it('returns null if building is null', () => {
        const { queryByText } = render(
            <FloorPlanViewer building={null} floorLevel="8" onClose={mockOnClose} />
        );
        expect(queryByText('Hall Building - Floor 8')).toBeNull();
    });

    it('returns null if floorLevel does not exist in building data', () => {
        const { queryByText } = render(
            <FloorPlanViewer building={mockBuilding} floorLevel="99" onClose={mockOnClose} />
        );
        expect(queryByText('Hall Building - Floor 99')).toBeNull();
    });

    it('calls onClose when close button is pressed', () => {
        const { getByTestId } = render(
            <FloorPlanViewer building={mockBuilding} floorLevel="8" onClose={mockOnClose} />
        );

        const closeButton = getByTestId('floor-plan-close');
        fireEvent.press(closeButton);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles SVG error log', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        const { getByTestId } = render(
            <FloorPlanViewer building={mockBuilding} floorLevel="8" onClose={mockOnClose} />
        );
        
        const svgMock = getByTestId('svg-xml');
        
        svgMock.props.onError(new Error('Test SVG Error'));
        
        expect(consoleSpy).toHaveBeenCalledWith("SVG Error: ", expect.any(Error));
        consoleSpy.mockRestore();
    });
});
