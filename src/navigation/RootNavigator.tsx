import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainNavigator from './MainNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import AccountScreen from '../screens/AccountScreen';
import { useTheme } from '../theme/ThemeContext';

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Account: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={MainNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            headerStyle: { backgroundColor: theme.headerBg },
            headerTintColor: theme.textPrimary,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
        <Stack.Screen
          name="Account"
          component={AccountScreen}
          options={{
            title: 'My Account',
            headerStyle: { backgroundColor: theme.headerBg },
            headerTintColor: theme.textPrimary,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
