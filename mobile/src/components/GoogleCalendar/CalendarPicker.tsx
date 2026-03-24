import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GoogleCalendarListEntry } from '../../types/calendar';

interface Props {
  readonly calendars: GoogleCalendarListEntry[];
  readonly selectedCalendarId: string;
  readonly onSelect: (calendarId: string) => void;
  readonly isLoading: boolean;
}

export default function CalendarPicker({ calendars, selectedCalendarId, onSelect, isLoading }: Props) {
  const [visible, setVisible] = useState(false);

  const selected = calendars.find(c => c.id === selectedCalendarId);
  const displayName = selected?.summary ?? 'Primary Calendar';
  const displayColor = selected?.backgroundColor ?? '#912338';

  function handleSelect(calendarId: string) {
    setVisible(false);
    onSelect(calendarId);
  }

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        disabled={isLoading || calendars.length === 0}
        activeOpacity={0.7}
      >
        <View style={[styles.colorDot, { backgroundColor: displayColor }]} />
        <Text style={styles.triggerText} numberOfLines={1}>{displayName}</Text>
        <MaterialIcons name="arrow-drop-down" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable testID="calendar-picker-overlay" style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select Calendar</Text>
            <FlatList
              data={calendars}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedCalendarId;
                return (
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => handleSelect(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.colorDot, { backgroundColor: item.backgroundColor }]} />
                    <Text style={[styles.rowText, isSelected && styles.rowTextSelected]} numberOfLines={1}>
                      {item.summary}
                    </Text>
                    {isSelected && (
                      <MaterialIcons name="check" size={18} color="#912338" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 2,
    gap: 6,
  },
  triggerText: {
    flex: 1,
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
    paddingVertical: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f1f1f',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  rowTextSelected: {
    fontWeight: '700',
    color: '#912338',
  },
});