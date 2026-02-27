import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import ScheduleScreen from './src/screens/ScheduleScreen';
import MapScreen from './src/screens/MapScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
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
        <Tab.Screen name="Schedule" component={ScheduleScreen} />
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
