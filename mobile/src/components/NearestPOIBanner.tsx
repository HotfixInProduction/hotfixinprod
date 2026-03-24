import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { OutdoorPOI } from '../data/outdoorPOI';
import { formatDistance } from '../utils/distanceUtils';
import { getPOICategoryIcon, getPOICategoryColor } from '../utils/poiMarkerUtils';

interface NearestPOIBannerProps {
  readonly poi: (OutdoorPOI & { distance: number }) | null;
  readonly onPress: () => void;
}

export default function NearestPOIBanner({ poi, onPress }: Readonly<NearestPOIBannerProps>) {
  if (!poi) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      testID="nearest-poi-banner"
    >
      <View style={[styles.iconContainer, { backgroundColor: getPOICategoryColor(poi.category) }]}>
        <Text style={styles.emojiIcon}>{getPOICategoryIcon(poi.category)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>Nearest POI</Text>
        <Text style={styles.name} numberOfLines={1}>
          {poi.name}
        </Text>
      </View>
      <View style={styles.distanceContainer}>
        <MaterialIcons name="near-me" size={16} color="#912338" />
        <Text style={styles.distance}>{formatDistance(poi.distance)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 110,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  emojiIcon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  distance: {
    fontSize: 12,
    fontWeight: '600',
    color: '#912338',
    marginLeft: 4,
  },
});
