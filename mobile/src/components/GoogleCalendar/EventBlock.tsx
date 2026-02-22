import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ClassEvent } from '../../types/calendar';

interface Props {
  cls: ClassEvent;
  top: number;
  height: number;
  hourHeight: number;
}

export default function EventBlock({ cls, top, height, hourHeight }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.block, { top, height, backgroundColor: cls.color }]}
    >
      <Text style={styles.title} numberOfLines={2}>{cls.title}</Text>
      {height > hourHeight * 0.55 && (
        <Text style={styles.room} numberOfLines={1}>{cls.building} {cls.room}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderRadius: 4,
    padding: 3,
    overflow: 'hidden',
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  room: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
});
