import { colors, gradients, palette } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { fontFamily, fontSize, lineHeight, textVariants } from './typography';

/**
 * Single import surface for design tokens:
 *   import { theme } from '@/constants/theme';
 *   theme.colors.brandPrimary
 *
 * This is the only file screens/components should need for styling
 * constants. Keep it a thin aggregator — the real values live in the
 * individual token files.
 */
export const theme = {
  colors,
  palette,
  gradients,
  spacing,
  radius,
  shadows,
  fontFamily,
  fontSize,
  lineHeight,
  text: textVariants,
} as const;

export type Theme = typeof theme;

export * from './colors';
export * from './radius';
export * from './shadows';
export * from './spacing';
export * from './typography';
