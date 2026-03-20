export function highlightRoomInSvg(
    svgContent: string,
    startRoom: string | undefined,
    nextRoom: string | undefined
): string {
    let result = svgContent;

    // Helper function to highlight a room by either inkscape:label or text content
    const highlightRoom = (svg: string, roomLabel: string | undefined, color: string, strokeColor: string): string => {
        if (!roomLabel) return svg;
        
        let modified = svg;
        
        // Escape special regex characters in room label
        const escapedLabel = roomLabel.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
        
        // Method 1: Try to find by inkscape:label (old format)
        const labelRegex = new RegExp(
            `(<(?:rect|path)([^>]*?)inkscape:label=["']${escapedLabel}["']([^>]*?)>)`,
            'gi'
        );
        modified = modified.replace(labelRegex, (match) => {
            if (/style=["']/i.test(match)) {
                return match.replace(
                    /style=["']([^"']*)["']/i,
                    `style="fill:${color};fill-opacity:0.7;stroke:${strokeColor};stroke-width:3;stroke-opacity:1;"`
                );
            }
            return match.replace(/>$/, ` style="fill:${color};fill-opacity:0.7;stroke:${strokeColor};stroke-width:3;stroke-opacity:1;">`);
        });
        
        // Method 2: Try to find rect OR path followed by text with room number (new format)
        // The text comes after rect/path as a sibling element
        // Important: We need to ensure we don't match across multiple rect/path elements
        // Use a negated character class to prevent matching another <rect or <path before the text
        // Match text that contains EXACTLY the room number (with optional whitespace)
        const textRegex = new RegExp(
            String.raw`(<(?:rect|path)[^>]*?>)((?:(?!<(?:rect|path))[\s\S])*?<text[^>]*>\s*${escapedLabel}\s*</text>)`,
            'gi'
        );
        modified = modified.replace(textRegex, (match, rectPart, restPart) => {
            // Verify the text content matches the room label
            // Extract the text content from restPart
            const textMatch = restPart.match(/<text[^>]*>([^<]*)<\/text>/i);
            if (textMatch) {
                const textContent = textMatch[1].trim();
                // Check for exact match OR match with hyphen-to-decimal conversion
                // Room "862-5" in navmesh might appear as "862.5" in SVG
                const normalizedText = textContent.replace('.', '-');
                const normalizedLabel = roomLabel.replace('.', '-');
                
                // Check if it's an exact match (allowing for decimal/hyphen equivalence)
                if (normalizedText !== normalizedLabel) {
                    // Not a match, skip this rect
                    return match;
                }
            }
            
            // Check if this rect is already highlighted (avoid double-highlighting)
            if (rectPart.includes('fill:#4CAF50') || rectPart.includes('fill:#2196F3')) {
                return match;
            }
            // Also check if this is the corridor (has id="rect3007" or very large dimensions)
            // The corridor should not be highlighted as a room
            if (rectPart.includes('id="rect3007"') || rectPart.includes("id='rect3007'")) {
                return match;
            }
            if (/style=["']/i.test(rectPart)) {
                return rectPart.replace(
                    /style=["']([^"']*)["']/i,
                    `style="fill:${color};fill-opacity:0.7;stroke:${strokeColor};stroke-width:3;stroke-opacity:1;"`
                ) + restPart;
            }
            return rectPart.replace(/>$/, ` style="fill:${color};fill-opacity:0.7;stroke:${strokeColor};stroke-width:3;stroke-opacity:1;">`) + restPart;
        });
        
        return modified;
    };

    result = highlightRoom(result, startRoom, '#4CAF50', '#2E7D32');
    result = highlightRoom(result, nextRoom, '#2196F3', '#1565C0');

    return result;
}

export function generatePathElements(
    pathString: string,
    startX: number,
    startY: number,
    endX: number,
    endY: number
): string {
    // The path string already has transformed coordinates from generateSvgPath
    const pathElement = `<path d="${pathString}" stroke="#007AFF" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`;
    
    // Start and end markers
    const markers =
        `<circle cx="${startX}" cy="${startY}" r="12" fill="#34C759" stroke="#fff" stroke-width="3"/>` +
        `<circle cx="${endX}" cy="${endY}" r="12" fill="#FF3B30" stroke="#fff" stroke-width="3"/>`;

    return pathElement + markers;
}
