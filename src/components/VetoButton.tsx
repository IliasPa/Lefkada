import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
} from 'react-native';

interface Props {
  isActive: boolean;
  onPress: () => void;
}

const DEPTH = 6;

export default function VetoButton({ isActive, onPress }: Props) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(0)).current;

  const translateY = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, DEPTH] });
  const depthHeight = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [DEPTH, 0] });
  const scale = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });

  const pressIn = () => {
    Animated.spring(pressAnim, { toValue: 1, tension: 300, friction: 10, useNativeDriver: false }).start();
  };

  const pressOut = () => {
    Animated.spring(pressAnim, { toValue: 0, tension: 200, friction: 8, useNativeDriver: false }).start();
  };

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4,   duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 45, useNativeDriver: true }),
    ]).start(() => onPress());
  };

  const topBg   = isActive ? '#1B5E20' : '#B71C1C';
  const botBg   = isActive ? '#0A2E0F' : '#7B0000';
  const border  = isActive ? 'rgba(80,200,80,0.45)' : 'rgba(255,100,100,0.45)';
  const shadow  = isActive ? '#1B5E20' : '#B71C1C';

  return (
    <View style={styles.wrapper}>
      {/* Status banner */}
      <View style={[styles.warningRow, isActive && styles.activeRow]}>
        <Text style={styles.warningIcon}>{isActive ? '✅' : '⚠️'}</Text>
        <Text style={[styles.warningText, isActive && styles.activeText]}>
          {isActive
            ? 'VETO is ACTIVE — tap to cancel and withdraw your protest'
            : 'This action is publicly recorded. Tap again to cancel.'}
        </Text>
      </View>

      {/* 3-D button */}
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <TouchableWithoutFeedback
          onPressIn={pressIn}
          onPressOut={pressOut}
          onPress={handlePress}
          accessibilityLabel={isActive ? 'Cancel VETO' : 'VETO button'}
          accessibilityRole="button"
        >
          <View style={styles.buttonGroup}>
            <Animated.View
              style={[
                styles.topFace,
                { backgroundColor: topBg, borderColor: border, shadowColor: shadow,
                  transform: [{ translateY }, { scale }] },
              ]}
            >
              <Text style={styles.sirenEmoji}>{isActive ? '🟢' : '🚨'}</Text>
              <Text style={styles.label}>{isActive ? 'CANCEL' : 'VETO'}</Text>
              <Text style={styles.sirenEmoji}>{isActive ? '🟢' : '🚨'}</Text>
            </Animated.View>
            <Animated.View style={[styles.bottomFace, { backgroundColor: botBg, height: depthHeight }]} />
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>

      <Text style={styles.note}>
        {isActive ? 'Your VETO is registered. Press CANCEL to withdraw.' : 'Pressing VETO triggers an official protest action.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  warningRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20,
    backgroundColor: 'rgba(200, 0, 0, 0.10)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1,
    borderColor: 'rgba(200, 0, 0, 0.25)',
  },
  activeRow: {
    backgroundColor: 'rgba(0, 160, 0, 0.10)',
    borderColor: 'rgba(0, 160, 0, 0.30)',
  },
  warningIcon: { fontSize: 16 },
  warningText: { fontSize: 12, color: '#CC0000', fontWeight: '600', flex: 1, lineHeight: 17 },
  activeText: { color: '#1B6B1B' },
  buttonGroup: { alignItems: 'center' },
  topFace: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 44, paddingVertical: 18, borderRadius: 14,
    borderWidth: 1.5, shadowOpacity: 0.6, shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 }, elevation: 12, zIndex: 2,
  },
  bottomFace: {
    width: '100%', borderBottomLeftRadius: 14, borderBottomRightRadius: 14,
    marginTop: -14, zIndex: 1,
  },
  sirenEmoji: { fontSize: 24 },
  label: {
    color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 5,
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3,
  },
  note: { fontSize: 11, color: '#999999', marginTop: 16, textAlign: 'center', fontStyle: 'italic' },
});
