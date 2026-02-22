import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  width: number;
  startHour: number;
  totalHours: number;
  hourHeight: number;
}

export default function TimeColumn({ width, startHour, totalHours, hourHeight }: Props) {
  return (
    <View style={[styles.col, { width }]}>
      {Array.from({ length: totalHours }).map((_, i) => {
        const hour = startHour + i;
        const displayHour = ((hour + 11) % 12) + 1;
        const period = hour >= 12 ? 'PM' : 'AM';
        const label = `${displayHour}:00 ${period}`;
        return (
          <View key={i} style={[styles.label, { height: hourHeight }]}>
            <Text style={styles.text}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  col: {
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  label: {
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  text: {
    fontSize: 10,
    color: '#aaa',
  },
});
