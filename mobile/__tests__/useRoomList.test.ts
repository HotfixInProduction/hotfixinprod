import { renderHook } from '@testing-library/react-native';
import { useRoomList } from '../src/hooks/useRoomList';

describe('useRoomList', () => {
    describe('extractRoomsFromSvg', () => {
        it('returns empty array when svgContent is undefined', () => {
            const { result } = renderHook(() => useRoomList(undefined));
            expect(result.current).toEqual([]);
        });

        it('returns empty array when svgContent is empty string', () => {
            const { result } = renderHook(() => useRoomList(''));
            expect(result.current).toEqual([]);
        });

        it('extracts room labels from SVG content', () => {
            const svgContent = `
                <g inkscape:label="801" />
                <g inkscape:label="803" />
                <g inkscape:label="829" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801', '803', '829']);
        });

        it('sorts numeric room labels numerically', () => {
            const svgContent = `
                <g inkscape:label="829" />
                <g inkscape:label="801" />
                <g inkscape:label="862" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801', '829', '862']);
        });

        it('sorts non-numeric room labels alphabetically using localeCompare', () => {
            const svgContent = `
                <g inkscape:label="Lobby" />
                <g inkscape:label="Entrance" />
                <g inkscape:label="Cafeteria" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            // localeCompare sorts alphabetically: Cafeteria, Entrance, Lobby
            expect(result.current).toEqual(['Cafeteria', 'Entrance', 'Lobby']);
        });

        it('sorts mixed numeric and non-numeric labels', () => {
            const svgContent = `
                <g inkscape:label="Lobby" />
                <g inkscape:label="801" />
                <g inkscape:label="803" />
                <g inkscape:label="Entrance" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            // Numeric sorted numerically, non-numeric sorted alphabetically
            // When comparing numeric vs non-numeric, localeCompare is used
            expect(result.current).toEqual(['801', '803', 'Entrance', 'Lobby']);
        });

        it('removes duplicate room labels', () => {
            const svgContent = `
                <g inkscape:label="801" />
                <g inkscape:label="801" />
                <g inkscape:label="803" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801', '803']);
        });

        it('filters out Floor labels', () => {
            const svgContent = `
                <g inkscape:label="801" />
                <g inkscape:label="Floor 1" />
                <g inkscape:label="Floor" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801']);
        });

        it('filters out Layer labels', () => {
            const svgContent = `
                <g inkscape:label="801" />
                <g inkscape:label="Layer 1" />
                <g inkscape:label="layer 2" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801']);
        });

        it('filters out S1/S2 vec labels', () => {
            const svgContent = `
                <g inkscape:label="801" />
                <g inkscape:label="S1 vec" />
                <g inkscape:label="S2 vec" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801']);
        });

        it('trims whitespace from labels', () => {
            const svgContent = `
                <g inkscape:label="  801  " />
                <g inkscape:label="  803  " />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801', '803']);
        });

        it('handles single quotes in labels', () => {
            const svgContent = `
                <g inkscape:label='801' />
                <g inkscape:label='803' />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['801', '803']);
        });

        it('handles floating point numbers', () => {
            const svgContent = `
                <g inkscape:label="101.5" />
                <g inkscape:label="101.2" />
                <g inkscape:label="101.8" />
            `;
            const { result } = renderHook(() => useRoomList(svgContent));
            expect(result.current).toEqual(['101.2', '101.5', '101.8']);
        });
    });
});
