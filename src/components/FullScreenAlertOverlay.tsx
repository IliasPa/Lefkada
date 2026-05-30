import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: W } = Dimensions.get('window');
const ANIMATION_DURATION = 2000; // 2 seconds total visible time

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function FullScreenAlertOverlay({ visible, onDismiss }: Props) {
  const bgOpacity      = useRef(new Animated.Value(0)).current;
  const contentScale   = useRef(new Animated.Value(0.6)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim      = useRef(new Animated.Value(1)).current;
  const pulseLoop      = useRef<Animated.CompositeAnimation | null>(null);
  const autoTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    pulseLoop.current?.stop();
    if (autoTimer.current) clearTimeout(autoTimer.current);
    Animated.parallel([
      Animated.timing(bgOpacity,      { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  useEffect(() => {
    if (visible) {
      bgOpacity.setValue(0);
      contentScale.setValue(0.6);
      contentOpacity.setValue(0);
      pulseAnim.setValue(1);

      // Flash in
      Animated.parallel([
        Animated.timing(bgOpacity,      { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(contentScale,   { toValue: 1, tension: 90, friction: 6,  useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]).start(() => {
        // Pulse while visible
        pulseLoop.current = Animated.loop(
          Animated.sequence([
            Animated.timing(bgOpacity, { toValue: 0.72, duration: 500, useNativeDriver: true }),
            Animated.timing(bgOpacity, { toValue: 1,    duration: 500, useNativeDriver: true }),
          ]),
        );
        pulseLoop.current.start();
      });

      // Auto-dismiss after 2 seconds
      autoTimer.current = setTimeout(() => dismiss(), ANIMATION_DURATION);
    } else {
      pulseLoop.current?.stop();
      if (autoTimer.current) clearTimeout(autoTimer.current);
    }

    return () => {
      pulseLoop.current?.stop();
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
        <Animated.View
          style={[
            styles.content,
            { opacity: contentOpacity, transform: [{ scale: contentScale }] },
          ]}
        >
          <Text style={styles.sirenIcon}>{'🚨'}</Text>
          <Text style={styles.vetoWord}>VETO</Text>
          <Text style={styles.subtitle}>Action Registered</Text>
          <Text style={styles.body}>
            Your VETO has been submitted.{'\n'}The authorities have been notified.
          </Text>
          <TouchableOpacity style={styles.dismissBtn} onPress={dismiss} activeOpacity={0.8}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(170, 0, 0, 0.93)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    maxWidth: W * 0.85,
  },
  sirenIcon:  { fontSize: 80, marginBottom: 16 },
  vetoWord:   { fontSize: 64, fontWeight: '900', color: '#FFFFFF', letterSpacing: 8, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 6 },
  subtitle:   { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: 6, marginBottom: 24, letterSpacing: 1 },
  body:       { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22, marginBottom: 48 },
  dismissBtn: { backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)', borderRadius: 32, paddingHorizontal: 48, paddingVertical: 14 },
  dismissText:{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});
