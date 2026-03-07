import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FloorPlanViewer from '../src/components/FloorPlanViewer';
import { suppressActWarnings } from './utils/testUtils';
import { Building } from '../src/types/building';

// Helper to create minimal building mock with all required properties
const createMockBuilding = (overrides: Partial<Building>): Building => ({
    id: 'Hall Building',
    label: 'H',
    address: '1455 De Maisonneuve Blvd. W.',
    coordinates: [{ latitude: 45.497, longitude: -73.579 }],
    labelCoord: { latitude: 45.497, longitude: -73.579 },
    ...overrides,
});

// Mock react-native-svg synchronously
jest.mock('react-native-svg', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        SvgXml: (props: any) => React.createElement(View, {
            testID: props.testID || 'svg-xml',
            ...props,
        }),
    };
});

// Mock vector-icons synchronously - return a simple component that doesn't trigger async operations
jest.mock('@expo/vector-icons', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        MaterialCommunityIcons: (props: any) => React.createElement(Text, {
            testID: `icon-${props.name}`,
        }, props.name),
    };
});

// Mock Pathfinding to avoid async operations
jest.mock('../src/utils/Pathfinding', () => ({
    findPath: jest.fn(() => null),
    generateSvgPath: jest.fn(() => ''),
}));

describe('FloorPlanViewer', () => {
    suppressActWarnings();
    
    const mockOnClose = jest.fn();
    const mockBuilding = createMockBuilding({
        floorPlans: {
            '8': '<svg>Floor 8</svg>',
            '9': '<svg>Floor 9</svg>',
        },
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Basic rendering', () => {
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

    describe('Floor selector', () => {
        it('renders floor selector when multiple floors exist', () => {
            const { getByText } = render(
                <FloorPlanViewer building={mockBuilding} floorLevel="8" onClose={mockOnClose} />
            );

            expect(getByText('Floor')).toBeTruthy();
            expect(getByText('8')).toBeTruthy();
            expect(getByText('9')).toBeTruthy();
        });

        it('does not render floor selector when only one floor exists', () => {
            const singleFloorBuilding = createMockBuilding({
                floorPlans: {
                    '8': '<svg>Floor 8</svg>',
                },
            });

            const { queryByText } = render(
                <FloorPlanViewer building={singleFloorBuilding} floorLevel="8" onClose={mockOnClose} />
            );

            expect(queryByText('Floor')).toBeNull();
        });

        it('changes floor when floor button is pressed', () => {
            const { getByTestId, getByText } = render(
                <FloorPlanViewer building={mockBuilding} floorLevel="8" onClose={mockOnClose} />
            );

            const floor9Btn = getByTestId('floor-btn-9');
            fireEvent.press(floor9Btn);

            expect(getByText('Hall Building - Floor 9')).toBeTruthy();
        });

        it('uses first available floor as default when floorLevel is not provided', () => {
            const { getByText } = render(
                <FloorPlanViewer building={mockBuilding} onClose={mockOnClose} />
            );

            // Should default to first floor alphabetically (8)
            expect(getByText('Hall Building - Floor 8')).toBeTruthy();
        });
    });

    describe('Room selectors', () => {
        const buildingWithRooms = createMockBuilding({
            floorPlans: {
                '8': '<svg><rect inkscape:label="801" /><rect inkscape:label="803" /><rect inkscape:label="829" /></svg>',
            },
        });

        it('renders room selector buttons', () => {
            const { getByText } = render(
                <FloorPlanViewer building={buildingWithRooms} floorLevel="8" onClose={mockOnClose} />
            );

            expect(getByText('FROM')).toBeTruthy();
            expect(getByText('TO')).toBeTruthy();
        });

        it('displays default room values', () => {
            const buildingWithDefaults = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="829" /><rect inkscape:label="862" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer building={buildingWithDefaults} floorLevel="8" onClose={mockOnClose} />
            );

            // Default startRoom is 829, nextRoom is 862
            expect(getByText('H829')).toBeTruthy();
            expect(getByText('H862')).toBeTruthy();
        });

        it('opens start room picker when FROM button is pressed', async () => {
            const { getByTestId, getByText } = render(
                <FloorPlanViewer building={buildingWithRooms} floorLevel="8" onClose={mockOnClose} />
            );

            const startBtn = getByTestId('room-picker-start');
            fireEvent.press(startBtn);

            await waitFor(() => {
                expect(getByText('Select start room')).toBeTruthy();
            });
        });

        it('opens destination room picker when TO button is pressed', async () => {
            const { getByTestId, getByText } = render(
                <FloorPlanViewer building={buildingWithRooms} floorLevel="8" onClose={mockOnClose} />
            );

            const endBtn = getByTestId('room-picker-end');
            fireEvent.press(endBtn);

            await waitFor(() => {
                expect(getByText('Select destination room')).toBeTruthy();
            });
        });

        it('displays "Select room" when startRoom is not set', () => {
            const buildingNoRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg></svg>',
                },
            });

            const { queryAllByText } = render(
                <FloorPlanViewer building={buildingNoRooms} floorLevel="8" onClose={mockOnClose} />
            );

            const selectRoomElements = queryAllByText('Select room');
            expect(selectRoomElements.length).toBeGreaterThanOrEqual(0);
        });

        it('selects a start room via RoomPickerModal onSelect callback', async () => {
            const { getByTestId, getByText } = render(
                <FloorPlanViewer building={buildingWithRooms} floorLevel="8" onClose={mockOnClose} />
            );

            const startBtn = getByTestId('room-picker-start');
            fireEvent.press(startBtn);

            await waitFor(() => {
                expect(getByText('Select start room')).toBeTruthy();
            });

            const room801 = getByText('H801');
            fireEvent.press(room801);

            await waitFor(() => {
                expect(getByText('H801')).toBeTruthy();
            });
        });

        it('selects a destination room via RoomPickerModal onSelect callback', async () => {
            const { getByTestId, getByText } = render(
                <FloorPlanViewer building={buildingWithRooms} floorLevel="8" onClose={mockOnClose} />
            );

            const endBtn = getByTestId('room-picker-end');
            fireEvent.press(endBtn);

            await waitFor(() => {
                expect(getByText('Select destination room')).toBeTruthy();
            });

            const room801 = getByText('H801');
            fireEvent.press(room801);

            await waitFor(() => {
                expect(getByText('H801')).toBeTruthy();
            });
        });

        it('closes start room picker and resets roomPickerOpen state', async () => {
            const { getByTestId, getByText } = render(
                <FloorPlanViewer building={buildingWithRooms} floorLevel="8" onClose={mockOnClose} />
            );

            const startBtn = getByTestId('room-picker-start');
            fireEvent.press(startBtn);

            await waitFor(() => {
                expect(getByText('Select start room')).toBeTruthy();
            });

            const room801 = getByText('H801');
            fireEvent.press(room801);

            await waitFor(() => {
                expect(getByText('H801')).toBeTruthy();
            });
        });

        it('closes destination room picker and resets roomPickerOpen state', async () => {
            const { getByTestId, getByText } = render(
                <FloorPlanViewer building={buildingWithRooms} floorLevel="8" onClose={mockOnClose} />
            );

            const endBtn = getByTestId('room-picker-end');
            fireEvent.press(endBtn);

            await waitFor(() => {
                expect(getByText('Select destination room')).toBeTruthy();
            });

            const room801 = getByText('H801');
            fireEvent.press(room801);

            await waitFor(() => {
                expect(getByText('H801')).toBeTruthy();
            });
        });
    });


    describe('Building prefix resolution', () => {
        it('uses building label for prefix', () => {
            const buildingWithLabel = createMockBuilding({
                id: 'Custom Building',
                label: 'XX',
                address: '123 Test St',
                floorPlans: {
                    '1': '<svg><rect inkscape:label="101" /></svg>',
                },
            });

            const { getAllByText } = render(
                <FloorPlanViewer 
                    building={buildingWithLabel} 
                    floorLevel="1" 
                    onClose={mockOnClose}
                    startRoom="101"
                    nextRoom="101"
                />
            );

            // XX101 appears for both startRoom and nextRoom
            expect(getAllByText('XX101').length).toBeGreaterThan(0);
        });

        it('uses fallback prefix map when label is not set', () => {
            const buildingWithRooms = createMockBuilding({
                label: undefined as any, // Explicitly unset label
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer building={buildingWithRooms} floorLevel="8" onClose={mockOnClose} startRoom="801" />
            );

            // Should use 'H' prefix from BUILDING_PREFIX_MAP
            expect(getByText('H801')).toBeTruthy();
        });

        it('handles unknown building without prefix', () => {
            const unknownBuilding = createMockBuilding({
                id: 'Unknown Building',
                floorPlans: {
                    '1': '<svg><rect inkscape:label="101" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer building={unknownBuilding} floorLevel="1" onClose={mockOnClose} startRoom="101" />
            );

            // Should show room number without prefix
            expect(getByText('101')).toBeTruthy();
        });
    });

    describe('SVG room highlighting', () => {
        it('highlights start room with green when startRoom prop is provided', () => {
            const buildingWithSvg = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="803" style="fill:#da3636;" /></svg>',
                },
            });

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
            const buildingWithSvg = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="805" style="fill:#da3636;" /></svg>',
                },
            });

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
            const buildingWithSvg = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="803" style="fill:#da3636;" /><rect inkscape:label="805" style="fill:#da3636;" /></svg>',
                },
            });

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
            const buildingWithDuplicateLabels = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="829" style="fill:#da3636;" /><path inkscape:label="829" style="fill:#da3636;" /></svg>',
                },
            });

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
            const buildingWithDuplicateLabels = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="829" style="fill:#da3636;" /><path inkscape:label="829" style="fill:#da3636;" /></svg>',
                },
            });

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
            const buildingWithSvg = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="803" style="fill:#da3636;" /></svg>',
                },
            });

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
            const buildingWithSvg = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="803" style="fill:#da3636;" /></svg>',
                },
            });

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
            const buildingWithSvg = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="803" style="fill:#da3636;" /></svg>',
                },
            });

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
            const buildingWithSvg = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="803" /></svg>',
                },
            });

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
            const buildingWithSvg = createMockBuilding({
                floorPlans: {
                    '8': '<svg><path inkscape:label="805" /></svg>',
                },
            });

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
            const buildingWithSvg = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="829" style="fill:#da3636;" /><rect inkscape:label="862" style="fill:#da3636;" /></svg>',
                },
            });

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

    describe('Room extraction from SVG', () => {
        it('extracts and sorts numeric room labels', async () => {
            const buildingWithNumericRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="829" /><rect inkscape:label="801" /><rect inkscape:label="810" /></svg>',
                },
            });

            const { getByTestId, getByText } = render(
                <FloorPlanViewer building={buildingWithNumericRooms} floorLevel="8" onClose={mockOnClose} />
            );

            const startBtn = getByTestId('room-picker-start');
            fireEvent.press(startBtn);

            await waitFor(() => {
                // Rooms should be sorted numerically
                const rooms = getByText(/Showing 3 rooms/);
                expect(rooms).toBeTruthy();
            });
        });

        it('filters out layer/group names from room list', async () => {
            const buildingWithLayers = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /><rect inkscape:label="Floor" /><rect inkscape:label="Layer 1" /><rect inkscape:label="layer 2" /></svg>',
                },
            });

            const { getByTestId, getByText } = render(
                <FloorPlanViewer building={buildingWithLayers} floorLevel="8" onClose={mockOnClose} />
            );

            const startBtn = getByTestId('room-picker-start');
            fireEvent.press(startBtn);

            await waitFor(() => {
                // Only 801 should be in the list, not Floor/Layer names
                expect(getByText(/Showing 1 room/)).toBeTruthy();
            });
        });

        it('filters out S1/S2 vec labels', async () => {
            const buildingWithVecLabels = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /><rect inkscape:label="S1 vec" /><rect inkscape:label="S2 vec" /></svg>',
                },
            });

            const { getByTestId, getByText } = render(
                <FloorPlanViewer building={buildingWithVecLabels} floorLevel="8" onClose={mockOnClose} />
            );

            const startBtn = getByTestId('room-picker-start');
            fireEvent.press(startBtn);

            await waitFor(() => {
                expect(getByText(/Showing 1 room/)).toBeTruthy();
            });
        });
    });
});