export type TravelMode = 'WALKING' | 'TRANSIT' | 'DRIVING' | 'BICYCLING';

interface RouteStyle {
  strokeColor: string;
  strokeWidth: number;
  lineDashPattern?: number[];
}

export const StepStrategies: Record<TravelMode | 'DEFAULT', RouteStyle> = {
  WALKING: {
    strokeColor: "#4285F4",
    strokeWidth: 4,
    lineDashPattern: [2, 10],
  },
  TRANSIT: {
    strokeColor: "#34A853",
    strokeWidth: 6,
    lineDashPattern: undefined,
  },
  DRIVING: {
    strokeColor: "#35ea7d",
    strokeWidth: 4,
    lineDashPattern: undefined,
  },
  BICYCLING: {
    strokeColor: "#FBBC05",
    strokeWidth: 4,
    lineDashPattern: undefined,
  },
  DEFAULT: {
    strokeColor: "#912338",
    strokeWidth: 4,
  },
};