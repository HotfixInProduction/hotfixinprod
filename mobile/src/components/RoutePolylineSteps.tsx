import React from 'react';
import { Polyline } from 'react-native-maps';
import { StepStrategies } from '../data/mapStrategies';
import { StepProcessed } from '../hooks/useRouteProcessor';

interface RouteStepsProps{
    processedSteps: StepProcessed[]
}

export const RoutePolylineSteps: React.FC<RouteStepsProps> = ({processedSteps}) => {
    return (
        <>
            {processedSteps.map((step, index) => {
                const strategy = StepStrategies[step.mode] || StepStrategies.DEFAULT;

                // To fix SonarQube, needed to provide a unique key to Polyline since before we were relying on index of the step
                const key = `${step.mode}-${step.coordinates[0].latitude}-${step.coordinates[0].longitude}`;
                
                // DEBUG: See why it's picking a specific color
                console.log(`Segment ${index} mode: ${step.mode}, Color: ${strategy.strokeColor}`);
                return (
                    <Polyline
                        key={key}
                        coordinates={step.coordinates}
                        strokeColor={strategy.strokeColor}
                        strokeWidth={strategy.strokeWidth}
                        lineDashPattern={strategy.lineDashPattern}
                        geodesic={true}
                        zIndex={100} 
                        lineCap="round"
                    />
                )
            })}
        </>
    );
};

