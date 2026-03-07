import { highlightRoomInSvg, generatePathElements } from '../src/utils/svgUtils';

describe('svgUtils', () => {
    describe('highlightRoomInSvg', () => {
        const mockSvgContent = `<svg>
            <rect inkscape:label="801" width="100" height="100"/>
            <rect inkscape:label="803" width="100" height="100"/>
            <path inkscape:label="corridor" d="M0,0 L100,100"/>
        </svg>`;

        describe('when neither room is provided', () => {
            it('returns original SVG unchanged', () => {
                const result = highlightRoomInSvg(mockSvgContent, undefined, undefined);
                expect(result).toBe(mockSvgContent);
            });
        });

        describe('when only startRoom is provided', () => {
            it('highlights the start room with green style', () => {
                const result = highlightRoomInSvg(mockSvgContent, '801', undefined);
                expect(result).toContain('fill:#4CAF50');
                expect(result).toContain('stroke:#2E7D32');
            });

            it('handles start room with existing style attribute', () => {
                const svgWithStyle = `<svg>
                    <rect inkscape:label="801" style="fill:red;" width="100" height="100"/>
                </svg>`;
                const result = highlightRoomInSvg(svgWithStyle, '801', undefined);
                expect(result).toContain('fill:#4CAF50');
            });

            it('does not modify other rooms', () => {
                const result = highlightRoomInSvg(mockSvgContent, '801', undefined);
                expect(result).not.toContain('fill:#2196F3'); // next room color
            });
        });

        describe('when only nextRoom is provided', () => {
            it('highlights the next room with blue style', () => {
                const result = highlightRoomInSvg(mockSvgContent, undefined, '803');
                expect(result).toContain('fill:#2196F3');
                expect(result).toContain('stroke:#1565C0');
            });

            it('handles next room with existing style attribute', () => {
                const svgWithStyle = `<svg>
                    <rect inkscape:label="803" style="fill:red;" width="100" height="100"/>
                </svg>`;
                const result = highlightRoomInSvg(svgWithStyle, undefined, '803');
                expect(result).toContain('fill:#2196F3');
            });
        });

        describe('when both rooms are provided', () => {
            it('highlights both rooms with different colors', () => {
                const result = highlightRoomInSvg(mockSvgContent, '801', '803');
                expect(result).toContain('fill:#4CAF50'); // start room green
                expect(result).toContain('fill:#2196F3'); // next room blue
            });

            it('highlights same room as both start and next', () => {
                const result = highlightRoomInSvg(mockSvgContent, '801', '801');
                // Last highlight wins - should be blue (next room color)
                expect(result).toContain('fill:#2196F3');
            });
        });

        describe('edge cases', () => {
            it('handles room not found in SVG', () => {
                const result = highlightRoomInSvg(mockSvgContent, '999', undefined);
                expect(result).toBe(mockSvgContent);
            });

            it('handles path elements', () => {
                const result = highlightRoomInSvg(mockSvgContent, 'corridor', undefined);
                expect(result).toContain('fill:#4CAF50');
            });

            it('is case insensitive for style attribute', () => {
                const svgWithStyle = `<svg>
                    <rect inkscape:label="801" STYLE="fill:red;" width="100" height="100"/>
                </svg>`;
                const result = highlightRoomInSvg(svgWithStyle, '801', undefined);
                expect(result).toContain('fill:#4CAF50');
            });

            it('handles single quotes for label', () => {
                const svgWithSingleQuotes = `<svg>
                    <rect inkscape:label='801' width="100" height="100"/>
                </svg>`;
                const result = highlightRoomInSvg(svgWithSingleQuotes, '801', undefined);
                expect(result).toContain('fill:#4CAF50');
            });
        });
    });

    describe('generatePathElements', () => {
        it('generates path SVG with markers', () => {
            const pathString = 'M 10 20 L 100 200';
            const result = generatePathElements(pathString, 10, 20, 100, 200);

            expect(result).toContain('<path');
            expect(result).toContain(`d="${pathString}"`);
            expect(result).toContain('stroke="#007AFF"');
        });

        it('includes start marker (green circle)', () => {
            const result = generatePathElements('M 0 0 L 50 50', 0, 0, 50, 50);
            expect(result).toContain('cx="0"');
            expect(result).toContain('cy="0"');
            expect(result).toContain('fill="#34C759"');
        });

        it('includes end marker (red circle)', () => {
            const result = generatePathElements('M 0 0 L 50 50', 0, 0, 50, 50);
            expect(result).toContain('cx="50"');
            expect(result).toContain('cy="50"');
            expect(result).toContain('fill="#FF3B30"');
        });

        it('handles floating point coordinates', () => {
            const result = generatePathElements('M 10.5 20.3 L 100.7 200.9', 10.5, 20.3, 100.7, 200.9);
            expect(result).toContain('cx="10.5"');
            expect(result).toContain('cy="20.3"');
            expect(result).toContain('cx="100.7"');
            expect(result).toContain('cy="200.9"');
        });
    });
});
