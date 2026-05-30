import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { videosData } from '../data/videos';
import { useTheme } from '../theme/ThemeContext';
import { Theme } from '../theme';

const COL = 2;
const GAP = 12;
const PADDING = 16;
const CARD_WIDTH = (Dimensions.get('window').width - PADDING * 2 - GAP) / COL;

function VideoCard({ item, theme }: { item: typeof videosData[0]; theme: Theme }) {
  const s = makeStyles(theme);
  return (
    <View style={[s.card, { width: CARD_WIDTH }]}>
      <View style={[s.thumbnail, { backgroundColor: item.thumbnailColor }]}>
        <View style={s.playButton}>
          <Text style={s.playIcon}>{'\u25B6'}</Text>
        </View>
        <View style={s.durationBadge}>
          <Text style={s.durationText}>{item.duration}</Text>
        </View>
      </View>
      <View style={s.cardBody}>
        <Text style={s.title} numberOfLines={2}>{item.title}</Text>
        <Text style={s.description} numberOfLines={2}>{item.description}</Text>
        <Text style={s.year}>{item.year}</Text>
      </View>
    </View>
  );
}

export default function OldVideosScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  return (
    <FlatList
      data={videosData}
      keyExtractor={(item) => item.id}
      numColumns={COL}
      columnWrapperStyle={s.row}
      renderItem={({ item }) => <VideoCard item={item} theme={theme} />}
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
    thumbnail: {
      width: '100%',
      height: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    playIcon: { fontSize: 14, color: '#1a1a2e', marginLeft: 2 },
    durationBadge: {
      position: 'absolute',
      bottom: 6,
      right: 6,
      backgroundColor: 'rgba(0,0,0,0.65)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    durationText: { fontSize: 11, color: '#fff', fontWeight: '600' },
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
    year: {
      fontSize: 11,
      color: theme.textTertiary,
      marginTop: 2,
      fontWeight: '600',
    },
  });
}
