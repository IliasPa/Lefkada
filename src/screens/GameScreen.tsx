import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { WORD_LIST } from '../data/gameWords';
import { useTheme } from '../theme/ThemeContext';
import { Theme } from '../theme';

const ROWS = 6;
const COLS = 5;

type TileState = 'empty' | 'active' | 'correct' | 'present' | 'absent';

interface Tile {
  letter: string;
  state: TileState;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

function pickRandom(): string {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
}

function evaluateGuess(guess: string, target: string): TileState[] {
  const result: TileState[] = Array(COLS).fill('absent');
  const targetArr = [...target];
  const guessArr = [...guess];

  // Pass 1: correct positions
  for (let i = 0; i < COLS; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = 'correct';
      targetArr[i] = '#';
      guessArr[i] = '*';
    }
  }
  // Pass 2: present elsewhere
  for (let i = 0; i < COLS; i++) {
    if (guessArr[i] !== '*') {
      const found = targetArr.indexOf(guessArr[i]);
      if (found !== -1) {
        result[i] = 'present';
        targetArr[found] = '#';
      }
    }
  }
  return result;
}

function tileColor(state: TileState, isDark: boolean): string {
  switch (state) {
    case 'correct': return '#538D4E';
    case 'present': return '#B59F3B';
    case 'absent':  return isDark ? '#3A3A3C' : '#787C7E';
    default:        return 'transparent';
  }
}

function keyBgColor(state: TileState | undefined, theme: Theme, isDark: boolean): string {
  if (!state || state === 'empty' || state === 'active') return theme.inputBg;
  return tileColor(state, isDark);
}

