import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Dimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { findPath, generateSvgPath } from '../utils/Pathfinding';

type FloorPlanMap = {
    [key: string]: string;
};

type Building = {
    id: string;
    address?: string;
    floorPlans?: FloorPlanMap;
};

type Props = Readonly<{
    building: Building | null;
    floorLevel?: string;
    onClose: () => void;
    pathStartNode?: number;
    pathEndNode?: number;
    startRoom?: string;
    nextRoom?: string;
}>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

function highlightRoomInSvg(
    svgContent: string,
    startRoom: string | undefined,
    nextRoom: string | undefined
): string {
    let result = svgContent;

    // Highlight start room with green
    if (startRoom) {
        const startRegex = new RegExp(
            `(<(?:rect|path)([^>]*?)inkscape:label=["']${startRoom}["']([^>]*?)>)`,
            'gi'
        );

        result = result.replace(startRegex, (match) => {
            if (/style=["']/i.test(match)) {
                return match.replace(
                    /style=["']([^"']*)["']/i,
                    'style="fill:#4CAF50;fill-opacity:0.7;stroke:#2E7D32;stroke-width:3;stroke-opacity:1;"'
                );
            } else {
                return match.replace(/>$/, ' style="fill:#4CAF50;fill-opacity:0.7;stroke:#2E7D32;stroke-width:3;stroke-opacity:1;">');
            }
        });
    }

    // Highlight next room with blue
    if (nextRoom) {
        const nextRegex = new RegExp(
            `(<(?:rect|path)([^>]*?)inkscape:label=["']${nextRoom}["']([^>]*?)>)`,
            'gi'
        );

        result = result.replace(nextRegex, (match) => {
            if (/style=["']/i.test(match)) {
                return match.replace(
                    /style=["']([^"']*)["']/i,
                    'style="fill:#2196F3;fill-opacity:0.7;stroke:#1565C0;stroke-width:3;stroke-opacity:1;"'
                );
            } else {
                return match.replace(/>$/, ' style="fill:#2196F3;fill-opacity:0.7;stroke:#1565C0;stroke-width:3;stroke-opacity:1;">');
            }
        });
    }

    return result;
}

export default function FloorPlanViewer({
    building,
    floorLevel = '8', //for testing in app
    onClose,
    pathStartNode = 0, //for testing in app
    pathEndNode = 48,  //for testing in app
    startRoom = '829',
    nextRoom = '862'
}: Props) {
    const rawSvgContent = building?.floorPlans?.[floorLevel];

    const path = React.useMemo(() => {
        if (pathStartNode !== undefined && pathEndNode !== undefined && building?.id) {
            return findPath(building.id, floorLevel, pathStartNode, pathEndNode);
        }
        return null;
    }, [pathStartNode, pathEndNode, building?.id, floorLevel]);

    const svgWithPaths = React.useMemo(() => {
        const highlighted = rawSvgContent ? highlightRoomInSvg(rawSvgContent, startRoom, nextRoom) : rawSvgContent;

        if (!highlighted || !path || path.length === 0) {
            console.log('No path to display');
            return highlighted;
        }

        const pathString = generateSvgPath(path);
        const pathSvg = `<path d="${pathString}" stroke="#007AFF" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="1"/>`;

        const startNode = path[0];
        const endNode = path.at(-1)!;
        const markers = `<circle cx="${startNode.data?.x}" cy="${startNode.data?.y}" r="12" fill="#34C759" stroke="#fff" stroke-width="3"/><circle cx="${endNode.data?.x}" cy="${endNode.data?.y}" r="12" fill="#FF3B30" stroke="#fff" stroke-width="3"/>`;

        const result = highlighted.replace('</svg>', `${pathSvg}${markers}</svg>`);
        return result;
    }, [rawSvgContent, path, startRoom, nextRoom]);

    if (!rawSvgContent || !svgWithPaths) return null;

    return (
        <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <Text style={styles.title}>{building.id} - Floor {floorLevel}</Text>
                            <Text style={styles.subtitle}>{building.address}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            activeOpacity={0.7}
                            testID="floor-plan-close"
                        >
                            <MaterialCommunityIcons name="close" size={24} color="#912338" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={true}
                        showsHorizontalScrollIndicator={true}
                    >
                        <View style={styles.svgContainer}>
                            <SvgXml
                                xml={svgWithPaths}
                                width={screenWidth - 40}
                                height={screenWidth - 40}
                                onError={(e) => console.log("SVG Error: ", e)}
                            />
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        maxHeight: screenHeight * 0.85,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f1f1f',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    closeButton: {
        backgroundColor: '#F1F3F4',
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    scrollView: {
        flex: 0,
    },
    scrollContent: {
        padding: 20,
        alignItems: 'center',
    },
    svgContainer: {
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        padding: 0,
        minHeight: 300,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
});