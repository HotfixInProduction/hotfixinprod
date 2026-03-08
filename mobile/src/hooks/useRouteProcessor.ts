import polyline from '@mapbox/polyline';
import { LatLng } from 'react-native-maps';
import { TravelMode } from '../data/mapStrategies';
import { useMemo } from 'react';

//Note: useMemo recommened online bc limits computing on every reload
interface GoogleStep {
    travel_mode: TravelMode;
    polyline: {points: string};
}

interface Directions {
    routes: Array <{
        legs: Array <{
            steps: GoogleStep[];
        }>;
    }>;
}

export interface StepProcessed {
    mode: TravelMode;
    coordinates: LatLng[]; //ensure its a lat lng value here. Maybe chnage to another type later ?
}

export const useRouteProcessor = (directions: Directions | null): StepProcessed[] => {
    return useMemo(() => {
        if (!directions?.routes?.[0]) 
            return []; // no routes available

        const steps = directions.routes[0].legs[0].steps;

        return steps.map((step) => ({
            mode: step.travel_mode,
            coordinates: polyline.decode(step.polyline.points).map(([lat, lng]: [number, number]) => ({
                latitude: lat,
                longitude: lng,
            })),
        }));
    }, [directions]);
};
    
