import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Theme } from '../theme';

interface Props {
  theme: Theme;
}

function Toast({ message, opacity }: { message: string; opacity: Animated.Value }) {
  return (
    <Animated.View style={[toastStyles.wrapper, { opacity }]} pointerEvents="none">
      <View style={toastStyles.pill}>
        <Text style={toastStyles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  pill: {
    backgroundColor: 'rgba(20, 20, 30, 0.88)',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 16,
    maxWidth: '82%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default function MayorMessageForm({ theme }: Props) {
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  const handleSend = () => {
    if (!message.trim()) {
      showToast('Please write a message before sending.');
      return;
    }
    if (isAnonymous) {
      showToast('Message was sent anonymously.');
    } else {
      showToast('Message was sent along with\nName, ID, Email');
    }
    setMessage('');
  };

  return (
    <View>
      <View style={[formStyles.card, { backgroundColor: theme.surface }]}>
        {/* Header */}
        <View style={formStyles.cardHeader}>
          <Text style={formStyles.mayorIcon}>{'🏛️'}</Text>
          <View style={formStyles.cardTitleBlock}>
            <Text style={[formStyles.cardTitle, { color: theme.textPrimary }]}>Message to the Mayor</Text>
            <Text style={[formStyles.cardSubtitle, { color: theme.textTertiary }]}>
              Your voice matters. Share your thoughts directly.
            </Text>
          </View>
        </View>

        <View style={[formStyles.divider, { backgroundColor: theme.separator }]} />

        {/* Message input */}
        <TextInput
          style={[
            formStyles.messageInput,
            { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText },
          ]}
          value={message}
          onChangeText={setMessage}
          placeholder="Write your message to the Mayor..."
          placeholderTextColor={theme.placeholderText}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {/* Anonymous toggle */}
        <View style={[formStyles.toggleRow, { borderColor: theme.separator }]}>
          <View style={formStyles.toggleInfo}>
            <Text style={[formStyles.toggleLabel, { color: theme.textPrimary }]}>Send anonymously</Text>
            <Text style={[formStyles.toggleDesc, { color: theme.textTertiary }]}>
              {isAnonymous
                ? 'Your identity will not be included'
                : 'Name, ID and email from your account will be included'}
            </Text>
          </View>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: theme.border, true: theme.buttonBg }}
            thumbColor="#fff"
          />
        </View>

        {/* Identity note — only when NOT anonymous */}
        {!isAnonymous && (
          <View style={[formStyles.identityNote, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
            <Text style={[formStyles.identityNoteText, { color: theme.textSecondary }]}>
              {'ℹ️  '}Your Name, ID and Email will be pulled from your Account profile.
            </Text>
          </View>
        )}

        {/* Send button */}
        <TouchableOpacity
          style={[formStyles.sendBtn, { backgroundColor: theme.buttonBg }]}
          onPress={handleSend}
          activeOpacity={0.8}
        >
          <Text style={[formStyles.sendText, { color: theme.buttonText }]}>{'📨  Send Message'}</Text>
        </TouchableOpacity>
      </View>

      <Toast message={toastMsg} opacity={toastOpacity} />
    </View>
  );
}

const formStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  mayorIcon: { fontSize: 32, marginTop: 2 },
  cardTitleBlock: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 3 },
  cardSubtitle: { fontSize: 13, lineHeight: 18 },
  divider: { height: 1, marginBottom: 14 },
  messageInput: {
    borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15,
    minHeight: 110, marginBottom: 14,
  },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, paddingTop: 14, paddingBottom: 14,
  },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  toggleDesc: { fontSize: 12, lineHeight: 17 },
  identityNote: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  identityNoteText: { fontSize: 13, lineHeight: 19 },
  sendBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 2 },
  sendText: { fontSize: 15, fontWeight: '700' },
});
