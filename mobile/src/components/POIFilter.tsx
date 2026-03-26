import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { POI_CATEGORIES } from '../data/outdoorPOI';
import type { OutdoorPOI } from '../data/outdoorPOI';

interface POIFilterProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly selectedFilters: Set<OutdoorPOI['category']>;
  readonly onFilterChange: (filters: Set<OutdoorPOI['category']>) => void;
}

export default function POIFilter({ visible, onClose, selectedFilters, onFilterChange }: Readonly<POIFilterProps>) {
  const toggleFilter = (category: OutdoorPOI['category']) => {
    const newFilters = new Set(selectedFilters);
    if (newFilters.has(category)) {
      newFilters.delete(category);
    } else {
      newFilters.add(category);
    }
    onFilterChange(newFilters);
  };

  const selectAll = () => {
    const allCategories = React.useMemo(
      () => new Set(POI_CATEGORIES.map(cat => cat.key as OutdoorPOI['category'])),
      []
    );
    onFilterChange(allCategories);
  };

  const clearAll = () => {
    onFilterChange(new Set());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      testID="poi-filter-modal"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter POI</Text>
            <TouchableOpacity onPress={onClose} testID="poi-filter-close">
              <MaterialIcons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.selectAllButton]}
              onPress={selectAll}
              testID="poi-select-all"
            >
              <Text style={styles.buttonText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={clearAll}
              testID="poi-clear-all"
            >
              <Text style={[styles.buttonText, { color: '#912338' }]}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterList} testID="poi-filter-list">
            {POI_CATEGORIES.map((category) => {
              const isSelected = selectedFilters.has(category.key as OutdoorPOI['category']);
              return (
                <TouchableOpacity
                  key={category.key}
                  style={[styles.filterItem, isSelected && styles.filterItemSelected]}
                  onPress={() => toggleFilter(category.key as OutdoorPOI['category'])}
                  testID={`poi-filter-${category.key}`}
                >
                  <MaterialIcons
                    name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                    size={24}
                    color={isSelected ? '#912338' : '#ccc'}
                  />
                  <MaterialIcons name={category.icon as any} size={20} color="#666" style={styles.categoryIconSmall} />
                  <Text style={[styles.filterLabel, isSelected && styles.filterLabelActive]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.button, styles.applyButton]}
            onPress={onClose}
            testID="poi-apply-filter"
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectAllButton: {
    backgroundColor: '#912338',
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#912338',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  filterList: {
    marginBottom: 16,
    maxHeight: 300,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterItemSelected: {
    backgroundColor: '#f5f5f5',
  },
  categoryIconSmall: {
    marginLeft: 12,
  },
  filterLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  filterLabelActive: {
    color: '#912338',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#912338',
    paddingVertical: 12,
    marginBottom: 16,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
