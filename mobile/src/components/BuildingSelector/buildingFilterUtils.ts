import { buildings } from '../../data/buildings';
import type { Building } from '../../types/building';

export const getMatchingBuildings = (query: string): Building[] => {
  if (!query.trim()) {
    return [];
  }
  const lowerQuery = query.toLowerCase();
  return buildings.filter(building => 
    building.id.toLowerCase().includes(lowerQuery) ||
    building.label.toLowerCase().includes(lowerQuery) ||
    building.address?.toLowerCase().includes(lowerQuery)
  );
};
