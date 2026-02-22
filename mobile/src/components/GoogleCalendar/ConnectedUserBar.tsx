import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GoogleUser } from '../../types/calendar';

interface Props {
  user: GoogleUser;
  onDisconnect: () => void;
}

export default function ConnectedUserBar({ user, onDisconnect }: Props) {
  return (
    <View style={styles.bar}>
      {user.picture ? (
        <Image source={{ uri: user.picture }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <MaterialIcons name="person" size={18} color="#fff" />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
        <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
      </View>
      <TouchableOpacity onPress={onDisconnect} style={styles.signOut} activeOpacity={0.7}>
        <MaterialIcons name="logout" size={18} color="#912338" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ccc',
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#912338',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  email: {
    fontSize: 11,
    color: '#888',
  },
  signOut: {
    padding: 4,
  },
});
