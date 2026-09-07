/**
 * Spacing scale. Use these instead of magic numbers so density stays
 * consistent with the "generous spacing" premium feel of the reference UI.
 */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 56,
} as const;

export type SpacingToken = keyof typeof spacing;
