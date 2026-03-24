import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { OutdoorPOI } from '../data/outdoorPOI';
import { formatDistance } from '../utils/distanceUtils';
import { getPOICategoryIcon, getPOICategoryColor } from '../utils/poiMarkerUtils';

interface POIInfoPanelProps {
  readonly poi: (OutdoorPOI & { distance?: number }) | null;
  readonly onClose: () => void;
  readonly slideAnim: Animated.Value;
  readonly isVisible: boolean;
  readonly onSetAsDestination?: (poi: OutdoorPOI) => void;
  readonly hasUserLocation?: boolean;
}

export default function POIInfoPanel({ 
  poi, 
  onClose, 
  slideAnim, 
  isVisible,
  onSetAsDestination,
  hasUserLocation = false
}: Readonly<POIInfoPanelProps>) {
  if (!poi) return null;

  return (
    <Animated.View
      testID="poi-info-panel"
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.categoryIcon, { backgroundColor: getPOICategoryColor(poi.category) }]}>
            <Text style={styles.emojiIcon}>{getPOICategoryIcon(poi.category)}</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {poi.name}
            </Text>
            <Text style={styles.category}>
              {poi.category.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} testID="poi-close-button">
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {poi.address ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={18} color="#666" />
            <Text style={styles.infoText}>{poi.address}</Text>
          </View>
        ) : null}

        {typeof poi.distance === 'number' ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="near-me" size={18} color="#912338" />
            <Text style={[styles.infoText, { color: '#912338', fontWeight: '600' }]}>
              {formatDistance(poi.distance)} away
            </Text>
          </View>
        ) : null}

        {poi.description ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="info" size={18} color="#666" />
            <Text style={[styles.infoText, { flex: 1 }]}>{poi.description}</Text>
          </View>
        ) : null}

        {poi.hours ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="schedule" size={18} color="#666" />
            <Text style={styles.infoText}>{poi.hours}</Text>
          </View>
        ) : null}

        {poi.phone ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={18} color="#666" />
            <Text style={styles.infoText}>{poi.phone}</Text>
          </View>
        ) : null}

        {onSetAsDestination && hasUserLocation ? (
          <TouchableOpacity
            style={[styles.directionsButton, { backgroundColor: getPOICategoryColor(poi.category) }]}
            onPress={() => onSetAsDestination(poi)}
            activeOpacity={0.85}
            testID="poi-set-destination-button"
          >
            <MaterialIcons name="directions" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.directionsButtonText}>Set as Destination</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 15,
    paddingBottom: 20,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emojiIcon: {
    fontSize: 28,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  directionsButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  directionsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
