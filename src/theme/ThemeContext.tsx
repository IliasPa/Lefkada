import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, lightTheme, darkTheme } from './index';

const STORAGE_KEY = 'lefkada_theme_preference';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
  setDark: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored !== null) {
        setIsDark(stored === 'dark');
      } else {
        setIsDark(systemScheme === 'dark');
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const setDark = useCallback((value: boolean) => {
    setIsDark(value);
    AsyncStorage.setItem(STORAGE_KEY, value ? 'dark' : 'light').catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setDark(!isDark);
  }, [isDark, setDark]);

  if (!loaded) return null;

  return (
    <ThemeContext.Provider
      value={{ theme: isDark ? darkTheme : lightTheme, isDark, toggleTheme, setDark }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
