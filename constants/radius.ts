/**
 * Corner radius scale. The reference UI leans on large, soft rounded
 * corners for cards (~20-24px) and fully pill-shaped buttons/badges.
 */
export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  '2xl': 28,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radius;
