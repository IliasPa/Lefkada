import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface AppHeaderProps {
  onAccountPress: () => void;
  onSettingsPress: () => void;
}

export default function AppHeader({ onAccountPress, onSettingsPress }: AppHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
      {/* Left: Account button */}
      <TouchableOpacity
        style={[styles.sideBtn, { backgroundColor: theme.inputBg }]}
        onPress={onAccountPress}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Account"
      >
        <Text style={[styles.sideBtnIcon, { color: theme.iconColor }]}>{'\uD83D\uDC64'}</Text>
      </TouchableOpacity>

      {/* Center: absolutely positioned so it never shifts */}
      <View style={styles.centerAbsolute} pointerEvents="none">
        <Image
          source={require('../../assets/PegasusFlag.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: theme.textPrimary }]}>Lefkada</Text>
      </View>

      {/* Right: Settings button */}
      <TouchableOpacity
        style={[styles.sideBtn, { backgroundColor: theme.inputBg }]}
        onPress={onSettingsPress}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Settings"
      >
        <Text style={[styles.sideBtnIcon, { color: theme.iconColor }]}>{'\u2699\uFE0F'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  centerAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logo: { width: 30, height: 30, borderRadius: 6 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  sideBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideBtnIcon: { fontSize: 18 },
});
