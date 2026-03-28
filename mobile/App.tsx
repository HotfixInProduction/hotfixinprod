import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { AppSettingsProvider } from './src/context/AppSettingsContext';
import ScheduleScreen from './src/screens/ScheduleScreen';
import MapScreen from './src/screens/MapScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AppSettingsProvider>
      <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any;

            if (route.name === 'Schedule') {
              iconName = 'schedule';
            } else if (route.name === 'Map') {
              iconName = 'map';
            } else if (route.name === 'Settings') {
              iconName = 'settings';
            }

            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#912338',
          tabBarInactiveTintColor: '#666',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e3e3e3',
            height: 70,
            paddingBottom: 8,
            paddingTop: 8,
          },
        })}
      >
        <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ tabBarButton: (props) => <View testID="tab-schedule"><TouchableOpacity {...props as any} /></View> }} />
        <Tab.Screen name="Map" component={MapScreen} options={{ tabBarButton: (props) => <View testID="tab-map"><TouchableOpacity {...props as any} /></View> }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarButton: (props) => <View testID="tab-settings"><TouchableOpacity {...props as any} /></View> }} />
      </Tab.Navigator>
      </NavigationContainer>
    </AppSettingsProvider>
  );
}