const cellStyles = StyleSheet.create({
  tile: {
    width: 52,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLetter: {
    fontSize: 20,
    fontWeight: '800',
  },
  key: {
    height: 44,
    minWidth: 32,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyWide: { minWidth: 56 },
  keyText: { fontSize: 13 },
});

function TileCell({ tile, theme, isDark }: { tile: Tile; theme: Theme; isDark: boolean }) {
  const colored = tile.state === 'correct' || tile.state === 'present' || tile.state === 'absent';
  return (
    <View
      style={[
        cellStyles.tile,
        {
          borderColor: colored
            ? tileColor(tile.state, isDark)
            : tile.letter
            ? theme.accent
            : theme.border,
          backgroundColor: colored ? tileColor(tile.state, isDark) : theme.surface,
          borderWidth: colored ? 0 : 2,
        },
      ]}
    >
      <Text
        style={[
          cellStyles.tileLetter,
          { color: colored ? '#FFFFFF' : theme.textPrimary },
        ]}
      >
        {tile.letter}
      </Text>
    </View>
  );
}

function KeyButton({
  label,
  state,
  onPress,
  theme,
  isDark,
}: {
  label: string;
  state: TileState | undefined;
  onPress: (key: string) => void;
  theme: Theme;
  isDark: boolean;
}) {
  const isWide = label === 'ENTER' || label === '⌫';
  const bg = keyBgColor(state, theme, isDark);
  const textColor =
    state === 'correct' || state === 'present' || state === 'absent'
      ? '#FFFFFF'
      : theme.textPrimary;
  return (
    <TouchableOpacity
      onPress={() => onPress(label)}
      activeOpacity={0.7}
      style={[
        cellStyles.key,
        isWide && cellStyles.keyWide,
        { backgroundColor: bg },
      ]}
    >
      <Text style={[cellStyles.keyText, { color: textColor, fontWeight: isWide ? '700' : '600' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function GameScreen() {
  const { theme, isDark } = useTheme();
  const [target, setTarget] = useState<string>(() => pickRandom());
  const [grid, setGrid] = useState<Tile[][]>(() =>
    Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ letter: '', state: 'empty' as TileState }))
    )
  );
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keyStates, setKeyStates] = useState<Record<string, TileState>>({});
  const [message, setMessage] = useState('');

  const s = makeStyles(theme);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2200);
  };

  const handleKey = useCallback(
    (key: string) => {
      if (gameOver) return;

      if (key === '⌫') {
        if (currentCol === 0) return;
        setGrid(prev => {
          const next = prev.map(r => r.map(c => ({ ...c })));
          next[currentRow][currentCol - 1] = { letter: '', state: 'empty' };
          return next;
        });
        setCurrentCol(c => c - 1);
        return;
      }

      if (key === 'ENTER') {
        if (currentCol < COLS) {
          showMessage('Not enough letters');
          return;
        }
        const guess = grid[currentRow].map(c => c.letter).join('');
        const states = evaluateGuess(guess, target);

        setGrid(prev => {
          const next = prev.map(r => r.map(c => ({ ...c })));
          for (let i = 0; i < COLS; i++) {
            next[currentRow][i].state = states[i];
          }
          return next;
        });

        setKeyStates(prev => {
          const next = { ...prev };
          const priority: Record<TileState, number> = { correct: 3, present: 2, absent: 1, empty: 0, active: 0 };
          for (let i = 0; i < COLS; i++) {
            const letter = guess[i];
            const newState = states[i];
            if ((priority[newState] ?? 0) > (priority[next[letter]] ?? 0)) {
              next[letter] = newState;
            }
          }
          return next;
        });

        const isWin = states.every(s => s === 'correct');
        if (isWin) {
          setTimeout(() => showMessage('🎉 Correct!'), 300);
          setWon(true);
          setGameOver(true);
          return;
        }
        const nextRow = currentRow + 1;
        if (nextRow >= ROWS) {
          setTimeout(() => showMessage(`The word was: ${target}`), 300);
          setGameOver(true);
          return;
        }
        setCurrentRow(nextRow);
        setCurrentCol(0);
        return;
      }

      if (currentCol >= COLS) return;
      setGrid(prev => {
        const next = prev.map(r => r.map(c => ({ ...c })));
        next[currentRow][currentCol] = { letter: key, state: 'active' };
        return next;
      });
      setCurrentCol(c => c + 1);
    },
    [gameOver, currentRow, currentCol, grid, target]
  );

  const resetGame = () => {
    setTarget(pickRandom());
    setGrid(
      Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => ({ letter: '', state: 'empty' as TileState }))
      )
    );
    setCurrentRow(0);
    setCurrentCol(0);
    setGameOver(false);
    setWon(false);
    setKeyStates({});
    setMessage('');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={s.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Political Wordle</Text>
        <Text style={s.headerSub}>Guess the 5-letter political word in {ROWS} tries</Text>
      </View>

      {/* Toast message */}
      {message ? (
        <View style={s.toast}>
          <Text style={s.toastText}>{message}</Text>
        </View>
      ) : null}

      {/* Grid */}
      <View style={s.grid}>
        {grid.map((row, rIdx) => (
          <View key={rIdx} style={s.row}>
            {row.map((tile, cIdx) => (
              <TileCell key={cIdx} tile={tile} theme={theme} isDark={isDark} />
            ))}
          </View>
        ))}
      </View>

      {/* Keyboard */}
      <View style={s.keyboard}>
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <View key={rIdx} style={s.keyRow}>
            {row.map(key => (
              <KeyButton
                key={key}
                label={key}
                state={keyStates[key]}
                onPress={handleKey}
                theme={theme}
                isDark={isDark}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Play Again */}
      {gameOver && (
        <TouchableOpacity style={[s.playAgainBtn, { backgroundColor: theme.accent }]} onPress={resetGame}>
          <Text style={[s.playAgainText, { color: theme.buttonText }]}>Play Again</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 12,
      gap: 16,
    },
    header: { alignItems: 'center', gap: 4 },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.textPrimary,
      letterSpacing: 1,
    },
    headerSub: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    toast: {
      backgroundColor: theme.surfaceElevated,
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: 20,
      shadowColor: theme.shadow,
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    toastText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    grid: { gap: 6 },
    row: { flexDirection: 'row', gap: 6 },
    keyboard: { gap: 8, width: '100%', maxWidth: 400 },
    keyRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 5,
    },
    playAgainBtn: {
      paddingVertical: 14,
      paddingHorizontal: 40,
      borderRadius: 26,
      marginTop: 8,
    },
    playAgainText: {
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
