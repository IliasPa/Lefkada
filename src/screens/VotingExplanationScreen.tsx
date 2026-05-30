import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { pollData } from '../data/voting';
import { useTheme } from '../theme/ThemeContext';
import { Theme } from '../theme';

export default function VotingExplanationScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.headerCard}>
        <Text style={s.headerLabel}>VOTING PROCESS</Text>
        <Text style={s.title}>{pollData.title}</Text>
      </View>
      <View style={s.textCard}>
        {pollData.explanation.split('\n\n').map((paragraph, index) => {
          if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
            return (
              <Text key={index} style={s.sectionHeading}>
                {paragraph.replace(/\*\*/g, '')}
              </Text>
            );
          }
          if (paragraph.includes('\n-')) {
            const lines = paragraph.split('\n');
            return (
              <View key={index} style={s.paragraphContainer}>
                {lines.map((line, i) =>
                  line.startsWith('-') ? (
                    <View key={i} style={s.bulletRow}>
                      <Text style={s.bullet}>{'\u2022'}</Text>
                      <Text style={s.bulletText}>{line.replace(/^-\s*/, '')}</Text>
                    </View>
                  ) : line.length > 0 ? (
                    <Text key={i} style={s.paragraph}>{line}</Text>
                  ) : null
                )}
              </View>
            );
          }
          return (
            <Text key={index} style={s.paragraph}>
              {paragraph.replace(/\*\*/g, '')}
            </Text>
          );
        })}
      </View>
    </ScrollView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 16, paddingBottom: 40 },
    headerCard: {
      backgroundColor: theme.accent,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    headerLabel: { color: '#4FC3F7', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
    title: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 26 },
    textCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: theme.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    sectionHeading: {
      fontSize: 17, fontWeight: '700', color: theme.textPrimary, marginTop: 20, marginBottom: 8,
    },
    paragraphContainer: { marginBottom: 12 },
    paragraph: {
      fontSize: 15, color: theme.textSecondary, lineHeight: 24, marginBottom: 12,
    },
    bulletRow: { flexDirection: 'row', marginBottom: 6, paddingLeft: 4 },
    bullet: { fontSize: 15, color: theme.accent, marginRight: 8, lineHeight: 24 },
    bulletText: { fontSize: 15, color: theme.textSecondary, lineHeight: 24, flex: 1 },
  });
}
