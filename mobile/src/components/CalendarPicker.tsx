import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { GoogleCalendar } from '../services/googleCalendarService';

interface CalendarPickerModalProps {
  visible: boolean;
  calendars: GoogleCalendar[];
  selectedCalendarIds: string[];
  isLoading: boolean;
  onToggle: (id: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CalendarPickerModal({
  visible,
  calendars,
  selectedCalendarIds,
  isLoading,
  onToggle,
  onConfirm,
  onCancel,
}: CalendarPickerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose Calendars</Text>
            <Text style={styles.subtitle}>Select which calendars to display</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#912338" />
              <Text style={styles.loadingText}>Fetching your calendars...</Text>
            </View>
          ) : (
            <FlatList
              data={calendars}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = selectedCalendarIds.includes(item.id);
                return (
                  <TouchableOpacity
                    style={styles.calendarRow}
                    onPress={() => onToggle(item.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[styles.colorDot, { backgroundColor: item.backgroundColor }]}
                    />
                    <Text style={styles.calendarName} numberOfLines={1}>
                      {item.summary}
                    </Text>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No calendars found.</Text>
              }
            />
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.importButton,
                selectedCalendarIds.length === 0 && styles.importButtonDisabled,
              ]}
              onPress={onConfirm}
              disabled={selectedCalendarIds.length === 0}
            >
              <Text style={styles.importText}>
                Import {selectedCalendarIds.length > 0 ? `(${selectedCalendarIds.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '75%',
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  calendarName: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: '#912338',
    borderColor: '#912338',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  importButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#912338',
    alignItems: 'center',
  },
  importButtonDisabled: {
    backgroundColor: '#C9A0A8',
  },
  importText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
