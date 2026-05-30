import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Theme } from '../theme';
import MayorMessageForm from '../components/MayorMessageForm';

// ─── Small helpers ───────────────────────────────────────────────────────────
function SectionHeader({ title, theme }: { title: string; theme: Theme }) {
  return <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>{title}</Text>;
}

function Card({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  return <View style={[styles.card, { backgroundColor: theme.surface }]}>{children}</View>;
}

function Sep({ theme }: { theme: Theme }) {
  return <View style={[styles.sep, { backgroundColor: theme.separator }]} />;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { theme, isDark, setDark } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [breakingNewsAlerts, setBreakingNewsAlerts] = useState(true);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const ToggleRow = ({
    label, description, value, onChange,
  }: {
    label: string; description: string; value: boolean; onChange: (v: boolean) => void;
  }) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>{label}</Text>
        <Text style={[styles.toggleDesc, { color: theme.textTertiary }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.border, true: theme.buttonBg }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* ── Notifications ── */}
      <SectionHeader title="Notifications" theme={theme} />
      <Card theme={theme}>
        <ToggleRow
          label="Push Notifications"
          description="Receive alerts for new content"
          value={notificationsEnabled}
          onChange={setNotificationsEnabled}
        />
        <Sep theme={theme} />
        <ToggleRow
          label="Breaking News Alerts"
          description="Be the first to know critical updates"
          value={breakingNewsAlerts}
          onChange={setBreakingNewsAlerts}
        />
        <Sep theme={theme} />
        <ToggleRow
          label="Newsletter"
          description="Weekly digest of Lefkada news"
          value={newsletterSubscribed}
          onChange={setNewsletterSubscribed}
        />
      </Card>

      {/* ── Appearance ── */}
      <SectionHeader title="Appearance" theme={theme} />
      <Card theme={theme}>
        <ToggleRow
          label="Dark Mode"
          description="Switch to dark color scheme"
          value={isDark}
          onChange={setDark}
        />
      </Card>

      {/* ── About ── */}
      <SectionHeader title="About" theme={theme} />
      <Card theme={theme}>
        {([
          ['App Name', 'Lefkada'],
          ['Version', '1.0.0'],
          ['Region', 'Lefkada, Ionian Islands, Greece'],
          ['Contact', 'info@lefkada.gr'],
          ['Built with', 'React Native + Expo'],
        ] as [string, string][]).map(([label, value], i, arr) => (
          <View key={label}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{value}</Text>
            </View>
            {i < arr.length - 1 && <Sep theme={theme} />}
          </View>
        ))}
      </Card>

      {/* ── Message to the Mayor ── */}
      <SectionHeader title="Message to the Mayor" theme={theme} />
      <MayorMessageForm theme={theme} />

      <Text style={[styles.footer, { color: theme.textTertiary }]}>
        {'\u00A9'} 2026 Lefkada App. All rights reserved.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 8, marginLeft: 4, marginTop: 8,
  },
  card: {
    borderRadius: 14, overflow: 'hidden', marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  sep: { height: 1, marginHorizontal: 16 },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
  },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  toggleDesc: { fontSize: 13 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
  },
  infoLabel: { fontSize: 15 },
  infoValue: { fontSize: 15, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 8, marginBottom: 24 },
});
