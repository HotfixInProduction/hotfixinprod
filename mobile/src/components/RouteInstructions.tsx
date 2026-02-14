import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { MapStep } from '../types/map';

interface RouteInstructionsProps {
    instructions: MapStep[];
    onClose: () => void;
}

const RouteInstructions = ({ instructions, onClose }: RouteInstructionsProps) => {
    // helper to strip HTML tags from Google's instructions (e.g., <b>Turn left</b>)
    const formatText = (html: string) => {
        let text = html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ');

        // look for "Destination" and add a newline before it
        if (text.includes("Destination")) {
            text = text.replace(/(Destination)/i, '\n$1');
        }

        return text;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Directions</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <MaterialIcons name="close" size={18} color="#912338" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollArea}>
                {instructions.map((step, index) => (
                    <View key={index} style={styles.stepRow}>
                        <View style={styles.textColumn}>
                            <Text style={styles.instructionText}>{formatText(step.html_instructions)}</Text>
                            <Text style={styles.distanceText}>{step.distance.text}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        height: '30%',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    closeButton: {
        padding: 4,
        backgroundColor: '#F1F3F4',
        borderRadius: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f1f1f',
    },
    scrollArea: {
        flex: 1,
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
});

export default RouteInstructions;