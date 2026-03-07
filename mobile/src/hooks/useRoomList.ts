import { useMemo } from 'react';

function extractRoomsFromSvg(svgContent: string): string[] {
  const regex = /inkscape:label=["']([^"']+)["']/g;
  const rooms = new Set<string>();
  let match;
  while ((match = regex.exec(svgContent)) !== null) {
    const label = match[1].trim();
    if (label && !/^(Floor|Layer|layer|S[12] vec)/i.test(label)) {
      rooms.add(label);
    }
  }
  return Array.from(rooms).sort((a, b) => {
    const numA = Number.parseFloat(a);
    const numB = Number.parseFloat(b);
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
}

export function useRoomList(svgContent: string | undefined): string[] {
  return useMemo(
    () => (svgContent ? extractRoomsFromSvg(svgContent) : []),
    [svgContent]
  );
}
