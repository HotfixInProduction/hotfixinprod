import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

type Building = {
  id: string;
  address: string;
  departments?: string[];
  services?: string[];
};

type Props = {
  building: Building | null;
  onClose: () => void;
};

export default function BuildingInfo({ building, onClose }: Props) {
  if (!building) return null;
  
  const hasDepartments = (building.departments?.length ?? 0) > 0;
  const hasServices = (building.services?.length ?? 0) > 0;

  return (
    <View style={styles.buildingModal}>
      <View style={styles.modalHeader}>
        <Text style={styles.buildingTitle}>{building.id}</Text>
        {building.address ? <Text style={styles.buildingAddress}>{building.address}</Text> : null}
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
        <Text style={{ fontSize: 18, color: '#5F6368' }}>X</Text>
      </TouchableOpacity>

      {(hasDepartments || hasServices) && (
        <View style={styles.columnWrapper}>
          {hasDepartments && (
            <View style={styles.column}>
              <Text style={styles.columnHeader}>Departments</Text>
              <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator>
                {building.departments!.map((dept, i) => (
                  <Text key={i} style={styles.itemText}>
                    {dept}
                  </Text>
                ))}
              </ScrollView>
            </View>
          )}

          {hasServices && (
            <View style={styles.column}>
              <Text style={styles.columnHeader}>Services</Text>
              <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator>
                {building.services!.map((service, i) => (
                  <Text key={i} style={styles.itemText}>
                    {service}
                  </Text>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  buildingModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  buildingTitle: {
    fontSize: 18,
    fontWeight: '500',
    flexShrink: 1,
  },
  buildingAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    marginBottom: 5,
  },
  modalHeader: {
    marginBottom: 10,
    paddingRight: 40,
    paddingHorizontal: 4,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 10,
    backgroundColor: '#F1F3F4',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxHeight: 130,
    gap: 12,
  },
  column: {
    flex: 1,
    paddingHorizontal: 4,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 8,
    paddingLeft: 10
  },
  columnHeader: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    paddingBottom: 4,
  },
  itemText: {
    fontSize: 13,
    color: '#444',
    paddingVertical: 3,
    lineHeight: 18,
    paddingRight: 6,
  },
});