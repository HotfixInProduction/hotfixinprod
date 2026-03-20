import { renderHook } from '@testing-library/react-native';
import { useAmenities, getAmenityIconName} from '../src/hooks/useAmenities';

describe('useAmenities', () => {
    describe('useAmenities hook', () => {
        it('returns empty array when svgContent is undefined', () => {
            const { result } = renderHook(() => useAmenities(undefined));
            expect(result.current).toEqual([]);
        });

        it('returns empty array when svgContent is empty string', () => {
            const { result } = renderHook(() => useAmenities(''));
            expect(result.current).toEqual([]);
        });

        it('extracts stairs amenities from SVG content', () => {
            const svgContent = `
                <g id="stairs1" transform="translate(100, 200)">
                    <circle cx="0" cy="0" r="20" />
                </g>
            `;
            const { result } = renderHook(() => useAmenities(svgContent));
            expect(result.current).toHaveLength(1);
            expect(result.current[0]).toMatchObject({
                id: 'stairs1',
                type: 'stairs',
                amenityKind: 'stairs',
                x: 100,
                y: 200,
                label: 'Stairs',
                description: 'Staircase',
            });
        });

        it('extracts elevator amenities', () => {
            const svgContent = `
                <g id="elevators1" transform="translate(150, 250)">
                    <rect width="40" height="40" />
                </g>
            `;
            const { result } = renderHook(() => useAmenities(svgContent));
            expect(result.current).toHaveLength(1);
            expect(result.current[0]).toMatchObject({
                id: 'elevators1',
                type: 'elevator',
                amenityKind: 'elevator',
                x: 150,
                y: 250,
                label: 'Elevator',
            });
        });

        it('extracts printer amenities', () => {
            const svgContent = `
                <g id="printers1" transform="translate(300, 400)">
                    <rect width="20" height="20" />
                </g>
            `;
            const { result } = renderHook(() => useAmenities(svgContent));
            expect(result.current).toHaveLength(1);
            expect(result.current[0]).toMatchObject({
                id: 'printers1',
                type: 'stairs',
                amenityKind: 'printer',
                x: 300,
                y: 400,
                label: 'Printer',
                description: 'Printer Station',
            });
        });

        it('extracts study area amenities', () => {
            const svgContent = `
                <g id="study1" transform="translate(500, 600)">
                    <polygon points="0,0 50,0 50,50 0,50" />
                </g>
            `;
            const { result } = renderHook(() => useAmenities(svgContent));
            expect(result.current).toHaveLength(1);
            expect(result.current[0]).toMatchObject({
                id: 'study1',
                amenityKind: 'study',
                label: 'Study Area',
            });
        });

        it('extracts water fountain amenities', () => {
            const svgContent = `
                <g id="fountains1" transform="translate(200, 300)">
                    <circle cx="0" cy="0" r="15" />
                </g>
            `;
            const { result } = renderHook(() => useAmenities(svgContent));
            expect(result.current).toHaveLength(1);
            expect(result.current[0]).toMatchObject({
                id: 'fountains1',
                type: 'water_fountain',
                amenityKind: 'fountain',
                x: 200,
                y: 300,
                label: 'Water Fountain',
            });
        });

        it('extracts men\'s restroom amenities', () => {
            const svgContent = `
                <g id="restrooms_m1" transform="translate(350, 450)">
                    <rect width="30" height="30" />
                </g>
            `;
            const { result } = renderHook(() => useAmenities(svgContent));
            expect(result.current).toHaveLength(1);
            expect(result.current[0]).toMatchObject({
                id: 'restrooms_m1',
                type: 'washroom',
                amenityKind: 'restroom_m',
                label: 'Men\'s Restroom',
            });
        });

        it('extracts women\'s restroom amenities', () => {
            const svgContent = `
                <g id="restrooms_w1" transform="translate(360, 460)">
                    <rect width="30" height="30" />
                </g>
            `;
            const { result } = renderHook(() => useAmenities(svgContent));
            expect(result.current).toHaveLength(1);
            expect(result.current[0]).toMatchObject({
                id: 'restrooms_w1',
                type: 'washroom',
                amenityKind: 'restroom_w',
                label: 'Women\'s Restroom',
            });
        });

        it('extracts escalators up', () => {
            const svgContent = `
                <g id="escalators_up1" transform="translate(400, 500)">
                    <path d="M 0 0 L 50 50" />
                </g>
            `;
            const { result } = renderHook(() => useAmenities(svgContent));
            expect(result.current).toHaveLength(1);
            expect(result.current[0]).toMatchObject({
                id: 'escalators_up1',
                type: 'escalator',
                amenityKind: 'escalator_up',
                label: 'Escalator Up',
            });
        });

        it('extracts escalators down', () => {
            const svgContent = `
                <g id="escalators_down1" transform="translate(410, 510)">
                    <path d="M 0 0 L 50 50" />
                </g>
            `;
            const { result } = renderHook(() => useAmenities(svgContent));
            expect(result.current).toHaveLength(1);
            expect(result.current[0]).toMatchObject({
                id: 'escalators_down1',
                type: 'escalator',
                amenityKind: 'escalator_down',
                label: 'Escalator Down',
            });
        });

        it('extracts multiple amenities of different types', () => {
            const svgContent = `
                <g id="stairs1" transform="translate(100, 200)" />
                <g id="elevators1" transform="translate(150, 250)" />
                <g id="printers1" transform="translate(300, 400)" />
                <g id="fountains1" transform="translate(200, 300)" />
            `;
            const { result } = renderHook(() => useAmenities(svgContent));
            expect(result.current).toHaveLength(4);
            
            // Check that all were extracted
            const amenityIds = result.current.map(a => a.id);
            expect(amenityIds).toContain('stairs1');
            expect(amenityIds).toContain('elevators1');
            expect(amenityIds).toContain('printers1');
            expect(amenityIds).toContain('fountains1');
        });

        it('ignores elements with invalid coordinates', () => {
            const svgContent = `
                <g id="stairs1" transform="translate(100, 200)" />
                <g id="stairs2" transform="translate(invalid, 300)" />
                <g id="stairs3" transform="translate(400, bad)" />
                <g id="stairs4" transform="translate(500, 600)" />
            `;
            const { result } = renderHook(() => useAmenities(svgContent));
            expect(result.current).toHaveLength(2);
            expect(result.current[0].id).toBe('stairs1');
            expect(result.current[1].id).toBe('stairs4');
        });

        it('extracts numbered amenities (stairs2, elevators3, etc)', () => {
            const svgContent = `
                <g id="stairs1" transform="translate(100, 200)" />
                <g id="stairs2" transform="translate(110, 210)" />
                <g id="stairs3" transform="translate(120, 220)" />
            `;
            const { result } = renderHook(() => useAmenities(svgContent));
            expect(result.current).toHaveLength(3);
            expect(result.current.map(a => a.id)).toEqual(['stairs1', 'stairs2', 'stairs3']);
        });

        it('preserves decimal coordinates', () => {
            const svgContent = `
                <g id="stairs1" transform="translate(100.5, 200.75)" />
            `;
            const { result } = renderHook(() => useAmenities(svgContent));
            expect(result.current).toHaveLength(1);
            expect(result.current[0].x).toBe(100.5);
            expect(result.current[0].y).toBe(200.75);
        });
    });

    describe('getAmenityIconName', () => {
        it('returns correct icon for stairs', () => {
            expect(getAmenityIconName('stairs')).toBe('stairs');
        });

        it('returns correct icon for elevator', () => {
            expect(getAmenityIconName('elevator')).toBe('elevator');
        });

        it('returns correct icon for printer', () => {
            expect(getAmenityIconName('printer')).toBe('printer');
        });

        it('returns correct icon for study area', () => {
            expect(getAmenityIconName('study')).toBe('book-open');
        });

        it('returns correct icon for water fountain', () => {
            expect(getAmenityIconName('fountain')).toBe('water');
        });

        it('returns correct icon for men\'s restroom', () => {
            expect(getAmenityIconName('restroom_m')).toBe('toilet');
        });

        it('returns correct icon for women\'s restroom', () => {
            expect(getAmenityIconName('restroom_w')).toBe('toilet');
        });

        it('returns correct icon for escalator up', () => {
            expect(getAmenityIconName('escalator_up')).toBe('escalator-up');
        });

        it('returns correct icon for escalator down', () => {
            expect(getAmenityIconName('escalator_down')).toBe('escalator-down');
        });

        it('returns default icon for unknown amenity kind', () => {
            expect(getAmenityIconName('unknown_amenity')).toBe('information');
        });

        it('handles empty string', () => {
            expect(getAmenityIconName('')).toBe('information');
        });
    });
});
