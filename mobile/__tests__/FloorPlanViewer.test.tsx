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

    it('highlights start room with green when startRoom prop is provided', () => {
        const buildingWithSvg = {
            id: 'Hall Building',
            address: '1455 De Maisonneuve Blvd. W.',
            floorPlans: {
                '8': '<svg><rect inkscape:label="803" style="fill:#da3636;" /></svg>',
            },
        };

        const { getByTestId } = render(
            <FloorPlanViewer 
                building={buildingWithSvg} 
                floorLevel="8" 
                onClose={mockOnClose} 
                startRoom="803"
            />
        );

        const svgMock = getByTestId('svg-xml');
        expect(svgMock.props.xml).toContain('fill:#4CAF50');
        expect(svgMock.props.xml).toContain('stroke:#2E7D32');
    });

    it('highlights next room with blue when nextRoom prop is provided', () => {
        const buildingWithSvg = {
            id: 'Hall Building',
            address: '1455 De Maisonneuve Blvd. W.',
            floorPlans: {
                '8': '<svg><rect inkscape:label="805" style="fill:#da3636;" /></svg>',
            },
        };

        const { getByTestId } = render(
            <FloorPlanViewer 
                building={buildingWithSvg} 
                floorLevel="8" 
                onClose={mockOnClose} 
                nextRoom="805"
            />
        );

        const svgMock = getByTestId('svg-xml');
        expect(svgMock.props.xml).toContain('fill:#2196F3');
        expect(svgMock.props.xml).toContain('stroke:#1565C0');
    });

    it('highlights both startRoom and nextRoom with different colors', () => {
        const buildingWithSvg = {
            id: 'Hall Building',
            address: '1455 De Maisonneuve Blvd. W.',
            floorPlans: {
                '8': '<svg><rect inkscape:label="803" style="fill:#da3636;" /><rect inkscape:label="805" style="fill:#da3636;" /></svg>',
            },
        };

        const { getByTestId } = render(
            <FloorPlanViewer 
                building={buildingWithSvg} 
                floorLevel="8" 
                onClose={mockOnClose} 
                startRoom="803"
                nextRoom="805"
            />
        );

        const svgMock = getByTestId('svg-xml');
        // Start room should be green
        expect(svgMock.props.xml).toContain('fill:#4CAF50');
        expect(svgMock.props.xml).toContain('stroke:#2E7D32');
        // Next room should be blue
        expect(svgMock.props.xml).toContain('fill:#2196F3');
        expect(svgMock.props.xml).toContain('stroke:#1565C0');
    });

    it('highlights multiple rooms with same label (duplicates) for startRoom', () => {
        const buildingWithDuplicateLabels = {
            id: 'Hall Building',
            address: '1455 De Maisonneuve Blvd. W.',
            floorPlans: {
                '8': '<svg><rect inkscape:label="829" style="fill:#da3636;" /><path inkscape:label="829" style="fill:#da3636;" /></svg>',
            },
        };

        const { getByTestId } = render(
            <FloorPlanViewer 
                building={buildingWithDuplicateLabels} 
                floorLevel="8" 
                onClose={mockOnClose} 
                startRoom="829"
            />
        );

        const svgMock = getByTestId('svg-xml');
        const xmlContent = svgMock.props.xml;
        // Count occurrences of green highlight color
        const highlightCount = (xmlContent.match(/fill:#4CAF50/g) || []).length;
        expect(highlightCount).toBe(2);
    });

    it('highlights multiple rooms with same label (duplicates) for nextRoom', () => {
        const buildingWithDuplicateLabels = {
            id: 'Hall Building',
            address: '1455 De Maisonneuve Blvd. W.',
            floorPlans: {
                '8': '<svg><rect inkscape:label="829" style="fill:#da3636;" /><path inkscape:label="829" style="fill:#da3636;" /></svg>',
            },
        };

        const { getByTestId } = render(
            <FloorPlanViewer 
                building={buildingWithDuplicateLabels} 
                floorLevel="8" 
                onClose={mockOnClose} 
                nextRoom="829"
            />
        );

        const svgMock = getByTestId('svg-xml');
        const xmlContent = svgMock.props.xml;
        // Count occurrences of blue highlight color
        const highlightCount = (xmlContent.match(/fill:#2196F3/g) || []).length;
        expect(highlightCount).toBe(2);
    });

    it('does not modify SVG when startRoom and nextRoom are undefined', () => {
        const buildingWithSvg = {
            id: 'Hall Building',
            address: '1455 De Maisonneuve Blvd. W.',
            floorPlans: {
                '8': '<svg><rect inkscape:label="803" style="fill:#da3636;" /></svg>',
            },
        };

        const { getByTestId } = render(
            <FloorPlanViewer 
                building={buildingWithSvg} 
                floorLevel="8" 
                onClose={mockOnClose}
                startRoom={undefined}
                nextRoom={undefined}
            />
        );

        const svgMock = getByTestId('svg-xml');
        expect(svgMock.props.xml).not.toContain('fill:#4CAF50');
        expect(svgMock.props.xml).not.toContain('fill:#2196F3');
        expect(svgMock.props.xml).toContain('fill:#da3636');
    });

    it('does not modify SVG when startRoom label is not found', () => {
        const buildingWithSvg = {
            id: 'Hall Building',
            address: '1455 De Maisonneuve Blvd. W.',
            floorPlans: {
                '8': '<svg><rect inkscape:label="803" style="fill:#da3636;" /></svg>',
            },
        };

        const { getByTestId } = render(
            <FloorPlanViewer 
                building={buildingWithSvg} 
                floorLevel="8" 
                onClose={mockOnClose} 
                startRoom="999"
            />
        );

        const svgMock = getByTestId('svg-xml');
        expect(svgMock.props.xml).not.toContain('fill:#4CAF50');
        expect(svgMock.props.xml).toContain('fill:#da3636');
    });

    it('does not modify SVG when nextRoom label is not found', () => {
        const buildingWithSvg = {
            id: 'Hall Building',
            address: '1455 De Maisonneuve Blvd. W.',
            floorPlans: {
                '8': '<svg><rect inkscape:label="803" style="fill:#da3636;" /></svg>',
            },
        };

        const { getByTestId } = render(
            <FloorPlanViewer 
                building={buildingWithSvg} 
                floorLevel="8" 
                onClose={mockOnClose} 
                nextRoom="999"
            />
        );

        const svgMock = getByTestId('svg-xml');
        expect(svgMock.props.xml).not.toContain('fill:#2196F3');
        expect(svgMock.props.xml).toContain('fill:#da3636');
    });

    it('highlights startRoom when element has NO style attribute (adds style to end)', () => {
        const buildingWithSvg = {
            id: 'Hall Building',
            address: '1455 De Maisonneuve Blvd. W.',
            floorPlans: {
                '8': '<svg><rect inkscape:label="803" /></svg>',
            },
        };

        const { getByTestId } = render(
            <FloorPlanViewer 
                building={buildingWithSvg} 
                floorLevel="8" 
                onClose={mockOnClose} 
                startRoom="803"
            />
        );

        const svgMock = getByTestId('svg-xml');
        expect(svgMock.props.xml).toContain('fill:#4CAF50');
        expect(svgMock.props.xml).toContain('stroke:#2E7D32');
    });

    it('highlights nextRoom when element has NO style attribute (adds style to end)', () => {
        const buildingWithSvg = {
            id: 'Hall Building',
            address: '1455 De Maisonneuve Blvd. W.',
            floorPlans: {
                '8': '<svg><path inkscape:label="805" /></svg>',
            },
        };

        const { getByTestId } = render(
            <FloorPlanViewer 
                building={buildingWithSvg} 
                floorLevel="8" 
                onClose={mockOnClose} 
                nextRoom="805"
            />
        );

        const svgMock = getByTestId('svg-xml');
        expect(svgMock.props.xml).toContain('fill:#2196F3');
        expect(svgMock.props.xml).toContain('stroke:#1565C0');
    });

    it('uses default values for startRoom (829) and nextRoom (862)', () => {
        const buildingWithSvg = {
            id: 'Hall Building',
            address: '1455 De Maisonneuve Blvd. W.',
            floorPlans: {
                '8': '<svg><rect inkscape:label="829" style="fill:#da3636;" /><rect inkscape:label="862" style="fill:#da3636;" /></svg>',
            },
        };

        const { getByTestId, getByText } = render(
            <FloorPlanViewer 
                building={buildingWithSvg} 
                floorLevel="8" 
                onClose={mockOnClose}
            />
        );

        const svgMock = getByTestId('svg-xml');
        expect(svgMock.props.xml).toContain('fill:#4CAF50');
        expect(svgMock.props.xml).toContain('fill:#2196F3');
        expect(getByText('Hall Building - Floor 8')).toBeTruthy();
    });
});

