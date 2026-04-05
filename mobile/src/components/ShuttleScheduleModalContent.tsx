import React from 'react';
import { View, TouchableOpacity, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ShuttleData } from '../models/MapRouting';

type ShuttleScheduleTableProps = {
  readonly loyScheduleLabels: string[];
  readonly sgwScheduleLabels: string[];
};

function ShuttleScheduleTable({ loyScheduleLabels, sgwScheduleLabels }: ShuttleScheduleTableProps) {
  if (loyScheduleLabels.length === 0) {
    return (
      <Text style={styles.shuttleServiceResumeText}>
        No service today. Resumes next weekday.
      </Text>
    );
  }

  return (
    <>
      <View style={styles.scheduleTableHeader}>
        <Text style={styles.scheduleTableHeaderCell}>Loyola departures</Text>
        <Text style={styles.scheduleTableHeaderCell}>SGW departures</Text>
      </View>
      <ScrollView style={styles.scheduleTable} contentContainerStyle={styles.scheduleTableContent}>
        {loyScheduleLabels.map((loyTime, idx) => {
          const sgwTime = sgwScheduleLabels[idx] ?? '';
          const rowKey = `${loyTime}-${sgwTime}`;
          const isLast = idx === loyScheduleLabels.length - 1;

          return (
            <View key={rowKey} style={[styles.scheduleTableRow, idx % 2 === 1 && styles.scheduleTableRowAlt]}>
              <Text style={[styles.scheduleTableCell, isLast && styles.scheduleTableCellLast]}>
                {loyTime}{isLast ? ' *' : ''}
              </Text>
              <Text style={[styles.scheduleTableCell, isLast && styles.scheduleTableCellLast]}>
                {sgwTime}{isLast ? ' *' : ''}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <Text style={styles.scheduleLastBusNote}>* Last bus / Dernier départ</Text>
    </>
  );
}

type ShuttleScheduleModalContentProps = {
  readonly shuttleData: ShuttleData;
  readonly onClose: () => void;
};

export default function ShuttleScheduleModalContent({
  shuttleData,
  onClose,
}: Readonly<ShuttleScheduleModalContentProps>) {
  return (
    <View style={styles.shuttleCard}>
      <View style={styles.modalHeader}>
        <MaterialIcons name="airport-shuttle" size={24} color="#912338" />
        <Text style={styles.modalTitle}>Shuttle Schedule</Text>
      </View>

      <Text style={styles.shuttleDirectionText}>{shuttleData.directionLabel}</Text>
      {shuttleData.nextDepartureInMinutes > 60 ? (
        <Text style={styles.shuttleNextText}>No more shuttle departures today</Text>
      ) : (
        <Text style={styles.shuttleNextText}>
          Next shuttle in {shuttleData.nextDepartureInMinutes} min ({shuttleData.nextDepartureTimeLabel})
        </Text>
      )}

      {shuttleData.serviceResumesNextWeekday && (
        <Text style={styles.shuttleServiceResumeText}>
          Service has ended for today. Resumes next weekday at {shuttleData.nextDepartureTimeLabel}.
        </Text>
      )}

      <Text style={styles.shuttleServiceText}>Monday - Thursday only</Text>

      <ShuttleScheduleTable
        loyScheduleLabels={shuttleData.loyScheduleLabels}
        sgwScheduleLabels={shuttleData.sgwScheduleLabels}
      />

      <TouchableOpacity
        style={[styles.modalButton, styles.primaryButton]}
        onPress={onClose}
        testID="close-shuttle-schedule"
      >
        <Text style={styles.primaryButtonText}>Close schedule</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  shuttleCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e3e3e3',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#912338',
    borderColor: '#912338',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  shuttleDirectionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 6,
  },
  shuttleNextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#912338',
    marginBottom: 4,
  },
  shuttleServiceText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
  },
  shuttleServiceResumeText: {
    fontSize: 13,
    color: '#6a3f45',
    marginBottom: 8,
  },
  scheduleTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#912338',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  scheduleTableHeaderCell: {
    flex: 1,
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  scheduleTable: {
    maxHeight: 220,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#f0d9de',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  scheduleTableContent: {
    paddingBottom: 4,
  },
  scheduleTableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  scheduleTableRowAlt: {
    backgroundColor: '#fff9fa',
  },
  scheduleTableCell: {
    flex: 1,
    fontSize: 13,
    color: '#1f1f1f',
    fontWeight: '600',
    textAlign: 'center',
  },
  scheduleTableCellLast: {
    color: '#912338',
  },
  scheduleLastBusNote: {
    fontSize: 11,
    color: '#6a3f45',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
});