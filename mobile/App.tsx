import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import MapView from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapPadding={{ top: 100, right: 20, bottom: 0, left: 20 }}
        initialRegion={{
          latitude: 45.497,
          longitude: -73.579,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>

      </SafeAreaView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  safeArea: {
    position: 'absolute',
    width: '100%',
    pointerEvents: 'box-none',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    pointerEvents: 'auto',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    pointerEvents: 'auto',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  campusButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  campusButton: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  campusButtonActive: {
    backgroundColor: '#007AFF',
  },
  campusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  campusButtonTextActive: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
