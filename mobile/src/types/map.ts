export type TravelMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT' | 'SHUTTLE';

export interface MapStep {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  html_instructions: string;
  polyline: { points: string };
  travel_mode: string;
}
