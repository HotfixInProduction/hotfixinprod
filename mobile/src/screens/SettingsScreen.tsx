import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useAppSettings } from '../hooks/useAppSettings';

export default function SettingsScreen() {
  const { settings, isLoading, updateSettings } = useAppSettings();

  if (isLoading || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#912338" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* POI Range Setting */}
        <View style={styles.settingSection}>
          <Text style={styles.settingTitle}>POI Detection Range</Text>
          <Text style={styles.settingDescription}>
            Maximum distance to detect nearby points of interest
          </Text>
          
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={100}
              maximumValue={2000}
              step={50}
              value={settings.poiRangeMeters}
              onValueChange={(value) => {
                updateSettings({ poiRangeMeters: Math.round(value) });
              }}
              minimumTrackTintColor="#912338"
              maximumTrackTintColor="#ddd"
            />
          </View>

          <View style={styles.rangeDisplayContainer}>
            <Text style={styles.rangeLabel}>Range:</Text>
            <Text style={styles.rangeValue}>{Math.round(settings.poiRangeMeters)} meters</Text>
          </View>
        </View>

        {/* Show Nearest POI Banner Setting */}
        <View style={styles.settingSection}>
          <View style={styles.toggleContainer}>
            <View style={styles.toggleLabelContainer}>
              <Text style={styles.settingTitle}>Show Nearest POI</Text>
              <Text style={styles.settingDescription}>
                Display banner when POIs are nearby
              </Text>
            </View>
            <Switch
              value={settings.showNearestPOIBanner}
              onValueChange={(value) => {
                updateSettings({ showNearestPOIBanner: value });
              }}
              trackColor={{ false: '#d0d0d0', true: '#912338' }}
              thumbColor={settings.showNearestPOIBanner ? '#fff' : '#f0f0f0'}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 24,
    marginTop: 8,
  },
  settingSection: {
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f1f1f',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  sliderContainer: {
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  rangeLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  rangeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#912338',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
