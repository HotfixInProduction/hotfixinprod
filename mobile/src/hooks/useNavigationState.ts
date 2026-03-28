import { useState, useCallback, useRef } from 'react';
import { findPathToExit, findPathFromEntry, findPathBetweenRooms, filterWalkingSegments } from './useIndoorPath';
import { splitPathByFloor, generateIndoorInstruction } from '../utils/Pathfinding';
import type { MapStep, TravelMode } from '../types/map';
import type { RoomSelection } from '../types/building';
import type { Place } from '../components/BuildingSelector/StartDestinationPicker';
import type { IndoorNavigationStep } from '../components/FloorPlanViewer';

// Navigation types for unified indoor/outdoor navigation
export type OutdoorNavigationStep = {
    type: 'outdoor';
    instructions: MapStep[];
};

export type NavigationStep = IndoorNavigationStep | OutdoorNavigationStep;

// Helper function to generate indoor navigation steps from a path
function generateIndoorSteps(
    path: any,
    buildingId: string,
    existingSteps: NavigationStep[]
): void {
    if (!path) return;
    
    const walkingSegments = filterWalkingSegments(splitPathByFloor(path));
    walkingSegments.forEach((seg, idx) => {
        existingSteps.push({
            type: 'indoor',
            buildingId,
            floor: seg.floor,
            path: seg.nodes,
            instruction: generateIndoorInstruction(seg.nodes, idx === walkingSegments.length - 1),
        });
    });
}

// Helper function to generate same-building navigation steps
function generateSameBuildingSteps(
    startRoomSelection: RoomSelection,
    destinationRoomSelection: RoomSelection,
    isAccessible: boolean
): NavigationStep[] {
    const steps: NavigationStep[] = [];
    const path = findPathBetweenRooms(
        startRoomSelection.buildingId,
        startRoomSelection.floor,
        startRoomSelection.room,
        destinationRoomSelection.room,
        isAccessible
    );
    generateIndoorSteps(path, startRoomSelection.buildingId, steps);
    return steps;
}

// Helper function to generate mixed route navigation steps
function generateMixedRouteSteps(
    startRoomSelection: RoomSelection | null,
    destinationRoomSelection: RoomSelection | null,
    instructions: MapStep[],
    isAccessible: boolean
): NavigationStep[] {
    const steps: NavigationStep[] = [];
    
    // Exit path from start building
    if (startRoomSelection) {
        const path = findPathToExit(
            startRoomSelection.buildingId,
            startRoomSelection.floor,
            startRoomSelection.room,
            isAccessible
        );
        generateIndoorSteps(path, startRoomSelection.buildingId, steps);
    }
    
    // Outdoor navigation
    if (instructions.length > 0) {
        steps.push({ type: 'outdoor', instructions });
    }
    
    // Entry path to destination building
    if (destinationRoomSelection) {
        const path = findPathFromEntry(
            destinationRoomSelection.buildingId,
            destinationRoomSelection.floor,
            destinationRoomSelection.room,
            isAccessible
        );
        generateIndoorSteps(path, destinationRoomSelection.buildingId, steps);
    }
    
    return steps;
}

interface UseNavigationStateProps {
    transportMode: TravelMode;
    startRoomSelection: RoomSelection | null;
    destinationRoomSelection: RoomSelection | null;
    instructions: MapStep[];
    start: Place | null;
    destination: Place | null;
    googleMapsApiKey: string | undefined;
    onShowShuttleSchedule: () => void;
    onShowInstructions: () => void;
    onExit: () => void;
    onRestoreRouteInfo?: (routeInfo: { distance: number; duration: number }) => void;
}

interface UseNavigationStateReturn {
    navigationSteps: NavigationStep[];
    currentStepIndex: number;
    isNavigating: boolean;
    activeStep: NavigationStep | null;
    handleStartNavigation: () => void;
    handleNextStep: () => void;
    handlePrevStep: () => void;
    handleExitNavigation: () => void;
}

const GOOGLE_DIRECTIONS_MODE: Record<TravelMode, string> = {
    DRIVING: 'driving',
    WALKING: 'walking',
    BICYCLING: 'bicycling',
    TRANSIT: 'transit',
    SHUTTLE: 'shuttle'
};

