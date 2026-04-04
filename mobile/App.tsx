import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
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
                iconName = 'calendar-today';
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
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '500',
              marginTop: 2,
            },
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
          <Tab.Screen
            name="Schedule"
            component={ScheduleScreen}
            options={{
              tabBarLabel: 'Schedule',
              tabBarButtonTestID: 'tab-schedule',
            }}
          />
          <Tab.Screen
            name="Map"
            component={MapScreen}
            options={{
              tabBarLabel: 'Map',
              tabBarButtonTestID: 'tab-map',
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarLabel: 'Settings',
              tabBarButtonTestID: 'tab-settings',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </AppSettingsProvider>
  );
}