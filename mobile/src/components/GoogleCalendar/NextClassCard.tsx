import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ClassEvent } from '../../types/calendar';

interface Props {
  nextClass: ClassEvent;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getTimeUntilClass(start: Date): string {
  const diff = start.getTime() - Date.now();
  const mins = Math.floor(diff / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
}

export default function NextClassCard({ nextClass }: Readonly<Props>) {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.label}>NEXT CLASS</Text>
          <Text style={styles.title} numberOfLines={1}>{nextClass.title}</Text>
          <Text style={styles.meta}>
            {nextClass.building} {nextClass.room}
            {' \u00b7 '}
            {formatTime(nextClass.startTime)}
            {' \u00b7 '}
            <Text style={styles.countdown}>{getTimeUntilClass(nextClass.startTime)}</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.directionsBtn}>
          <MaterialIcons name="directions" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: 10,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: '#912338',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginTop: 1,
  },
  meta: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  countdown: {
    color: '#912338',
    fontWeight: '600',
  },
  directionsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#912338',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
