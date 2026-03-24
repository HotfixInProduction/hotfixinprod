import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AmenityOverlay from '../src/components/AmenityOverlay';
import { AmenityElement } from '../src/hooks/useAmenities';

describe('AmenityOverlay', () => {
    const mockOnAmenityPress = jest.fn();

    const createMockAmenity = (overrides?: Partial<AmenityElement>): AmenityElement => ({
        id: 'stairs1',
        type: 'stairs',
        amenityKind: 'stairs',
        x: 100,
        y: 200,
        label: 'Stairs',
        description: 'Staircase',
        ...overrides,
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('returns null with empty amenities', () => {
            const { queryByTestId } = render(
                <AmenityOverlay 
                    amenities={[]}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={1}
                    svgOffsetX={0}
                    svgOffsetY={0}
                />
            );
            expect(queryByTestId('amenity-overlay')).toBeNull();
        });

        it('renders overlay container with testID', () => {
            const { getByTestId } = render(
                <AmenityOverlay 
                    amenities={[createMockAmenity()]}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={1}
                    svgOffsetX={0}
                    svgOffsetY={0}
                />
            );
            expect(getByTestId('amenity-overlay')).toBeTruthy();
        });
    });

    describe('Touch target rendering', () => {
        it('creates touch target for each amenity', () => {
            const amenities = [
                createMockAmenity({ id: 'stairs1', x: 100, y: 200 }),
                createMockAmenity({ id: 'elevators1', x: 150, y: 250 }),
                createMockAmenity({ id: 'printers1', x: 300, y: 400 }),
            ];
            const { getAllByTestId } = render(
                <AmenityOverlay 
                    amenities={amenities}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={1}
                    svgOffsetX={0}
                    svgOffsetY={0}
                />
            );
            const touchTargets = getAllByTestId(/^amenity-touch-/);
            expect(touchTargets).toHaveLength(3);
        });

        it('renders single amenity touch target', () => {
            const { getByTestId } = render(
                <AmenityOverlay 
                    amenities={[createMockAmenity({ id: 'stairs1' })]}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={1}
                    svgOffsetX={0}
                    svgOffsetY={0}
                />
            );
            expect(getByTestId('amenity-touch-stairs1')).toBeTruthy();
        });

        it('renders multiple amenity touch targets', () => {
            const amenities = [
                createMockAmenity({ id: 'stairs1' }),
                createMockAmenity({ id: 'stairs2' }),
                createMockAmenity({ id: 'elevators1' }),
            ];
            const { getByTestId } = render(
                <AmenityOverlay 
                    amenities={amenities}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={1}
                    svgOffsetX={0}
                    svgOffsetY={0}
                />
            );
            expect(getByTestId('amenity-touch-stairs1')).toBeTruthy();
            expect(getByTestId('amenity-touch-stairs2')).toBeTruthy();
            expect(getByTestId('amenity-touch-elevators1')).toBeTruthy();
        });
    });

    describe('Touch interactions', () => {
        it('calls onAmenityPress when amenity is tapped', () => {
            const amenity = createMockAmenity({ id: 'stairs1' });
            const { getByTestId } = render(
                <AmenityOverlay 
                    amenities={[amenity]}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={1}
                    svgOffsetX={0}
                    svgOffsetY={0}
                />
            );
            const touchable = getByTestId('amenity-touch-stairs1');
            fireEvent.press(touchable);
            expect(mockOnAmenityPress).toHaveBeenCalledWith(amenity);
            expect(mockOnAmenityPress).toHaveBeenCalledTimes(1);
        });

        it('calls onAmenityPress with correct amenity data', () => {
            const amenity = createMockAmenity({
                id: 'printers1',
                label: 'Printer',
                description: 'Printer Station',
                amenityKind: 'printer',
            });
            const { getByTestId } = render(
                <AmenityOverlay 
                    amenities={[amenity]}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={1}
                    svgOffsetX={0}
                    svgOffsetY={0}
                />
            );
            const touchable = getByTestId('amenity-touch-printers1');
            fireEvent.press(touchable);
            expect(mockOnAmenityPress).toHaveBeenCalledWith(amenity);
        });

        it('calls onAmenityPress only for pressed amenity', () => {
            const amenities = [
                createMockAmenity({ id: 'stairs1' }),
                createMockAmenity({ id: 'elevators1' }),
                createMockAmenity({ id: 'printers1' }),
            ];
            const { getByTestId } = render(
                <AmenityOverlay 
                    amenities={amenities}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={1}
                    svgOffsetX={0}
                    svgOffsetY={0}
                />
            );
            
            const stairsTarget = getByTestId('amenity-touch-stairs1');
            fireEvent.press(stairsTarget);
            
            expect(mockOnAmenityPress).toHaveBeenCalledTimes(1);
            expect(mockOnAmenityPress).toHaveBeenCalledWith(amenities[0]);
        });

        it('handles multiple sequential taps', () => {
            const amenities = [
                createMockAmenity({ id: 'stairs1' }),
                createMockAmenity({ id: 'elevators1' }),
            ];
            const { getByTestId } = render(
                <AmenityOverlay 
                    amenities={amenities}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={1}
                    svgOffsetX={0}
                    svgOffsetY={0}
                />
            );
            
            fireEvent.press(getByTestId('amenity-touch-stairs1'));
            fireEvent.press(getByTestId('amenity-touch-elevators1'));
            fireEvent.press(getByTestId('amenity-touch-stairs1'));
            
            expect(mockOnAmenityPress).toHaveBeenCalledTimes(3);
            expect(mockOnAmenityPress).toHaveBeenNthCalledWith(1, amenities[0]);
            expect(mockOnAmenityPress).toHaveBeenNthCalledWith(2, amenities[1]);
            expect(mockOnAmenityPress).toHaveBeenNthCalledWith(3, amenities[0]);
        });
    });

    describe('Scale factor handling', () => {
        it('renders touch targets with scale factor 0.5', () => {
            const amenity = createMockAmenity({
                id: 'stairs1',
                x: 100,
                y: 200,
            });
            const { getByTestId } = render(
                <AmenityOverlay 
                    amenities={[amenity]}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={0.5}
                    svgOffsetX={0}
                    svgOffsetY={0}
                />
            );
            expect(getByTestId('amenity-touch-stairs1')).toBeTruthy();
        });

        it('renders touch targets with scale factor 1', () => {
            const amenity = createMockAmenity({
                id: 'stairs1',
                x: 100,
                y: 200,
            });
            const { getByTestId } = render(
                <AmenityOverlay 
                    amenities={[amenity]}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={1}
                    svgOffsetX={0}
                    svgOffsetY={0}
                />
            );
            expect(getByTestId('amenity-touch-stairs1')).toBeTruthy();
        });

        it('renders touch targets with scale factor 2', () => {
            const amenity = createMockAmenity({
                id: 'stairs1',
                x: 100,
                y: 200,
            });
            const { getByTestId } = render(
                <AmenityOverlay 
                    amenities={[amenity]}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={2}
                    svgOffsetX={0}
                    svgOffsetY={0}
                />
            );
            expect(getByTestId('amenity-touch-stairs1')).toBeTruthy();
        });

        it('handles different scale factors for multiple amenities', () => {
            const amenities = [
                createMockAmenity({ id: 'stairs1', x: 100, y: 200 }),
                createMockAmenity({ id: 'elevators1', x: 150, y: 250 }),
            ];
            const { getByTestId } = render(
                <AmenityOverlay 
                    amenities={amenities}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={0.327}
                    svgOffsetX={0}
                    svgOffsetY={0}
                />
            );
            expect(getByTestId('amenity-touch-stairs1')).toBeTruthy();
            expect(getByTestId('amenity-touch-elevators1')).toBeTruthy();
        });
    });

    describe('SVG offset handling', () => {
        it('renders with horizontal offset', () => {
            const amenity = createMockAmenity({ id: 'stairs1' });
            const { getByTestId } = render(
                <AmenityOverlay 
                    amenities={[amenity]}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={1}
                    svgOffsetX={20}
                    svgOffsetY={0}
                />
            );
            expect(getByTestId('amenity-touch-stairs1')).toBeTruthy();
        });

        it('renders with vertical offset', () => {
            const amenity = createMockAmenity({ id: 'stairs1' });
            const { getByTestId } = render(
                <AmenityOverlay 
                    amenities={[amenity]}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={1}
                    svgOffsetX={0}
                    svgOffsetY={40}
                />
            );
            expect(getByTestId('amenity-touch-stairs1')).toBeTruthy();
        });
    });

    describe('Different amenity types', () => {
        const amenityTypes = [
            { id: 'stairs1', amenityKind: 'stairs', label: 'Stairs' },
            { id: 'elevators1', amenityKind: 'elevator', label: 'Elevator' },
            { id: 'printers1', amenityKind: 'printer', label: 'Printer' },
            { id: 'study1', amenityKind: 'study', label: 'Study Area' },
            { id: 'fountains1', amenityKind: 'fountain', label: 'Water Fountain' },
            { id: 'restrooms_m1', amenityKind: 'restroom_m', label: 'Men\'s Restroom' },
            { id: 'restrooms_w1', amenityKind: 'restroom_w', label: 'Women\'s Restroom' },
            { id: 'escalators_up1', amenityKind: 'escalator_up', label: 'Escalator Up' },
            { id: 'escalators_down1', amenityKind: 'escalator_down', label: 'Escalator Down' },
        ];

        amenityTypes.forEach(type => {
            it(`renders touch target for ${type.label}`, () => {
                const amenity = createMockAmenity({
                    id: type.id,
                    amenityKind: type.amenityKind,
                    label: type.label,
                });
                const { getByTestId } = render(
                    <AmenityOverlay 
                        amenities={[amenity]}
                        onAmenityPress={mockOnAmenityPress}
                        svgScale={1}
                        svgOffsetX={0}
                        svgOffsetY={0}
                    />
                );
                expect(getByTestId(`amenity-touch-${type.id}`)).toBeTruthy();
                
                // Tap it and verify callback
                fireEvent.press(getByTestId(`amenity-touch-${type.id}`));
                expect(mockOnAmenityPress).toHaveBeenCalledWith(amenity);
            });
        });
    });

    describe('Edge cases', () => {
        it('handles amenity with zero coordinates', () => {
            const amenity = createMockAmenity({
                id: 'stairs1',
                x: 0,
                y: 0,
            });
            const { getByTestId } = render(
                <AmenityOverlay 
                    amenities={[amenity]}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={1}
                    svgOffsetX={0}
                    svgOffsetY={0}
                />
            );
            expect(getByTestId('amenity-touch-stairs1')).toBeTruthy();
            fireEvent.press(getByTestId('amenity-touch-stairs1'));
            expect(mockOnAmenityPress).toHaveBeenCalledWith(amenity);
        });

        it('handles amenity with large coordinates', () => {
            const amenity = createMockAmenity({
                id: 'stairs1',
                x: 1000,
                y: 1000,
            });
            const { getByTestId } = render(
                <AmenityOverlay 
                    amenities={[amenity]}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={1}
                    svgOffsetX={0}
                    svgOffsetY={0}
                />
            );
            expect(getByTestId('amenity-touch-stairs1')).toBeTruthy();
        });

        it('handles many amenities', () => {
            const amenities = Array.from({ length: 20 }, (_, i) => 
                createMockAmenity({
                    id: `amenity${i}`,
                    x: i * 50,
                    y: i * 50,
                })
            );
            const { getAllByTestId } = render(
                <AmenityOverlay 
                    amenities={amenities}
                    onAmenityPress={mockOnAmenityPress}
                    svgScale={1}
                    svgOffsetX={0}
                    svgOffsetY={0}
                />
            );
            const touchTargets = getAllByTestId(/^amenity-touch-/);
            expect(touchTargets).toHaveLength(20);
        });
    });
});
