import React from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface POIInfoRowProps {
  readonly icon: string;
  readonly value: string;
  readonly iconColor?: string;
  readonly textStyles?: TextStyle;
  readonly showValue: boolean;
}

export default function POIInfoRow({
  icon,
  value,
  iconColor = '#666',
  textStyles,
  showValue,
}: Readonly<POIInfoRowProps>) {
  if (!showValue) return null;

  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon as any} size={18} color={iconColor} />
      <Text style={[styles.infoText, textStyles]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
});
