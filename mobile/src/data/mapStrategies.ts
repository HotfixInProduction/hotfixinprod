export type TravelMode = 'WALKING' | 'TRANSIT' | 'DRIVING' | 'BICYCLING';

interface RouteStyle {
  strokeColor: string;
  strokeWidth: number;
  lineDashPattern?: number[];
}

export const StepStrategies: Record<TravelMode | 'DEFAULT', RouteStyle> = {
  WALKING: {
    strokeColor: "#1A73E8",
    strokeWidth: 5,        
    lineDashPattern: [2, 6],
  },
  TRANSIT: {
    strokeColor: "#000000",
    strokeWidth: 8,        
    lineDashPattern: undefined,
  },
  DRIVING: {
    strokeColor: "#D93025",
    strokeWidth: 4,
    lineDashPattern: undefined,
  },
  BICYCLING: {
    strokeColor: "#E37400",
    strokeWidth: 4,
    lineDashPattern: [10, 5],
  },
  DEFAULT: {
    strokeColor: "#5F6368",
    strokeWidth: 4,
  },
};