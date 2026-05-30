import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { jobsData, JobPosting } from '../data/jobs';
import { useTheme } from '../theme/ThemeContext';
import { Theme } from '../theme';

const typeColors = {
  'Full-time': { bg: 'badgeGreenBg',  text: 'badgeGreenText'  } as const,
  'Part-time': { bg: 'badgeGreenBg',  text: 'badgeGreenText'  } as const,
  'Contract':  { bg: 'badgeOrangeBg', text: 'badgeOrangeText' } as const,
  'Seasonal':  { bg: 'badgeBlueBg',   text: 'badgeBlueText'   } as const,
};

const modeColors = {
  Remote:    { bg: 'badgeGreenBg',  text: 'badgeGreenText'  } as const,
  'On-site': { bg: 'badgeBlueBg',   text: 'badgeBlueText'   } as const,
  Hybrid:    { bg: 'badgeOrangeBg', text: 'badgeOrangeText' } as const,
};

function JobCard({ item }: { item: JobPosting }) {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const typeKey = item.employmentType as keyof typeof typeColors;
  const typeColor = typeColors[typeKey] ?? { bg: 'badgeBlueBg', text: 'badgeBlueText' };
  const typeBg = theme[typeColor.bg];
  const typeTextColor = theme[typeColor.text];

  const modeKey = item.workMode as keyof typeof modeColors;
  const modeColor = modeColors[modeKey] ?? { bg: 'badgeBlueBg', text: 'badgeBlueText' };
  const modeBg = theme[modeColor.bg];
  const modeTextColor = theme[modeColor.text];

  const handleApply = () => {
    Alert.alert(
      'Apply for Position',
      `You are about to apply for:\n\n${item.title}\nat ${item.company}\n\nThis would open the application form.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Apply',
          onPress: () =>
            Alert.alert('Application Sent', 'Your interest has been recorded. The employer will contact you shortly.'),
        },
      ],
    );
  };

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.badgeRow}>
          <View style={[s.badge, { backgroundColor: typeBg }]}>
            <Text style={[s.badgeText, { color: typeTextColor }]}>{item.employmentType}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: modeBg }]}>
            <Text style={[s.badgeText, { color: modeTextColor }]}>{item.workMode}</Text>
          </View>
        </View>
        <Text style={s.postedAt}>{item.postedAt}</Text>
      </View>

      <Text style={s.title}>{item.title}</Text>
      <Text style={s.company}>{item.company}</Text>
      <Text style={s.description} numberOfLines={3}>{item.description}</Text>

      <View style={s.footer}>
        <View style={s.locationRow}>
          <Text style={s.locationIcon}>{'📍'}</Text>
          <Text style={s.location}>{item.location}</Text>
        </View>
        <TouchableOpacity style={s.applyButton} onPress={handleApply} activeOpacity={0.8}>
          <Text style={s.applyText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function OpenPositionsScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  return (
    <FlatList
      data={jobsData}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <JobCard item={item} />}
      contentContainerStyle={s.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    list: { padding: 16, paddingBottom: 32 },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 14,
      shadowColor: theme.shadow,
      shadowOpacity: 0.07,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    badgeRow: { flexDirection: 'row', gap: 6 },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    badgeText: { fontSize: 12, fontWeight: '700' },
    postedAt: { fontSize: 12, color: theme.textTertiary },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 3,
      lineHeight: 24,
    },
    company: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.accent,
      marginBottom: 10,
    },
    description: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 21,
      marginBottom: 12,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    locationRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    locationIcon: { fontSize: 13, marginRight: 4 },
    location: { fontSize: 13, color: theme.textSecondary, fontWeight: '500' },
    applyButton: {
      backgroundColor: theme.buttonBg,
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 20,
    },
    applyText: {
      color: theme.buttonText,
      fontSize: 13,
      fontWeight: '700',
    },
  });
}