// Helper function to restore route info via Google Maps API
async function restoreRouteInfoViaApi(
    start: Place,
    destination: Place,
    googleMapsApiKey: string,
    transportMode: TravelMode,
    onRestoreRouteInfo: (routeInfo: { distance: number; duration: number }) => void
): Promise<void> {
    const mode = transportMode === 'SHUTTLE' ? 'driving' : GOOGLE_DIRECTIONS_MODE[transportMode];
    const params = new URLSearchParams({
        origin: `${start.location.lat},${start.location.lng}`,
        destination: `${destination.location.lat},${destination.location.lng}`,
        key: googleMapsApiKey,
        mode,
    });
    const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.routes.length > 0) {
            onRestoreRouteInfo({
                distance: data.routes[0].legs[0].distance.value / 1000,
                duration: Math.ceil(data.routes[0].legs[0].duration.value / 60),
            });
        }
    } catch (error) {
        console.error('[restoreRouteInfo] Failed to restore routeInfo:', error);
    }
}

export function useNavigationState({
    transportMode,
    startRoomSelection,
    destinationRoomSelection,
    instructions,
    start,
    destination,
    googleMapsApiKey,
    onShowShuttleSchedule,
    onShowInstructions,
    onExit,
    onRestoreRouteInfo,
}: UseNavigationStateProps): UseNavigationStateReturn {
    const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const isExitingRef = useRef(false);

    const isNavigating = currentStepIndex >= 0 && currentStepIndex < navigationSteps.length;
    const activeStep = isNavigating ? navigationSteps[currentStepIndex] : null;

    const handleStartNavigation = useCallback(() => {
        console.log('[handleStartNavigation] Called');
        console.log('[handleStartNavigation] isExitingRef.current:', isExitingRef.current);

        // Prevent auto-restart right after exit
        if (isExitingRef.current) {
            console.log('[handleStartNavigation] Blocked - currently exiting');
            isExitingRef.current = false;
            return;
        }

        console.log('[handleStartNavigation] transportMode:', transportMode);
        console.log('[handleStartNavigation] navigationSteps.length:', navigationSteps.length);
        console.log('[handleStartNavigation] startRoomSelection:', startRoomSelection);
        console.log('[handleStartNavigation] destinationRoomSelection:', destinationRoomSelection);
        console.log('[handleStartNavigation] instructions.length:', instructions.length);

        if (transportMode === 'SHUTTLE') {
            onShowShuttleSchedule();
            return;
        }

        // If we already have navigation steps and just exited, reuse them
        if (navigationSteps.length > 0) {
            console.log('[handleStartNavigation] Reusing existing navigation steps');
            setCurrentStepIndex(0);
            return;
        }

        const isAccessible = false;
        const startBuildingId = startRoomSelection?.buildingId;
        const destBuildingId = destinationRoomSelection?.buildingId;
        
        // Determine route type and generate steps
        const isSameBuilding = startRoomSelection && destinationRoomSelection && startBuildingId === destBuildingId;
        
        const generatedSteps = isSameBuilding
            ? generateSameBuildingSteps(startRoomSelection, destinationRoomSelection, isAccessible)
            : generateMixedRouteSteps(startRoomSelection, destinationRoomSelection, instructions, isAccessible);

        if (generatedSteps.length > 0) {
            setNavigationSteps(generatedSteps);
            setCurrentStepIndex(0);
        } else {
            // Fallback for purely outdoor Google Maps navigation without rooms
            onShowInstructions();
        }
    }, [transportMode, startRoomSelection, destinationRoomSelection, instructions, navigationSteps, onShowShuttleSchedule, onShowInstructions]);

    const handleNextStep = useCallback(() => {
        if (currentStepIndex < navigationSteps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            // Last step - exit navigation
            onExit();
        }
    }, [currentStepIndex, navigationSteps.length, onExit]);

    const handlePrevStep = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    }, [currentStepIndex]);

    const handleExitNavigation = useCallback(() => {
        console.log('[handleExitNavigation] Called');
        isExitingRef.current = true;
        setCurrentStepIndex(-1);
        setNavigationSteps([]);
        onExit();

        // Restore route info so "View Directions" works after exit
        if (onRestoreRouteInfo && start && destination && googleMapsApiKey) {
            restoreRouteInfoViaApi(start, destination, googleMapsApiKey, transportMode, onRestoreRouteInfo);
        }
    }, [onExit, onRestoreRouteInfo, start, destination, googleMapsApiKey, transportMode]);

    return {
        navigationSteps,
        currentStepIndex,
        isNavigating,
        activeStep,
        handleStartNavigation,
        handleNextStep,
        handlePrevStep,
        handleExitNavigation,
    };
}
