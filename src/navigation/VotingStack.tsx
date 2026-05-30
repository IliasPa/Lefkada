import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VotingScreen from '../screens/VotingScreen';
import VotingExplanationScreen from '../screens/VotingExplanationScreen';

export type VotingStackParamList = {
  VotingMain: undefined;
  VotingExplanation: undefined;
};

const Stack = createNativeStackNavigator<VotingStackParamList>();

export default function VotingStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="VotingMain"
        component={VotingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VotingExplanation"
        component={VotingExplanationScreen}
        options={{
          title: 'Voting Information',
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
    </Stack.Navigator>
  );
}
