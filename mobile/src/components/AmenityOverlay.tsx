import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { AmenityElement } from '../hooks/useAmenities';

type Props = Readonly<{
    amenities: AmenityElement[];
    svgScale: number; // Scale factor for SVG (e.g., 0.5 if SVG width is 50% of original)
    svgOffsetX: number; // Horizontal offset of SVG container
    svgOffsetY: number; // Vertical offset of SVG container
    onAmenityPress: (amenity: AmenityElement) => void;
}>;

const TOUCH_TARGET_SIZE = 50; // Size of invisible touch target
const TOUCH_TARGET_MARGIN = TOUCH_TARGET_SIZE / 2;

export default function AmenityOverlay({
    amenities,
    svgScale,
    svgOffsetX = 0,
    svgOffsetY = 0,
    onAmenityPress,
}: Props) {
    if (amenities.length === 0) {
        return null;
    }

    return (
        <View 
            style={styles.container}
            pointerEvents="box-none"
            testID="amenity-overlay"
        >
            {amenities.map((amenity) => {
                // Calculate touch target position based on SVG coordinates and scale
                const targetX = (amenity.x * svgScale) - TOUCH_TARGET_MARGIN + svgOffsetX;
                const targetY = (amenity.y * svgScale) - TOUCH_TARGET_MARGIN + svgOffsetY;

                const targetStyle: ViewStyle = {
                    position: 'absolute',
                    left: targetX,
                    top: targetY,
                };

                return (
                    <TouchableOpacity
                        key={amenity.id}
                        style={[styles.touchTarget, targetStyle]}
                        onPress={() => onAmenityPress(amenity)}
                        activeOpacity={0.3}
                        testID={`amenity-touch-${amenity.id}`}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: 'box-none',
    },
    touchTarget: {
        width: TOUCH_TARGET_SIZE,
        height: TOUCH_TARGET_SIZE,
        borderRadius: TOUCH_TARGET_SIZE / 2,
        // Invisible - no background color or border
    },
});
