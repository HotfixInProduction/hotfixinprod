import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import { useNextClass } from '../hooks/useNextClass';
import {
  useWeekGrid,
  START_HOUR,
  END_HOUR,
  TOTAL_HOURS,
  TIME_COL_WIDTH,
  WEEK_DAY_INDICES,
} from '../hooks/useWeekGrid';

import CalendarConnectButton from '../components/GoogleCalendar/CalendarConnectButton';
import ConnectedUserBar from '../components/GoogleCalendar/ConnectedUserBar';
import CalendarPicker from '../components/GoogleCalendar/CalendarPicker';
import NextClassCard from '../components/GoogleCalendar/NextClassCard';
import WeekDayHeader from '../components/GoogleCalendar/WeekDayHeader';
import TimeColumn from '../components/GoogleCalendar/TimeColumn';
import DayColumn from '../components/GoogleCalendar/DayColumn';
import type { NextClassRouteParam } from '../types/calendar';

const ScheduleScreen: React.FC = () => {
  // Compute once per mount so fake timers in tests control the dates.
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const { state, connect, disconnect, selectCalendar } = useGoogleCalendar();
  const { hourHeight, dayColWidth, setGridHeight, getMondayOfWeek, getEventStyle } = useWeekGrid();

  const displayClasses = state.isAuthenticated ? state.events : [];
  const nextClass = useNextClass(displayClasses, currentTime);
  const monday = getMondayOfWeek(viewDate);

  const navigation = useNavigation<any>();

  const handleNextWeek = () => {
    const next = new Date(viewDate);
    next.setDate(next.getDate() + 7);
    setViewDate(next);
  };

  const handlePrevWeek = () => {
    const prev = new Date(viewDate);
    prev.setDate(prev.getDate() - 7);
    setViewDate(prev);
  };

  const handleToday = () => {
    setViewDate(new Date());
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
  const nowTop = hourHeight > 0 ? ((nowMins - START_HOUR * 60) / 60) * hourHeight : -1;
  const showNowLine = nowMins > START_HOUR * 60 && nowMins < END_HOUR * 60;

  const isToday = (dayIndex: number): boolean => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + (dayIndex - 1));
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {state.isAuthenticated && state.user ? (
        <>
          <ConnectedUserBar user={state.user} onDisconnect={disconnect} />
          <View style={styles.topRow}>
            <CalendarPicker
              calendars={state.calendars}
              selectedCalendarId={state.selectedCalendarId}
              onSelect={selectCalendar}
              isLoading={state.isLoading}
            />
            <TouchableOpacity onPress={handleToday} style={styles.todayButton}>
              <MaterialIcons name="calendar-today" size={20} color="#800000" />
              <Text style={styles.todayText}>Today</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <CalendarConnectButton
          isLoading={state.isLoading}
          error={state.error}
          onConnect={connect}
        />
      )}

      {nextClass && (
        <NextClassCard
          nextClass={nextClass}
          onDirectionsPress={(selectedClass) => {
            const nextClassParam: NextClassRouteParam = {
              id: selectedClass.id,
              title: selectedClass.title,
              location: selectedClass.location,
              building: selectedClass.building,
              room: selectedClass.room,
              startTime: selectedClass.startTime.toISOString(),
              endTime: selectedClass.endTime.toISOString(),
              dayOfWeek: selectedClass.dayOfWeek,
              color: selectedClass.color,
            };

            navigation.navigate('Map', {
              nextClass: nextClassParam,
              startFromCurrentLocation: true,
            });
          }}
        />
      )}
      <View style={styles.gridWrapper}>
        <WeekDayHeader
          timeColWidth={TIME_COL_WIDTH}
          dayColWidth={dayColWidth}
          monday={monday}
          onPrev={handlePrevWeek}
          onNext={handleNextWeek}
        />
        <View
          style={styles.timeGrid}
          onLayout={(e) => setGridHeight(e.nativeEvent.layout.height)}
        >
          <TimeColumn
            width={TIME_COL_WIDTH}
            startHour={START_HOUR}
            totalHours={TOTAL_HOURS}
            hourHeight={hourHeight}
          />
          {WEEK_DAY_INDICES.map((dayIdx) => {
            const dayDate = new Date(monday);
            dayDate.setDate(monday.getDate() + (dayIdx - 1));

            return (
              <DayColumn
                key={dayIdx}
                width={dayColWidth}
                hourHeight={hourHeight}
                totalHours={TOTAL_HOURS}
                events={displayClasses.filter(cls =>
                  cls.startTime.getDate() === dayDate.getDate() &&
                  cls.startTime.getMonth() === dayDate.getMonth() &&
                  cls.startTime.getFullYear() === dayDate.getFullYear()
                )}
                isToday={isToday(dayIdx)}
                showNowLine={showNowLine &&
                  currentTime.getDate() === dayDate.getDate() &&
                  currentTime.getMonth() === dayDate.getMonth() &&
                  currentTime.getFullYear() === dayDate.getFullYear()
                }
                nowTop={nowTop}
                getEventStyle={getEventStyle}
              />
            );
          })}
          <View style={{ width: TIME_COL_WIDTH }} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gridWrapper: {
    flex: 1,
  },
  timeGrid: {
    flex: 1,
    flexDirection: 'row',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  todayText: {
    color: '#800000',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
});

export default ScheduleScreen;