import { useRef, useState } from 'react';
import { Animated } from 'react-native';
import type { OutdoorPOI } from '../data/outdoorPOI';

export const usePOIState = () => {
  const [selectedPOI, setSelectedPOI] = useState<OutdoorPOI | null>(null);
  const [showPOIFilter, setShowPOIFilter] = useState(false);
  const [poiFilters, setPoiFilters] = useState<Set<OutdoorPOI['category']>>(
    new Set(['food', 'cafe', 'restroom', 'parking', 'bike_rack', 'emergency'])
  );
  const [nearestPOI, setNearestPOI] = useState<(OutdoorPOI & { distance: number }) | null>(null);
  const poiInfoSlideAnim = useRef(new Animated.Value(400)).current;

  return {
    selectedPOI,
    setSelectedPOI,
    showPOIFilter,
    setShowPOIFilter,
    poiFilters,
    setPoiFilters,
    nearestPOI,
    setNearestPOI,
    poiInfoSlideAnim,
  };
};
