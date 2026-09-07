import { Platform } from 'react-native';

/**
 * Soft shadow presets. The reference design uses very subtle elevation on
 * white cards over a cream background, never harsh drop shadows.
 */
export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#3A3320',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
    },
    android: {
      elevation: 3,
    },
    default: {},
  }),
  floating: Platform.select({
    ios: {
      shadowColor: '#3A3320',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
  button: Platform.select({
    ios: {
      shadowColor: '#4C7A1F',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
} as const;
