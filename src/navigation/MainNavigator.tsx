import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppHeader from '../components/AppHeader';
import AnimatedTabBar from '../components/AnimatedTabBar';
import LatestNewsScreen from '../screens/LatestNewsScreen';
import OldVideosScreen from '../screens/OldVideosScreen';
import VotingStack from './VotingStack';
import HealthScreen from '../screens/HealthScreen';
import OpenPositionsScreen from '../screens/OpenPositionsScreen';
import GameScreen from '../screens/GameScreen';
import FinancialsScreen from '../screens/FinancialsScreen';
import { RootStackParamList } from './RootNavigator';
import { useTheme } from '../theme/ThemeContext';

const TABS = [
  { key: 'news',       label: 'Latest News',    icon: 'newspaper-outline'      as const },
  { key: 'videos',     label: 'Old News',        icon: 'videocam-outline'       as const },
  { key: 'voting',     label: 'Voting',          icon: 'stats-chart-outline'    as const },
  { key: 'health',     label: 'Health',          icon: 'heart-outline'          as const },
  { key: 'jobs',       label: 'Open Positions',  icon: 'briefcase-outline'      as const },
  { key: 'game',       label: 'Game',            icon: 'game-controller-outline' as const },
  { key: 'financials', label: 'Financials',      icon: 'bar-chart-outline'      as const },
];

type RootNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

function TabContent({ activeIndex }: { activeIndex: number }) {
  switch (activeIndex) {
    case 0: return <LatestNewsScreen />;
    case 1: return <OldVideosScreen />;
    case 2: return <VotingStack />;
    case 3: return <HealthScreen />;
    case 4: return <OpenPositionsScreen />;
    case 5: return <GameScreen />;
    case 6: return <FinancialsScreen />;
    default: return <LatestNewsScreen />;
  }
}

export default function MainNavigator() {
  const navigation = useNavigation<RootNavProp>();
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevIndex = useRef(0);

  const handleTabPress = useCallback((index: number) => {
    if (index === activeIndex) return;
    const direction = index > prevIndex.current ? 1 : -1;
    prevIndex.current = index;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 110, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: direction * -40, duration: 110, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 110, useNativeDriver: true }),
    ]).start(() => {
      setActiveIndex(index);
      slideAnim.setValue(direction * 40);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 90, friction: 9, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 90, friction: 9, useNativeDriver: true }),
      ]).start();
    });
  }, [activeIndex, fadeAnim, slideAnim, scaleAnim]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.headerBg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.headerBg} />

      <AppHeader
        onAccountPress={() => navigation.navigate('Account')}
        onSettingsPress={() => navigation.navigate('Settings')}
      />

      <AnimatedTabBar tabs={TABS} activeIndex={activeIndex} onTabPress={handleTabPress} />

      <Animated.View
        style={[
          styles.contentArea,
          {
            backgroundColor: theme.background,
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        <TabContent activeIndex={activeIndex} />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  contentArea: { flex: 1 },
});
