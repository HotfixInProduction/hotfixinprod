import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  isLoading: boolean;
  error: string | null;
  onConnect: () => void;
}

export default function CalendarConnectButton({ isLoading, error, onConnect }: Readonly<Props>) {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={onConnect}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <MaterialIcons name="event" size={20} color="#fff" />
            <Text style={styles.buttonText}>Connect Google Calendar</Text>
          </>
        )}
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#912338',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#E94B3C',
    textAlign: 'center',
  },
});

