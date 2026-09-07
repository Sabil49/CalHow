/**
 * CalHow typography tokens.
 *
 * Headings use an editorial serif (Playfair Display) to match the bold
 * magazine-style headings in the design references (e.g. "Let's get you
 * started", "AI is analyzing your meal..."). Supporting text/UI uses a
 * clean sans-serif (Inter). Fonts are loaded once in app/_layout.tsx via
 * useFonts and referenced here by family name.
 */

export const fontFamily = {
  serifRegular: 'PlayfairDisplay_400Regular',
  serifMedium: 'PlayfairDisplay_500Medium',
  serifSemiBold: 'PlayfairDisplay_600SemiBold',
  serifBold: 'PlayfairDisplay_700Bold',
  sansRegular: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
  '4xl': 38,
} as const;

export const lineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.4,
  relaxed: 1.6,
} as const;

/** Pre-composed text styles for common cases across the app. */
export const textVariants = {
  displayHeading: {
    fontFamily: fontFamily.serifBold,
    fontSize: fontSize['4xl'],
    lineHeight: fontSize['4xl'] * lineHeight.tight,
    color: undefined,
  },
  screenHeading: {
    fontFamily: fontFamily.serifBold,
    fontSize: fontSize['3xl'],
    lineHeight: fontSize['3xl'] * lineHeight.tight,
  },
  sectionHeading: {
    fontFamily: fontFamily.serifSemiBold,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.snug,
  },
  cardTitle: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
  },
  body: {
    fontFamily: fontFamily.sansRegular,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.relaxed,
  },
  bodyMedium: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  caption: {
    fontFamily: fontFamily.sansRegular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  label: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  button: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
  },
  metricValue: {
    fontFamily: fontFamily.serifBold,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.tight,
  },
} as const;
