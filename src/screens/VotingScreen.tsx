import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { pollData } from '../data/voting';
import { VotingStackParamList } from '../navigation/VotingStack';
import { useTheme } from '../theme/ThemeContext';
import { Theme } from '../theme';

type VotingScreenNavProp = NativeStackNavigationProp<VotingStackParamList, 'VotingMain'>;

export default function VotingScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const navigation = useNavigation<VotingScreenNavProp>();
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={() => navigation.navigate('VotingExplanation')} activeOpacity={0.85}>
        <View style={s.pollCard}>
          <View style={s.pollHeader}>
            <Text style={s.pollLabel}>ACTIVE POLL</Text>
            <Text style={s.tapHint}>Tap for details →</Text>
          </View>
          <Text style={s.pollTitle}>{pollData.title}</Text>
        </View>
      </TouchableOpacity>

      {submitted ? (
        <View style={s.successCard}>
          <Text style={s.successIcon}>✓</Text>
          <Text style={s.successTitle}>Vote Submitted!</Text>
          <Text style={s.successText}>Thank you for participating. Your vote has been recorded anonymously.</Text>
        </View>
      ) : (
        <View style={s.optionsContainer}>
          <Text style={s.optionsLabel}>Choose your answer:</Text>
          {pollData.options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[s.optionButton, selectedOption === option.id && s.optionSelected]}
              onPress={() => setSelectedOption(option.id)}
              activeOpacity={0.8}
            >
              <View style={[s.optionRadio, selectedOption === option.id && s.optionRadioSelected]}>
                {selectedOption === option.id && <View style={s.optionRadioInner} />}
              </View>
              <Text style={[s.optionText, selectedOption === option.id && s.optionTextSelected]}>
                {option.text}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[s.submitButton, !selectedOption && s.submitButtonDisabled]}
            onPress={() => { if (selectedOption) setSubmitted(true); }}
            disabled={!selectedOption}
            activeOpacity={0.8}
          >
            <Text style={s.submitButtonText}>Submit Vote</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 16, paddingBottom: 40 },
    pollCard: {
      backgroundColor: theme.accent,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    pollHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    pollLabel: { color: '#4FC3F7', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
    tapHint: { color: 'rgba(255,255,255,0.55)', fontSize: 12 },
    pollTitle: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 26 },
    optionsContainer: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: theme.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    optionsLabel: { fontSize: 14, fontWeight: '600', color: theme.textSecondary, marginBottom: 16 },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.border,
      marginBottom: 10,
      backgroundColor: theme.background,
    },
    optionSelected: { borderColor: theme.accent, backgroundColor: theme.inputBg },
    optionRadio: {
      width: 20, height: 20, borderRadius: 10, borderWidth: 2,
      borderColor: theme.border, marginRight: 12, justifyContent: 'center', alignItems: 'center',
    },
    optionRadioSelected: { borderColor: theme.accent },
    optionRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.accent },
    optionText: { fontSize: 15, color: theme.textSecondary, flex: 1, lineHeight: 20 },
    optionTextSelected: { color: theme.textPrimary, fontWeight: '600' },
    submitButton: {
      backgroundColor: theme.buttonBg, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 10,
    },
    submitButtonDisabled: { opacity: 0.4 },
    submitButtonText: { color: theme.buttonText, fontSize: 16, fontWeight: '700' },
    successCard: {
      backgroundColor: theme.surface, borderRadius: 16, padding: 30, alignItems: 'center',
      shadowColor: theme.shadow, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    successIcon: { fontSize: 48, color: '#4CAF50', marginBottom: 16 },
    successTitle: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, marginBottom: 10 },
    successText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 22 },
  });
}
