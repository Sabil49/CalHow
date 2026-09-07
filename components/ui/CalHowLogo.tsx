import React from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

// Relative require (not the `@/` alias) — Metro's static asset analysis
// wants a literal path here, and a relative path works regardless of
// whether tsconfig path aliases are wired into the Metro resolver.
const logoSource = require('../../assets/logo.png');

// Real exported asset (assets/logo.png) is 60x68px.
const LOGO_ASPECT_RATIO = 60 / 68;

interface CalHowLogoProps {
  /** Height of the icon mark, in px — width is derived from the source image's own aspect ratio so it's never stretched. */
  markSize?: number;
  /** Font size for the "CalHow" wordmark text next to the mark. Omit to render the icon mark alone (no text). */
  textSize?: number;
  /** Text color — defaults to the standard dark-on-light lockup (theme.colors.textPrimary + brandPrimary accent). Pass theme.colors.textInverse for use on a dark/photo background (see app/scan/camera.tsx). */
  textColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The CalHow brand mark (apple + clock icon) plus, optionally, the
 * "CalHow" wordmark next to it — the SINGLE source of every logo
 * rendering in the app. Sourced from assets/logo.png, a real exported
 * asset (not a hand-drawn icon substitute) — see components/navigation/
 * AppHeader.tsx and every screen that shows the logo for usage.
 *
 * Every place that used to duplicate a "Feather 'target' icon + Cal/How
 * text" placeholder block now renders this component instead — do not
 * reintroduce a local copy of that markup; import this component.
 */
export function CalHowLogo({ markSize = 24, textSize, textColor = theme.colors.textPrimary, style }: CalHowLogoProps) {
  return (
    <View style={[styles.row, style]}>
      <Image
        source={logoSource}
        style={{ width: markSize * LOGO_ASPECT_RATIO, height: markSize }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      {textSize ? (
        <Text style={[styles.text, { fontSize: textSize, color: textColor }]}>
          Cal<Text style={styles.textAccent}>How</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xxs,
  },
  text: {
    fontFamily: theme.fontFamily.sansBold,
  },
  textAccent: {
    color: theme.colors.brandPrimary,
  },
});
