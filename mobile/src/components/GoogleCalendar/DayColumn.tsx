import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ClassEvent } from '../../types/calendar';
import EventBlock from './EventBlock';

interface Props {
  width: number;
  hourHeight: number;
  totalHours: number;
  events: ClassEvent[];
  isToday: boolean;
  showNowLine: boolean;
  nowTop: number;
  getEventStyle: (cls: ClassEvent) => { top: number; height: number };
}

export default function DayColumn({
  width,
  hourHeight,
  totalHours,
  events,
  isToday,
  showNowLine,
  nowTop,
  getEventStyle,
}: Readonly<Props>) {
  return (
    <View style={[styles.col, { width }, isToday && styles.todayCol]}>
      {Array.from({ length: totalHours + 1 }, (_, j) => j).map((hourOffset) => (
        <View key={`grid-${hourOffset}`} style={[styles.gridLine, { top: hourOffset * hourHeight }]} />
      ))}

      {showNowLine && isToday && (
        <View style={[styles.nowLine, { top: nowTop }]}>
          <View style={styles.nowDot} />
          <View style={styles.nowLineBar} />
        </View>
      )}

      {events.map(cls => {
        const { top, height } = getEventStyle(cls);
        return (
          <EventBlock key={cls.id} cls={cls} top={top} height={height} hourHeight={hourHeight} />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  col: {
    flex: 1,
    position: 'relative',
    borderLeftWidth: 1,
    borderLeftColor: '#f0f0f0',
  },
  todayCol: { backgroundColor: '#fefafa' },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  nowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#912338',
  },
  nowLineBar: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#912338',
  },
});
