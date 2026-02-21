import React, { useState, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

interface ClassEvent {
  id: string;
  title: string;
  location: string;
  building: string;
  room: string;
  startTime: Date;
  endTime: Date;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
  color: string;
}

// Helper function to create a date for this week
const getDateForDay = (dayOfWeek: number, hour: number, minute: number): Date => {
  const now = new Date();
  const currentDay = now.getDay();
  const diff = dayOfWeek - currentDay;
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + diff);
  targetDate.setHours(hour, minute, 0, 0);
  return targetDate;
};

// Sample class data (will be replaced with Google Calendar integration)
const sampleClasses: ClassEvent[] = [
  // Monday classes
  {
    id: '1',
    title: 'SOEN 357 - UI/UX Design',
    location: 'Hall Building',
    building: 'H',
    room: '920',
    startTime: getDateForDay(1, 8, 45),
    endTime: getDateForDay(1, 10, 0),
    dayOfWeek: 1,
    color: '#4A90E2',
  },
  {
    id: '2',
    title: 'COMP 352 - Data Structures',
    location: 'EV Building',
    building: 'EV',
    room: '2.260',
    startTime: getDateForDay(1, 13, 15),
    endTime: getDateForDay(1, 14, 30),
    dayOfWeek: 1,
    color: '#E94B3C',
  },
  // Tuesday classes
  {
    id: '3',
    title: 'SOEN 341 - Software Process',
    location: 'Hall Building',
    building: 'H',
    room: '763',
    startTime: getDateForDay(2, 10, 15),
    endTime: getDateForDay(2, 11, 30),
    dayOfWeek: 2,
    color: '#50C878',
  },
  {
    id: '4',
    title: 'ENGR 301 - Engineering Mgmt',
    location: 'EV Building',
    building: 'EV',
    room: '1.162',
    startTime: getDateForDay(2, 14, 45),
    endTime: getDateForDay(2, 16, 0),
    dayOfWeek: 2,
    color: '#F39C12',
  },
  // Wednesday classes
  {
    id: '5',
    title: 'SOEN 357 - UI/UX Design',
    location: 'Hall Building',
    building: 'H',
    room: '920',
    startTime: getDateForDay(3, 8, 45),
    endTime: getDateForDay(3, 10, 0),
    dayOfWeek: 3,
    color: '#4A90E2',
  },
  {
    id: '6',
    title: 'COMP 352 - Data Structures',
    location: 'EV Building',
    building: 'EV',
    room: '2.260',
    startTime: getDateForDay(3, 13, 15),
    endTime: getDateForDay(3, 14, 30),
    dayOfWeek: 3,
    color: '#E94B3C',
  },
  // Thursday classes
  {
    id: '7',
    title: 'SOEN 341 - Software Process',
    location: 'Hall Building',
    building: 'H',
    room: '763',
    startTime: getDateForDay(4, 10, 15),
    endTime: getDateForDay(4, 11, 30),
    dayOfWeek: 4,
    color: '#50C878',
  },
  {
    id: '8',
    title: 'COMP 346 - Operating Systems',
    location: 'Hall Building',
    building: 'H',
    room: '817',
    startTime: getDateForDay(4, 17, 45),
    endTime: getDateForDay(4, 19, 0),
    dayOfWeek: 4,
    color: '#9B59B6',
  },
  // Friday classes
  {
    id: '9',
    title: 'ENGR 301 - Engineering Mgmt',
    location: 'EV Building',
    building: 'EV',
    room: '1.162',
    startTime: getDateForDay(5, 11, 45),
    endTime: getDateForDay(5, 13, 0),
    dayOfWeek: 5,
    color: '#F39C12',
  },
];

