import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Platform,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';

export interface Tab {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface TabLayout {
  x: number;
  width: number;
}

interface AnimatedTabBarProps {
  tabs: Tab[];
  activeIndex: number;
  onTabPress: (index: number) => void;
}

function AnimatedTab({
  tab,
  isActive,
  onPress,
  onLayout,
}: {
  tab: Tab;
  isActive: boolean;
  onPress: () => void;
  onLayout: (x: number, width: number) => void;
}) {
  const { theme } = useTheme();
  const colorAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: isActive ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const itemOpacity = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tab}
      activeOpacity={0.75}
      onLayout={(e) => onLayout(e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.tabInner, { opacity: itemOpacity }]}>
        <Ionicons
          name={tab.icon}
          size={17}
          color={isActive ? theme.accent : theme.iconMuted}
        />
        <Text style={[styles.tabLabel, { color: isActive ? theme.textPrimary : theme.textTertiary, fontWeight: isActive ? '700' : '500' }]}>
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function AnimatedTabBar({ tabs, activeIndex, onTabPress }: AnimatedTabBarProps) {
  const { theme } = useTheme();
  const highlightX = useRef(new Animated.Value(0)).current;
  const highlightW = useRef(new Animated.Value(0)).current;
  const highlightOpacity = useRef(new Animated.Value(0)).current;
  const layouts = useRef<(TabLayout | null)[]>(tabs.map(() => null)).current;
  const initialized = useRef(false);

  const animateHighlight = (index: number) => {
    const layout = layouts[index];
    if (!layout) return;
    Animated.parallel([
      Animated.spring(highlightX, { toValue: layout.x + 4, tension: 85, friction: 10, useNativeDriver: false }),
      Animated.spring(highlightW, { toValue: layout.width - 8, tension: 85, friction: 10, useNativeDriver: false }),
      Animated.timing(highlightOpacity, { toValue: 1, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  const handleLayout = (index: number, x: number, width: number) => {
    layouts[index] = { x, width };
    if (index === activeIndex) {
      if (!initialized.current) {
        initialized.current = true;
        highlightX.setValue(x + 4);
        highlightW.setValue(width - 8);
        highlightOpacity.setValue(1);
      } else {
        animateHighlight(activeIndex);
      }
    }
  };

  useEffect(() => {
    animateHighlight(activeIndex);
  }, [activeIndex]);

  return (
    <View style={[styles.container, { backgroundColor: theme.tabBarBg, borderBottomColor: theme.tabBarBorder }]}>
      {/* Sliding glass highlight pill — NO underline */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.highlight,
          {
            left: highlightX,
            width: highlightW,
            opacity: highlightOpacity,
            backgroundColor: theme.tabHighlight,
            borderColor: theme.tabHighlightBorder,
          },
        ]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
        ) : null}
      </Animated.View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
      >
        {tabs.map((tab, index) => (
          <AnimatedTab
            key={tab.key}
            tab={tab}
            isActive={index === activeIndex}
            onPress={() => onTabPress(index)}
            onLayout={(x, width) => handleLayout(index, x, width)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    position: 'relative',
  },
  scrollContent: { paddingHorizontal: 8 },
  highlight: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabLabel: { fontSize: 13 },
});
