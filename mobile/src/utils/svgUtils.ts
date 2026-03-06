export function highlightRoomInSvg(
    svgContent: string,
    startRoom: string | undefined,
    nextRoom: string | undefined
): string {
    let result = svgContent;

    if (startRoom) {
        const startRegex = new RegExp(
            `(<(?:rect|path)([^>]*?)inkscape:label=["']${startRoom}["']([^>]*?)>)`,
            'gi'
        );
        result = result.replace(startRegex, (match) => {
            if (/style=["']/i.test(match)) {
                return match.replace(
                    /style=["']([^"']*)["']/i,
                    'style="fill:#4CAF50;fill-opacity:0.7;stroke:#2E7D32;stroke-width:3;stroke-opacity:1;"'
                );
            }
            return match.replace(/>$/, ' style="fill:#4CAF50;fill-opacity:0.7;stroke:#2E7D32;stroke-width:3;stroke-opacity:1;">');
        });
    }

    if (nextRoom) {
        const nextRegex = new RegExp(
            `(<(?:rect|path)([^>]*?)inkscape:label=["']${nextRoom}["']([^>]*?)>)`,
            'gi'
        );
        result = result.replace(nextRegex, (match) => {
            if (/style=["']/i.test(match)) {
                return match.replace(
                    /style=["']([^"']*)["']/i,
                    'style="fill:#2196F3;fill-opacity:0.7;stroke:#1565C0;stroke-width:3;stroke-opacity:1;"'
                );
            }
            return match.replace(/>$/, ' style="fill:#2196F3;fill-opacity:0.7;stroke:#1565C0;stroke-width:3;stroke-opacity:1;">');
        });
    }

    return result;
}

export function generatePathElements(
    pathString: string,
    startX: number,
    startY: number,
    endX: number,
    endY: number
): string {
    const pathSvg = `<path d="${pathString}" stroke="#007AFF" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="1"/>`;
    const markers =
        `<circle cx="${startX}" cy="${startY}" r="12" fill="#34C759" stroke="#fff" stroke-width="3"/>` +
        `<circle cx="${endX}" cy="${endY}" r="12" fill="#FF3B30" stroke="#fff" stroke-width="3"/>`;

    return pathSvg + markers;
}
