import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WEEK_DAY_INDICES, DAY_HEADER_HEIGHT, TIME_COL_WIDTH } from '../../hooks/useWeekGrid';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

interface Props {
  timeColWidth: number;
  dayColWidth: number;
  monday: Date;
  onPrev: () => void;
  onNext: () => void;
}

function getDayDate(monday: Date, dayIndex: number): string {
  const d = new Date(monday);
  d.setDate(monday.getDate() + (dayIndex - 1));
  return String(d.getDate());
}

function isToday(monday: Date, dayIndex: number): boolean {
  const d = new Date(monday);
  d.setDate(monday.getDate() + (dayIndex - 1));
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export default function WeekDayHeader({ timeColWidth, dayColWidth, monday, onPrev, onNext }: Readonly<Props>) {
  return (
    <View style={[styles.row, { height: DAY_HEADER_HEIGHT }]}>
      <TouchableOpacity onPress={onPrev} style={[styles.arrowButton, { width: timeColWidth }]}>
        <MaterialIcons name="chevron-left" size={24} color="#912338" />
      </TouchableOpacity>

      {WEEK_DAY_INDICES.map((dayIdx, i) => {
        const today = isToday(monday, dayIdx);
        return (
          <View key={dayIdx} style={[styles.cell, { width: dayColWidth }]}>
            <Text style={[styles.dayName, today && styles.todayText]}>
              {WEEK_DAYS[i]}
            </Text>
            <View style={[styles.dateCircle, today && styles.todayCircle]}>
              <Text style={[styles.dateNumber, today && styles.todayDateText]}>
                {getDayDate(monday, dayIdx)}
              </Text>
            </View>
          </View>
        );
      })}

      <TouchableOpacity onPress={onNext} style={[styles.arrowButton, { width: TIME_COL_WIDTH }]}>
        <MaterialIcons name="chevron-right" size={24} color="#912338" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayText: { color: '#912338' },
  dateCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  todayCircle: { backgroundColor: '#912338' },
  dateNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  todayDateText: { color: '#fff' },
  arrowButton: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
