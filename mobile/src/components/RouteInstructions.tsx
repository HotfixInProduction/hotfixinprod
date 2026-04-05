import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, PanResponder, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { MapStep } from '../types/map';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { Place } from './BuildingSelector/StartDestinationPicker';

const { height: screenHeight } = Dimensions.get('window');
const MIN_HEIGHT = 140; // Collapsed height - just the header
const MAX_HEIGHT = screenHeight * 0.5; // Expanded height

export type NavigationMode = 'indoor' | 'outdoor' | null;

interface RouteInstructionsProps {
    instructions: MapStep[];
    start: Place | null;
    destination: Place | null;
    onClose: () => void;
    onViewFloorPlan: (buildingId: string, floor?: string) => void;
    // Navigation props
    navigationMode?: NavigationMode;
    navigationInstruction?: string;
    onNextStep?: () => void;
    onPrevStep?: () => void;
    isFirstStep?: boolean;
    isLastStep?: boolean;
}

const RouteInstructions = ({ 
    instructions, 
    start, 
    destination, 
    onClose, 
    onViewFloorPlan,
    navigationMode,
    navigationInstruction,
    onNextStep,
    onPrevStep,
    isFirstStep = true,
    isLastStep = false,
}: RouteInstructionsProps) => {
    const [panelHeight] = useState(new Animated.Value(MIN_HEIGHT));
    const isExpanded = useRef(false);
    
    const isNavigating = navigationMode !== null;

    // helper to strip HTML tags from Google's instructions (e.g., <b>Turn left</b>)
    const formatText = (html: string) => {
        let text = html.replaceAll(/<[^>]*>?/gm, '').replaceAll('&nbsp;', ' ');

        // look for "Destination" and add a newline before it
        if (text.includes("Destination")) {
            text = text.replace(/(Destination)/i, '\n$1');
        }

        return text;
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                // Calculate new height based on gesture
                const newHeight = MAX_HEIGHT - gestureState.dy;
                const clampedHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));
                panelHeight.setValue(clampedHeight);
            },
            onPanResponderRelease: (_, gestureState) => {
                // Snap to expanded or collapsed based on velocity and position
                const shouldExpand = gestureState.dy < -50 || gestureState.vy < -0.5;
                const targetHeight = shouldExpand ? MAX_HEIGHT : MIN_HEIGHT;
                
                isExpanded.current = shouldExpand;
                
                Animated.spring(panelHeight, {
                    toValue: targetHeight,
                    useNativeDriver: false,
                    tension: 80,
                    friction: 12,
                }).start();
            },
        })
    ).current;

    const togglePanel = () => {
        isExpanded.current = !isExpanded.current;
        Animated.spring(panelHeight, {
            toValue: isExpanded.current ? MAX_HEIGHT : MIN_HEIGHT,
            useNativeDriver: false,
            tension: 80,
            friction: 12,
        }).start();
    };

    return (
        <Animated.View style={[styles.container, { height: panelHeight }]}>
            {/* Drag handle area */}
            <View {...panResponder.panHandlers} style={styles.dragHandle}>
                <View style={styles.dragIndicator} />
                <View style={styles.headerRow}>
                    <Text style={styles.title}>Directions</Text>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity testID="expand-directions-button" onPress={togglePanel} style={styles.toggleButton}>
                            <MaterialIcons 
                                name={isExpanded.current ? "expand-more" : "expand-less"}
                                size={20} 
                                color="#912338" 
                            />
                        </TouchableOpacity>
                        <TouchableOpacity testID="close-button" onPress={onClose} style={styles.closeButton}>
                            <MaterialIcons name="close" size={18} color="#912338" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Navigation Controls Panel - shown when navigating */}
            {isNavigating && (
                <View style={styles.navPanel}>
                    <View style={styles.navContentRow}>
                        <View style={styles.navInstructionColumn}>
                            <MaterialCommunityIcons 
                                name={navigationMode === 'indoor' ? 'directions' : 'walk'}
                                size={24}
                                color="#912338"
                            />
                            <Text style={styles.navInstructionText} numberOfLines={2}>
                                {navigationInstruction || (navigationMode === 'outdoor'
                                    ? 'Follow outdoor route map to next building' 
                                    : 'Follow indoor path')}
                            </Text>
                        </View>
                        
                        {/* Circular buttons side by side on the right */}
                        <View style={styles.navButtonRow}>
                            <TouchableOpacity
                                testID="prev-instruction-button"
                                style={[styles.navCircleBtn, isFirstStep && styles.navCircleBtnDisabled]}
                                onPress={onPrevStep}
                                disabled={isFirstStep}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.navCircleBtnText, isFirstStep && styles.navCircleBtnTextDisabled]}>Prev</Text>
                            </TouchableOpacity>

                            {isLastStep ? (
                                /* Invisible placeholder keeps "Prev" button from shifting right */
                                <View style={{ width: 56, height: 56 }} />
                            ) : (
                                <TouchableOpacity 
                                    testID="next-instruction-button"
                                    style={[styles.navCircleBtn, styles.navCircleBtnPrimary]} 
                                    onPress={onNextStep}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.navCircleBtnTextPrimary}>Next</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            )}

            <ScrollView style={styles.scrollArea}>
                {start && (
                    <View style={styles.stepRow}>
                        <View style={styles.textColumn}>
                            <Text style={styles.instructionText}>
                                Exit {start.name}
                            </Text>
                        </View>
                    </View>
                )}

                {instructions.map((step, index) => (
                    <View key={`${index}-${step.html_instructions}`} style={styles.stepRow}>
                        <View style={styles.textColumn}>
                            <Text style={styles.instructionText}>{formatText(step.html_instructions)}</Text>
                            <Text style={styles.distanceText}>{step.distance.text}</Text>
                        </View>
                    </View>
                ))}

                {destination && (
                    <View style={styles.stepRow}>
                        <View style={styles.textColumn}>
                            <Text style={styles.instructionText}>
                                Enter {destination.name}
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 110,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        zIndex: 110,
    },
    dragHandle: {
        paddingTop: 8,
        paddingBottom: 8,
        paddingHorizontal: 20,
    },
    dragIndicator: {
        width: 40,
        height: 4,
        backgroundColor: '#DDD',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    toggleButton: {
        padding: 4,
        backgroundColor: '#F1F3F4',
        borderRadius: 16,
    },
    closeButton: {
        padding: 4,
        backgroundColor: '#F1F3F4',
        borderRadius: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f1f1f',
    },
    scrollArea: {
        flex: 1,
        paddingHorizontal: 20,
    },
    stepRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    textColumn: {
        flex: 1,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    instructionText: {
        fontSize: 16,
        lineHeight: 22,
        flexShrink: 1,
    },
    distanceText: {
        fontSize: 14,
        color: '#912338',
        marginTop: 4,
        fontWeight: '600',
    },
    floorPlanBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#912338',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 6,
        alignSelf: 'flex-start',
        gap: 6,
    },
    floorPlanBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    // Navigation panel styles
    navPanel: {
        backgroundColor: '#FAFAFA',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        padding: 16,
    },
    navContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    navInstructionColumn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    navInstructionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f1f1f',
        marginLeft: 12,
        flex: 1,
    },
    navButtonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    navCircleBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    navCircleBtnPrimary: {
        backgroundColor: '#912338',
    },
    navCircleBtnDisabled: {
        opacity: 0.5,
    },
    navCircleBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    navCircleBtnTextPrimary: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    navCircleBtnTextDisabled: {
        color: '#A0A0A0',
    },
});

export default RouteInstructions;