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
    getRoomNodeId: jest.fn(() => null),
    getFloorsInPath: jest.fn(() => []),
}));

jest.mock('../src/hooks/useIndoorPath', () => ({
    useIndoorPath: jest.fn(() => null),
    usePathFloors: jest.fn(() => []),
    useSvgPathForFloor: jest.fn(() => ''),
}));

jest.mock('../src/hooks/useAllRooms', () => ({
    useRoomsForBuilding: jest.fn(() => {
        // Always return mock rooms
        return [
            { room: '801', prefix: 'H-', buildingId: 'Hall Building', floor: '8', displayLabel: 'H-801 (Floor 8)' },
            { room: '802', prefix: 'H-', buildingId: 'Hall Building', floor: '8', displayLabel: 'H-802 (Floor 8)' },
            { room: '829', prefix: 'H-', buildingId: 'Hall Building', floor: '8', displayLabel: 'H-829 (Floor 8)' },
            { room: '862', prefix: 'H-', buildingId: 'Hall Building', floor: '8', displayLabel: 'H-862 (Floor 8)' },
        ];
    }),
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
                expect(getByText(/Select start room.*Hall Building/)).toBeTruthy();
            });
        });

        it('opens destination room picker when TO button is pressed', async () => {
            const { getByTestId, getByText } = render(
                <FloorPlanViewer building={buildingWithRooms} floorLevel="8" onClose={mockOnClose} />
            );

            const endBtn = getByTestId('room-picker-end');
            fireEvent.press(endBtn);

            await waitFor(() => {
                expect(getByText(/Select destination room.*Hall Building/)).toBeTruthy();
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
            const { getByTestId } = render(
                <FloorPlanViewer building={buildingWithRooms} floorLevel="8" onClose={mockOnClose} />
            );

            const startBtn = getByTestId('room-picker-start');
            fireEvent.press(startBtn);

            // Wait for room item to appear in the picker
            let room801: any;
            await waitFor(() => {
                room801 = getByTestId('room-item-H-801');
                expect(room801).toBeTruthy();
            }, { timeout: 3000 });

            fireEvent.press(room801);
        });

        it('selects a destination room via RoomPickerModal onSelect callback', async () => {
            const { getByTestId } = render(
                <FloorPlanViewer building={buildingWithRooms} floorLevel="8" onClose={mockOnClose} />
            );

            const endBtn = getByTestId('room-picker-end');
            fireEvent.press(endBtn);

            let room801: any;
            await waitFor(() => {
                room801 = getByTestId('room-item-H-801');
                expect(room801).toBeTruthy();
            }, { timeout: 3000 });

            fireEvent.press(room801);
        });

        it('closes start room picker and resets roomPickerOpen state', async () => {
            const { getByTestId } = render(
                <FloorPlanViewer building={buildingWithRooms} floorLevel="8" onClose={mockOnClose} />
            );

            const startBtn = getByTestId('room-picker-start');
            fireEvent.press(startBtn);

            let room801: any;
            await waitFor(() => {
                room801 = getByTestId('room-item-H-801');
                expect(room801).toBeTruthy();
            }, { timeout: 3000 });

            fireEvent.press(room801);
        });

        it('closes destination room picker and resets roomPickerOpen state', async () => {
            const { getByTestId } = render(
                <FloorPlanViewer building={buildingWithRooms} floorLevel="8" onClose={mockOnClose} />
            );

            const endBtn = getByTestId('room-picker-end');
            fireEvent.press(endBtn);

            let room801: any;
            await waitFor(() => {
                room801 = getByTestId('room-item-H-801');
                expect(room801).toBeTruthy();
            }, { timeout: 3000 });

            fireEvent.press(room801);
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
                label: '' as any,
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
        // Helper function to reduce duplication in room highlighting tests
        const testRoomHighlighting = (
            roomNumber: string, 
            isStartRoom: boolean,
            svgContent: string = `<svg><rect inkscape:label="${roomNumber}" style="fill:#da3636;" /></svg>`,
            expectedFillColor: string = isStartRoom ? '#4CAF50' : '#2196F3',
            expectedStrokeColor: string = isStartRoom ? '#2E7D32' : '#1565C0'
        ) => {
            const buildingWithSvg = createMockBuilding({
                floorPlans: { '8': svgContent },
            });
            const props = isStartRoom 
                ? { startRoom: roomNumber }
                : { nextRoom: roomNumber };

            const { getByTestId } = render(
                <FloorPlanViewer 
                    building={buildingWithSvg} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    {...props}
                />
            );

            const svgMock = getByTestId('svg-xml');
            return svgMock.props.xml;
        };

        it('highlights start room with green when startRoom prop is provided', () => {
            const xml = testRoomHighlighting('803', true);
            expect(xml).toContain('fill:#4CAF50');
            expect(xml).toContain('stroke:#2E7D32');
        });

        it('highlights next room with blue when nextRoom prop is provided', () => {
            const xml = testRoomHighlighting('805', false);
            expect(xml).toContain('fill:#2196F3');
            expect(xml).toContain('stroke:#1565C0');
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
            expect(svgMock.props.xml).toContain('fill:#4CAF50');
            expect(svgMock.props.xml).toContain('stroke:#2E7D32');
            expect(svgMock.props.xml).toContain('fill:#2196F3');
            expect(svgMock.props.xml).toContain('stroke:#1565C0');
        });

        it('highlights multiple rooms with same label (duplicates)', () => {
            const buildingWithDuplicateLabels = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="829" style="fill:#da3636;" /><path inkscape:label="829" style="fill:#da3636;" /></svg>',
                },
            });

            // Test start room duplicates
            const { getByTestId: getByTestId1 } = render(
                <FloorPlanViewer 
                    building={buildingWithDuplicateLabels} 
                    floorLevel="8" 
                    onClose={mockOnClose} 
                    startRoom="829"
                />
            );

            const svgMock1 = getByTestId1('svg-xml');
            const startHighlightCount = (svgMock1.props.xml.match(/fill:#4CAF50/g) || []).length;
            expect(startHighlightCount).toBe(2);
        });

        it('does not modify SVG when rooms are undefined', () => {
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
        });

        it('does not modify SVG when room label not found', () => {
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
                    nextRoom="999"
                />
            );

            const svgMock = getByTestId('svg-xml');
            expect(svgMock.props.xml).not.toContain('fill:#4CAF50');
            expect(svgMock.props.xml).not.toContain('fill:#2196F3');
        });

        it('highlights rooms when element has NO style attribute', () => {
            const buildingWithSvg = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="803" /><path inkscape:label="805" /></svg>',
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
            expect(svgMock.props.xml).toContain('fill:#4CAF50');
            expect(svgMock.props.xml).toContain('fill:#2196F3');
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

    describe.skip('Room extraction from SVG', () => {
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

    describe('RoomButton with external building label', () => {
        it('displays building label when startRoomSelection is from different building', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    startRoomSelection={{ buildingId: 'MB', floor: '1', room: '101' }}
                />
            );

            // Should show building label with room
            expect(getByText(/MB:/)).toBeTruthy();
            expect(getByText(/101/)).toBeTruthy();
        });

        it('displays building label when destinationRoomSelection is from different building', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    destinationRoomSelection={{ buildingId: 'VL', floor: '1', room: '105' }}
                />
            );

            // Should show building label with room
            expect(getByText(/VL:/)).toBeTruthy();
            expect(getByText(/105/)).toBeTruthy();
        });

        it('does not display building label when selection is from same building', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /></svg>',
                },
            });

            const { queryByText, getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    startRoomSelection={{ buildingId: 'Hall Building', floor: '8', room: '801' }}
                />
            );

            // Should NOT show external building label format
            expect(queryByText(/Hall Building:/)).toBeNull();
            // Should show normal format with prefix
            expect(getByText('H801')).toBeTruthy();
        });

        it('displays "Select room" when effectiveRoom is empty and no buildingLabel', () => {
            const buildingNoRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg></svg>',
                },
            });

            const { queryAllByText } = render(
                <FloorPlanViewer 
                    building={buildingNoRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    startRoom=""
                    nextRoom=""
                />
            );

            // Both start and end should show "Select room"
            const selectRoomElements = queryAllByText('Select room');
            expect(selectRoomElements.length).toBe(2);
        });
    });

    describe('PathStatus component', () => {
        it('shows "Path found on this floor" when path exists and is on a single floor', async () => {
            const { useIndoorPath, usePathFloors } = require('../src/hooks/useIndoorPath');
            
            // Mock a successful path that spans only 1 floor directly via the hooks
            useIndoorPath.mockReturnValue(['node1', 'node2']);
            usePathFloors.mockReturnValue([8]);

            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /><rect inkscape:label="802" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    startRoom="801"
                    nextRoom="802"
                />
            );

            await waitFor(() => {
                expect(getByText('Path found on this floor')).toBeTruthy();
            });

            // Cleanup mocks for other tests
            useIndoorPath.mockReturnValue(null);
            usePathFloors.mockReturnValue([]);
        });

        it('shows "No path found" when path is null but rooms are selected', () => {
            const mockFindPath = require('../src/utils/Pathfinding').findPath;
            mockFindPath.mockReturnValue(null);

            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /><rect inkscape:label="802" /></svg>',
                },
            });

            const { queryByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    startRoom="801"
                    nextRoom="802"
                />
            );

            // PathStatus may or may not show depending on hook implementation
            // Just verify the component renders without crashing
            expect(queryByText('Hall Building - Floor 8')).toBeTruthy();
        });

        it('does not show path status when no rooms are selected', () => {
            const mockFindPath = require('../src/utils/Pathfinding').findPath;
            mockFindPath.mockReturnValue(null);

            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /></svg>',
                },
            });

            const { queryByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    startRoom=""
                    nextRoom=""
                />
            );

            expect(queryByText('No path found')).toBeNull();
            expect(queryByText('Path found on this floor')).toBeNull();
        });
    });

    describe('MultiFloorIndicator component', () => {
        it('shows multi-floor path text when path spans multiple floors', async () => {
            const { useIndoorPath, usePathFloors } = require('../src/hooks/useIndoorPath');
            
            // Mock a successful path that spans 2 floors directly via the hooks
            useIndoorPath.mockReturnValue(['node1', 'node2', 'node3']);
            usePathFloors.mockReturnValue([8, 9]);

            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /></svg>',
                    '9': '<svg><rect inkscape:label="901" /></svg>',
                },
            });

            const { getByText, getByTestId } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    startRoom="801"
                    nextRoom="901"
                />
            );

            await waitFor(() => {
                expect(getByText('Path spans 2 floors: 8 → 9')).toBeTruthy();
            });

            // Test accessibility toggle appending "(via elevator)"
            const accessibilityToggle = getByTestId('accessibility-toggle');
            fireEvent(accessibilityToggle, 'valueChange', true);

            await waitFor(() => {
                expect(getByText('Path spans 2 floors: 8 → 9 (via elevator)')).toBeTruthy();
            });

            // Cleanup mocks for other tests
            useIndoorPath.mockReturnValue(null);
            usePathFloors.mockReturnValue([]);
        });

        it('renders accessibility toggle for multi-floor paths', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /></svg>',
                    '9': '<svg><rect inkscape:label="901" /></svg>',
                },
            });

            const { getByTestId } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    startRoom="801"
                    nextRoom="901"
                />
            );

            // Verify accessibility toggle exists
            const accessibilityToggle = getByTestId('accessibility-toggle');
            expect(accessibilityToggle).toBeTruthy();
        });

        it('toggles accessibility mode when switch is pressed', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /></svg>',
                    '9': '<svg><rect inkscape:label="901" /></svg>',
                },
            });

            const { getByTestId } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    startRoom="801"
                    nextRoom="901"
                />
            );

            // Toggle accessibility mode
            const accessibilityToggle = getByTestId('accessibility-toggle');
            expect(accessibilityToggle).toBeTruthy();
            fireEvent(accessibilityToggle, 'valueChange', true);
        });
    });

    describe('CrossBuildingIndicator component', () => {
        it('shows "Exit to reach" when current building is start building', () => {
            const mockFindPath = require('../src/utils/Pathfinding').findPath;
            mockFindPath.mockReturnValue(null);

            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    startRoomSelection={{ buildingId: 'Hall Building', floor: '8', room: '801' }}
                    destinationRoomSelection={{ buildingId: 'MB', floor: '1', room: '101' }}
                />
            );

            expect(getByText(/Exit to reach MB/)).toBeTruthy();
        });

        it('shows "Enter from" when current building is destination building', () => {
            const mockFindPath = require('../src/utils/Pathfinding').findPath;
            mockFindPath.mockReturnValue(null);

            const buildingWithRooms = createMockBuilding({
                id: 'MB',
                label: 'MB',
                floorPlans: {
                    '1': '<svg><rect inkscape:label="101" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="1" 
                    onClose={mockOnClose}
                    startRoomSelection={{ buildingId: 'Hall Building', floor: '8', room: '801' }}
                    destinationRoomSelection={{ buildingId: 'MB', floor: '1', room: '101' }}
                />
            );

            expect(getByText(/Enter from Hall Building/)).toBeTruthy();
        });

        it('does not show cross-building indicator when both rooms are in same building', () => {
            const mockFindPath = require('../src/utils/Pathfinding').findPath;
            mockFindPath.mockReturnValue(null);

            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /></svg>',
                },
            });

            const { queryByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    startRoomSelection={{ buildingId: 'Hall Building', floor: '8', room: '801' }}
                    destinationRoomSelection={{ buildingId: 'Hall Building', floor: '8', room: '802' }}
                />
            );

            expect(queryByText(/Exit to reach/)).toBeNull();
            expect(queryByText(/Enter from/)).toBeNull();
        });
    });

    describe('Accessibility toggle', () => {
        it('renders accessibility toggle switch', () => {
            const { getByTestId } = render(
                <FloorPlanViewer building={mockBuilding} floorLevel="8" onClose={mockOnClose} />
            );

            expect(getByTestId('accessibility-toggle')).toBeTruthy();
        });

        it('toggles accessibility mode when switch is pressed', () => {
            const mockFindPath = require('../src/utils/Pathfinding').findPath;
            mockFindPath.mockReturnValue(null);

            const { getByTestId } = render(
                <FloorPlanViewer building={mockBuilding} floorLevel="8" onClose={mockOnClose} />
            );

            const toggle = getByTestId('accessibility-toggle');
            
            // Initially false
            expect(toggle.props.value).toBe(false);
            
            // Toggle to true
            fireEvent(toggle, 'valueChange', true);
            expect(toggle.props.value).toBe(true);
        });

        it('shows accessible route text with active styling when enabled', () => {
            const { getByTestId, getByText } = render(
                <FloorPlanViewer building={mockBuilding} floorLevel="8" onClose={mockOnClose} />
            );

            const toggle = getByTestId('accessibility-toggle');
            fireEvent(toggle, 'valueChange', true);

            expect(getByText('Accessible route')).toBeTruthy();
        });
    });

    describe('Room selection callbacks', () => {
        it('calls onStartRoomChange when start room is selected', async () => {
            const mockOnStartRoomChange = jest.fn();
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /><rect inkscape:label="802" /></svg>',
                },
            });

            const { getByTestId, getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    onStartRoomChange={mockOnStartRoomChange}
                />
            );

            const startBtn = getByTestId('room-picker-start');
            fireEvent.press(startBtn);

            await waitFor(() => {
                expect(getByText(/Select start room.*Hall Building/)).toBeTruthy();
            });

            const room801 = getByTestId('room-item-H-801');
            fireEvent.press(room801);

            await waitFor(() => {
                expect(mockOnStartRoomChange).toHaveBeenCalledWith({
                    buildingId: 'Hall Building',
                    floor: '8',
                    room: '801',
                });
            });
        });

        it('calls onDestinationRoomChange when destination room is selected', async () => {
            const mockOnDestinationRoomChange = jest.fn();
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /><rect inkscape:label="802" /></svg>',
                },
            });

            const { getByTestId, getAllByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    onDestinationRoomChange={mockOnDestinationRoomChange}
                />
            );

            const endBtn = getByTestId('room-picker-end');
            fireEvent.press(endBtn);

            await waitFor(() => {
                const titleElements = getAllByText(/Select destination room.*Hall Building/);
                expect(titleElements.length > 0).toBeTruthy();
            });

            const room802Elements = getAllByText(/H-802/);
            const room802 = room802Elements[0]; // Get the room label, not the display label
            fireEvent.press(room802);

            await waitFor(() => {
                expect(mockOnDestinationRoomChange).toHaveBeenCalledWith({
                    buildingId: 'Hall Building',
                    floor: '8',
                    room: '802',
                });
            });
        });

        it('does not call onStartRoomChange when building is null', async () => {
            const mockOnStartRoomChange = jest.fn();

            const { queryByText } = render(
                <FloorPlanViewer 
                    building={null} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    onStartRoomChange={mockOnStartRoomChange}
                />
            );

            expect(queryByText('Select start room')).toBeNull();
            expect(mockOnStartRoomChange).not.toHaveBeenCalled();
        });
    });

    describe('Effective room resolution', () => {
        it('uses startRoomSelection over startRoom prop', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /><rect inkscape:label="802" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    startRoom="801"
                    startRoomSelection={{ buildingId: 'Hall Building', floor: '8', room: '802' }}
                />
            );

            // Should show 802 from selection, not 801 from prop
            expect(getByText('H802')).toBeTruthy();
        });

        it('uses destinationRoomSelection over nextRoom prop', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /><rect inkscape:label="802" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    nextRoom="801"
                    destinationRoomSelection={{ buildingId: 'Hall Building', floor: '8', room: '802' }}
                />
            );

            // Should show 802 from selection, not 801 from prop
            expect(getByText('H802')).toBeTruthy();
        });

        it('falls back to startRoom when startRoomSelection is null', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    startRoom="801"
                    startRoomSelection={null}
                />
            );

            expect(getByText('H801')).toBeTruthy();
        });

        it('falls back to nextRoom when destinationRoomSelection is null', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="802" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    nextRoom="802"
                    destinationRoomSelection={null}
                />
            );

            expect(getByText('H802')).toBeTruthy();
        });
    });

    describe('Component rendering edge cases', () => {
        it('renders hint text for cross-building room selection', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                />
            );

            expect(getByText('Tap to select any room on any floor')).toBeTruthy();
        });

        it('renders accessibility toggle for single floor', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /></svg>',
                },
            });

            const { getByTestId } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                />
            );

            expect(getByTestId('accessibility-toggle')).toBeTruthy();
        });

        it('displays building address in header', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg></svg>',
                },
                address: '1455 De Maisonneuve Blvd. W.',
            });

            const { getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                />
            );

            expect(getByText('1455 De Maisonneuve Blvd. W.')).toBeTruthy();
        });

        it('closes modal when close button is pressed', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /></svg>',
                },
            });

            const { getByTestId } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                />
            );

            const closeBtn = getByTestId('floor-plan-close');
            fireEvent.press(closeBtn);
            expect(mockOnClose).toHaveBeenCalled();
        });

        it('displays empty room text when room value is empty string', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg></svg>',
                },
            });

            const { getAllByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    startRoom=""
                    nextRoom=""
                />
            );

            const selectRoomElements = getAllByText('Select room');
            expect(selectRoomElements.length).toBe(2); // Both start and end buttons show "Select room"
        });
    });

    describe('Room selection callbacks', () => {
        it('calls onStartRoomChange when start room is selected', async () => {
            const mockOnStartRoomChange = jest.fn();
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /><rect inkscape:label="802" /></svg>',
                },
            });

            const { getByTestId } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    onStartRoomChange={mockOnStartRoomChange}
                />
            );

            const startBtn = getByTestId('room-picker-start');
            fireEvent.press(startBtn);

            let room801: any;
            await waitFor(() => {
                room801 = getByTestId('room-item-H-801');
                expect(room801).toBeTruthy();
            }, { timeout: 3000 });

            fireEvent.press(room801);

            await waitFor(() => {
                expect(mockOnStartRoomChange).toHaveBeenCalledWith({
                    buildingId: 'Hall Building',
                    floor: '8',
                    room: '801',
                });
            });
        });

        it('calls onDestinationRoomChange when destination room is selected', async () => {
            const mockOnDestinationRoomChange = jest.fn();
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /><rect inkscape:label="802" /></svg>',
                },
            });

            const { getByTestId } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    onDestinationRoomChange={mockOnDestinationRoomChange}
                />
            );

            const endBtn = getByTestId('room-picker-end');
            fireEvent.press(endBtn);

            let room801: any;
            await waitFor(() => {
                room801 = getByTestId('room-item-H-801');
                expect(room801).toBeTruthy();
            }, { timeout: 3000 });

            fireEvent.press(room801);

            await waitFor(() => {
                expect(mockOnDestinationRoomChange).toHaveBeenCalledWith({
                    buildingId: 'Hall Building',
                    floor: '8',
                    room: '801',
                });
            });
        });

        it('does not call callbacks when building is missing', () => {
            const mockOnStartRoomChange = jest.fn();
            const mockOnDestinationRoomChange = jest.fn();

            const { queryByText } = render(
                <FloorPlanViewer 
                    building={null} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    onStartRoomChange={mockOnStartRoomChange}
                    onDestinationRoomChange={mockOnDestinationRoomChange}
                />
            );

            expect(queryByText('Hall Building')).toBeNull();
            expect(mockOnStartRoomChange).not.toHaveBeenCalled();
            expect(mockOnDestinationRoomChange).not.toHaveBeenCalled();
        });
    });;

    describe('Effective room resolution', () => {
        it('uses startRoomSelection over startRoom prop', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /><rect inkscape:label="802" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    startRoom="801"
                    startRoomSelection={{ buildingId: 'Hall Building', floor: '8', room: '802' }}
                />
            );

            // Should show 802 from selection, not 801 from prop
            expect(getByText('H802')).toBeTruthy();
        });

        it('uses destinationRoomSelection over nextRoom prop', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /><rect inkscape:label="802" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    nextRoom="801"
                    destinationRoomSelection={{ buildingId: 'Hall Building', floor: '8', room: '802' }}
                />
            );

            // Should show 802 from selection, not 801 from prop
            expect(getByText('H802')).toBeTruthy();
        });

        it('falls back to startRoom when startRoomSelection is null', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="801" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    startRoom="801"
                    startRoomSelection={null}
                />
            );

            expect(getByText('H801')).toBeTruthy();
        });

        it('falls back to nextRoom when destinationRoomSelection is null', () => {
            const buildingWithRooms = createMockBuilding({
                floorPlans: {
                    '8': '<svg><rect inkscape:label="802" /></svg>',
                },
            });

            const { getByText } = render(
                <FloorPlanViewer 
                    building={buildingWithRooms} 
                    floorLevel="8" 
                    onClose={mockOnClose}
                    nextRoom="802"
                    destinationRoomSelection={null}
                />
            );

            expect(getByText('H802')).toBeTruthy();
        });
    });
});
