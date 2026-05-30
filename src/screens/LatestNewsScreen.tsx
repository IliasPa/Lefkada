import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { newsData } from '../data/news';
import { useTheme } from '../theme/ThemeContext';
import { Theme } from '../theme';

const COL = 2;
const GAP = 12;
const PADDING = 16;
const CARD_WIDTH = (Dimensions.get('window').width - PADDING * 2 - GAP) / COL;

function SocialIcons({ socialLinks, theme }: { socialLinks: typeof newsData[0]['socialLinks']; theme: Theme }) {
  if (!socialLinks) return null;
  const icons: { key: keyof typeof socialLinks; name: keyof typeof Ionicons.glyphMap; color: string }[] = [
    { key: 'instagram', name: 'logo-instagram', color: '#E1306C' },
    { key: 'facebook',  name: 'logo-facebook',  color: '#1877F2' },
    { key: 'twitter',   name: 'logo-twitter',   color: '#1DA1F2' },
  ];
  const visible = icons.filter(i => !!socialLinks[i.key]);
  if (visible.length === 0) return null;
  return (
    <View style={socialStyles.row}>
      {visible.map(i => (
        <TouchableOpacity
          key={i.key}
          onPress={() => Linking.openURL(socialLinks[i.key]!)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={[socialStyles.iconBtn, { backgroundColor: theme.surface === '#FFFFFF' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)' }]}
        >
          <Ionicons name={i.name} size={13} color={i.color} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const socialStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  iconBtn: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
});

function NewsCard({ item, theme }: { item: typeof newsData[0]; theme: Theme }) {
  const s = makeStyles(theme);
  return (
    <View style={[s.card, { width: CARD_WIDTH }]}>
      <View style={[s.thumbnail, { backgroundColor: item.imageColor }]} />
      <View style={s.cardBody}>
        <Text style={s.title} numberOfLines={2}>{item.title}</Text>
        <Text style={s.description} numberOfLines={2}>{item.description}</Text>
        <View style={s.footer}>
          <Text style={s.timestamp}>{item.timestamp}</Text>
          <SocialIcons socialLinks={item.socialLinks} theme={theme} />
        </View>
      </View>
    </View>
  );
}

export default function LatestNewsScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  return (
    <FlatList
      data={newsData}
      keyExtractor={(item) => item.id}
      numColumns={COL}
      columnWrapperStyle={s.row}
      renderItem={({ item }) => <NewsCard item={item} theme={theme} />}
      contentContainerStyle={s.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    list: { padding: PADDING, gap: GAP },
    row: { gap: GAP },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      overflow: 'hidden',
      shadowColor: theme.shadow,
      shadowOpacity: 0.07,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    thumbnail: { width: '100%', height: 100 },
    cardBody: { padding: 10, gap: 4 },
    title: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textPrimary,
      lineHeight: 18,
    },
    description: {
      fontSize: 12,
      color: theme.textSecondary,
      lineHeight: 17,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    timestamp: {
      fontSize: 11,
      color: theme.textTertiary,
    },
  });
}
