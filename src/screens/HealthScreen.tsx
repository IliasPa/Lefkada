import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { healthCategories, HealthTestEntry, ResultStatus } from '../data/healthTests';
import { useTheme } from '../theme/ThemeContext';
import { Theme } from '../theme';

const STATUS_COLORS: Record<ResultStatus, { bg: string; text: string }> = {
  normal: { bg: '#E8F5E9', text: '#388E3C' },
  high:   { bg: '#FFF3E0', text: '#E65100' },
  low:    { bg: '#EDE7F6', text: '#6A1B9A' },
};
const STATUS_COLORS_DARK: Record<ResultStatus, { bg: string; text: string }> = {
  normal: { bg: '#1B3325', text: '#69C77A' },
  high:   { bg: '#3A1E0A', text: '#FFB347' },
  low:    { bg: '#241535', text: '#CE93D8' },
};
const STATUS_LABELS: Record<ResultStatus, string> = {
  normal: 'OK',
  high: 'High',
  low: 'Low',
};

function StatusBadge({ status, isDark }: { status: ResultStatus; isDark: boolean }) {
  const palette = isDark ? STATUS_COLORS_DARK[status] : STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.text }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

function TestCard({ test, theme, isDark }: { test: HealthTestEntry; theme: Theme; isDark: boolean }) {
  const s = makeStyles(theme);
  return (
    <View style={s.card}>
      <Text style={s.testName}>{test.name}</Text>
      <View style={s.refRow}>
        <Text style={s.refLabel}>Reference: </Text>
        <Text style={s.refValue}>{test.referenceRange}</Text>
      </View>
      <View style={s.resultTable}>
        <View style={[s.tableHeader, { borderBottomColor: theme.separator }]}>
          <Text style={[s.colYear, s.tableHeaderText]}>Year</Text>
          <Text style={[s.colResult, s.tableHeaderText]}>Result</Text>
          <Text style={[s.colStatus, s.tableHeaderText]}>Status</Text>
        </View>
        {test.yearlyResults.map((yr) => (
          <View key={yr.year} style={[s.tableRow, { borderBottomColor: theme.separator }]}>
            <Text style={[s.colYear, s.yearText]}>{yr.year}</Text>
            <Text style={[s.colResult, s.resultText, yr.status !== 'normal' && s.resultTextWarning]}>
              {yr.value}{test.unit ? ' ' + test.unit : ''}
            </Text>
            <View style={s.colStatus}>
              <StatusBadge status={yr.status} isDark={isDark} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function HealthScreen() {
  const { theme, isDark } = useTheme();
  const s = makeStyles(theme);
  const [activeCategory, setActiveCategory] = useState(0);
  const category = healthCategories[activeCategory];

  return (
    <View style={s.container}>
      {/* Emoji subtabs */}
      <View style={s.subtabRow}>
        {healthCategories.map((cat, index) => {
          const isActive = index === activeCategory;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[s.subtab, isActive && s.subtabActive]}
              onPress={() => setActiveCategory(index)}
              activeOpacity={0.7}
            >
              <Text style={s.subtabEmoji}>{cat.emoji}</Text>
              {isActive && <Text style={s.subtabLabel}>{cat.label}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        key={category.id}
        data={category.tests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TestCard test={item} theme={theme} isDark={isDark} />}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    subtabRow: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.separator,
      gap: 8,
    },
    subtab: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
      backgroundColor: theme.inputBg,
    },
    subtabActive: { backgroundColor: theme.buttonBg },
    subtabEmoji: { fontSize: 20 },
    subtabLabel: { fontSize: 13, fontWeight: '700', color: theme.buttonText },
    list: { padding: 16, gap: 14 },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 16,
      shadowColor: theme.shadow,
      shadowOpacity: 0.07,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    testName: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    refRow: { flexDirection: 'row', marginBottom: 12 },
    refLabel: { fontSize: 13, color: theme.textTertiary },
    refValue: { fontSize: 13, color: theme.textSecondary, fontWeight: '600' },
    resultTable: {
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
    },
    tableHeader: {
      flexDirection: 'row',
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: theme.inputBg,
      borderBottomWidth: 1,
    },
    tableHeaderText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: 'row',
      paddingHorizontal: 10,
      paddingVertical: 9,
      alignItems: 'center',
      borderBottomWidth: 1,
    },
    colYear: { width: 48, fontSize: 14 },
    colResult: { flex: 1, fontSize: 14 },
    colStatus: { width: 56, alignItems: 'flex-end' },
    yearText: { color: theme.textTertiary, fontWeight: '500' },
    resultText: { color: theme.textPrimary, fontWeight: '600' },
    resultTextWarning: { color: '#E65100' },
  });
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
