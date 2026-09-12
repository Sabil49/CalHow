/**
 * CalHow color tokens.
 *
 * Palette derived from the CalHow visual references: warm cream backgrounds,
 * green -> lime -> yellow brand gradients, and soft nutrition accent colors.
 * Keep every screen sourcing color from here instead of inlining hex values,
 * so the whole app can be re-themed from a single place later.
 */

export const palette = {
  white: '#FFFFFF',
  black: '#141414',

  // Warm cream backgrounds
  cream: '#FBF7EE',
  creamDeep: '#F6F0E2',
  glowYellow: '#F3E9B8',

  // Brand greens (apple / lime)
  green900: '#1F3510',
  green800: '#2C4A16',
  green700: '#3C641D',
  green600: '#4C7A1F',
  green500: '#5E8E24',
  green400: '#7CB342',
  lime400: '#9ACD32',
  lime300: '#B8DB3A',
  lime200: '#D4E88A',
  lime100: '#E9F3C8',
  lime50: '#F1F7DE',

  // Text
  ink900: '#1A1A1A',
  ink700: '#3A3D3F',
  ink500: '#6B6F76',
  ink300: '#9BA0A6',
  ink100: '#D8DCE0',

  // Borders / dividers
  border: '#ECE7D8',
  borderStrong: '#DCD5C0',

  // Nutrition accents
  calorie: '#EF5350',
  carbs: '#7CB342',
  fats: '#F5A623',
  protein: '#E5484D',
  fiber: '#66A83E',
  water: '#4FA8E8',
  purple: '#8B6BE0',

  // Status
  success: '#3C9A3C',
  successBg: '#E7F5E2',
  warning: '#F0A93A',
  warningBg: '#FBF0DC',
  error: '#E0483F',
  errorBg: '#FBE7E5',

  overlay: 'rgba(20, 20, 20, 0.55)',
} as const;

export const gradients = {
  // Primary CTA buttons ("Continue", "Log In", "Create Account")
  primaryButton: [palette.green500, palette.lime300] as const,
  // Background ambient glow used behind hero imagery
  ambientGlow: [palette.glowYellow, palette.cream] as const,
  // Pro / paywall crown badge
  gold: ['#F6C453', '#E8A233'] as const,
  // Subtle whole-screen wash — low-contrast enough to sit behind dense text/forms
  screenBackground: [palette.cream, palette.creamDeep] as const,
};

export const colors = {
  background: palette.cream,
  backgroundDeep: palette.creamDeep,
  card: palette.white,
  border: palette.border,

  textPrimary: palette.ink900,
  textSecondary: palette.ink500,
  textMuted: palette.ink300,
  textInverse: palette.white,

  brandPrimary: palette.green500,
  brandDark: palette.green700,
  brandLight: palette.lime300,
  brandTint: palette.lime50,

  tabActive: palette.green600,
  tabInactive: palette.ink300,
  tabActiveBg: palette.lime100,

  success: palette.success,
  successBg: palette.successBg,
  warning: palette.warning,
  warningBg: palette.warningBg,
  error: palette.error,
  errorBg: palette.errorBg,

  nutrition: {
    calories: palette.calorie,
    carbs: palette.carbs,
    fats: palette.fats,
    protein: palette.protein,
    fiber: palette.fiber,
    water: palette.water,
    purple: palette.purple,
  },
};

export type ColorTokens = typeof colors;