const { width } = Dimensions.get('window');
const HOUR_HEIGHT = 60;
const START_HOUR = 7;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ScheduleScreen: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextClass, setNextClass] = useState<ClassEvent | null>(null);

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Find the next upcoming class
    const now = new Date();
    const upcomingClasses = sampleClasses
      .filter((cls) => cls.startTime > now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    if (upcomingClasses.length > 0) {
      setNextClass(upcomingClasses[0]);
    } else {
      setNextClass(null);
    }
  }, [currentTime]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTimeUntilClass = (classStartTime: Date): string => {
    const now = new Date();
    const diff = classStartTime.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `in ${hours}h ${remainingMinutes}m`;
    }
    return `in ${remainingMinutes}m`;
  };

  const getClassPosition = (cls: ClassEvent): { top: number; height: number } => {
    const startMinutes =
      cls.startTime.getHours() * 60 + cls.startTime.getMinutes();
    const endMinutes = cls.endTime.getHours() * 60 + cls.endTime.getMinutes();
    const startOffset = startMinutes - START_HOUR * 60;
    const duration = endMinutes - startMinutes;

    return {
      top: (startOffset / 60) * HOUR_HEIGHT,
      height: (duration / 60) * HOUR_HEIGHT,
    };
  };

  const renderTimeColumn = (): React.ReactElement => {
    const hours = [];
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const period = hour >= 12 ? 'PM' : 'AM';
      hours.push(
        <View key={hour} style={styles.timeSlot}>
          <Text style={styles.timeText}>
            {displayHour}:00 {period}
          </Text>
        </View>
      );
    }
    return <View style={styles.timeColumn}>{hours}</View>;
  };

  const renderDayColumn = (dayIndex: number): React.ReactElement => {
    const dayClasses = sampleClasses.filter(
      (cls) => cls.dayOfWeek === dayIndex
    );

    return (
      <View key={dayIndex} style={styles.dayColumn}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderText}>{DAYS[dayIndex]}</Text>
        </View>
        <View style={styles.dayContent}>
          {/* Grid lines */}
          {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => (
            <View
              key={i}
              style={[styles.gridLine, { top: i * HOUR_HEIGHT }]}
            />
          ))}
          {/* Classes */}
          {dayClasses.map((cls) => {
            const { top, height } = getClassPosition(cls);
            return (
              <TouchableOpacity
                key={cls.id}
                style={[
                  styles.classBlock,
                  {
                    top,
                    height,
                    backgroundColor: cls.color,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.classTitle} numberOfLines={2}>
                  {cls.title}
                </Text>
                <Text style={styles.classLocation} numberOfLines={1}>
                  {cls.building} {cls.room}
                </Text>
                <Text style={styles.classTime}>
                  {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Next Class Card */}
      {nextClass && (
        <View style={styles.nextClassCard}>
          <View style={styles.cardContent}>
            <View style={styles.classInfo}>
              <Text style={styles.nextClassLabel}>NEXT CLASS</Text>
              <Text style={styles.nextClassTitle}>{nextClass.title}</Text>
              <Text style={styles.nextClassLocation}>
                {nextClass.location} - Room {nextClass.room}
              </Text>
              <View style={styles.timeRow}>
                <Text style={styles.nextClassTimeRange}>
                  {formatTime(nextClass.startTime)} - {formatTime(nextClass.endTime)}
                </Text>
                <Text style={styles.nextClassTime}>
                  {getTimeUntilClass(nextClass.startTime)}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.directionsButton}>
              <MaterialIcons name="directions" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Weekly Calendar */}
      <ScrollView
        style={styles.calendarContainer}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.calendarContent}>
            {renderTimeColumn()}
            <View style={styles.daysContainer}>
              {[1, 2, 3, 4, 5].map((day) => renderDayColumn(day))}
            </View>
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  nextClassCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 30,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classInfo: {
    flex: 1,
    marginRight: 12,
  },
  nextClassLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#912338',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  nextClassTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 3,
  },
  nextClassLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextClassTimeRange: {
    fontSize: 12,
    color: '#666',
  },
  nextClassTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#912338',
  },
  directionsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#912338',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonArrow: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  calendarContainer: {
    flex: 1,
  },
  calendarContent: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: 70,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  timeSlot: {
    height: HOUR_HEIGHT,
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  daysScrollView: {
    flex: 1,
  },
  daysContainer: {
    flexDirection: 'row',
    minHeight: TOTAL_HOURS * HOUR_HEIGHT,
  },
  dayColumn: {
    width: (width - 70) / 3.5,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  dayHeader: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dayContent: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  classBlock: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderRadius: 6,
    padding: 6,
    overflow: 'hidden',
  },
  classTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  classLocation: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 2,
  },
  classTime: {
    fontSize: 9,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});

export default ScheduleScreen;