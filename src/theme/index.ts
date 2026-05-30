export interface Theme {
  // Backgrounds
  background: string;
  surface: string;
  surfaceElevated: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  // Borders
  border: string;
  separator: string;
  // Accent
  accent: string;
  accentLight: string;
  // Interactive
  buttonBg: string;
  buttonText: string;
  destructive: string;
  // Header / Tab Bar
  headerBg: string;
  tabBarBg: string;
  tabBarBorder: string;
  tabHighlight: string;
  tabHighlightBorder: string;
  // Status bar
  statusBar: 'light-content' | 'dark-content';
  // Icons
  iconColor: string;
  iconMuted: string;
  // Inputs
  inputBg: string;
  inputBorder: string;
  inputText: string;
  placeholderText: string;
  // Badges
  badgeGreenBg: string;
  badgeGreenText: string;
  badgeOrangeBg: string;
  badgeOrangeText: string;
  badgeBlueBg: string;
  badgeBlueText: string;
  // Misc
  shadow: string;
}

export const lightTheme: Theme = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#1a1a2e',
  textSecondary: '#555555',
  textTertiary: '#999999',
  border: '#F0F0F0',
  separator: '#EBEBEB',
  accent: '#1a1a2e',
  accentLight: '#4FC3F7',
  buttonBg: '#1a1a2e',
  buttonText: '#FFFFFF',
  destructive: '#E53935',
  headerBg: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#EFEFEF',
  tabHighlight: 'rgba(26,26,46,0.07)',
  tabHighlightBorder: 'rgba(26,26,46,0.10)',
  statusBar: 'dark-content',
  iconColor: '#1a1a2e',
  iconMuted: '#AAAAAA',
  inputBg: '#F6F7FB',
  inputBorder: '#E0E0E0',
  inputText: '#1a1a2e',
  placeholderText: '#AAAAAA',
  badgeGreenBg: '#E8F5E9',
  badgeGreenText: '#388E3C',
  badgeOrangeBg: '#FFF3E0',
  badgeOrangeText: '#F57C00',
  badgeBlueBg: '#E3F2FD',
  badgeBlueText: '#1976D2',
  shadow: '#000000',
};

export const darkTheme: Theme = {
  background: '#0F1219',
  surface: '#1C2130',
  surfaceElevated: '#252A3A',
  textPrimary: '#E8EAF2',
  textSecondary: '#9AA2B8',
  textTertiary: '#60697A',
  border: '#252A3A',
  separator: '#2A3045',
  accent: '#7EB8FF',
  accentLight: '#4FC3F7',
  buttonBg: '#3A5A8C',
  buttonText: '#FFFFFF',
  destructive: '#EF5350',
  headerBg: '#151824',
  tabBarBg: '#151824',
  tabBarBorder: '#252A3A',
  tabHighlight: 'rgba(126,184,255,0.12)',
  tabHighlightBorder: 'rgba(126,184,255,0.20)',
  statusBar: 'light-content',
  iconColor: '#E8EAF2',
  iconMuted: '#60697A',
  inputBg: '#252A3A',
  inputBorder: '#3A4155',
  inputText: '#E8EAF2',
  placeholderText: '#60697A',
  badgeGreenBg: '#1B3325',
  badgeGreenText: '#69C77A',
  badgeOrangeBg: '#332415',
  badgeOrangeText: '#FFB347',
  badgeBlueBg: '#152238',
  badgeBlueText: '#7EB8FF',
  shadow: '#000000',
};
