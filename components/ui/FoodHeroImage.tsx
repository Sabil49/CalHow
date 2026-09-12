import React from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

// Default bundled hero photo — a bright, colorful overhead salad bowl shot
// (cherry tomatoes on the vine, fanned avocado slices, chickpeas, sweet
// potato, radish) matching the reference designs' mood. Free stock
// photography, Anna Pelzer, licensed for commercial use under the
// standard Unsplash License (no attribution required — credited here
// anyway as good practice):
// https://unsplash.com/photos/bowl-of-vegetable-salads-IGfIGP5ONV0
const defaultHeroSource = require('../../assets/food/hero-bowl.jpg');

interface FoodHeroImageProps {
  /** Real per-meal photo URL (e.g. a Cloudinary-hosted scan). Falls back to the bundled default bowl photo when omitted. */
  imageUri?: string;
  style?: StyleProp<ViewStyle>;
  /** Rounds only the bottom-left corner, matching the bleed-off-the-edge hero shots in the references. */
  bleedRight?: boolean;
  /** Square size shorthand. Ignored if `width`/`height` are given. */
  size?: number;
  width?: number | `${number}%`;
  height?: number | `${number}%`;
}

/**
 * Food hero photo used throughout onboarding/auth/home screens. Renders
 * `imageUri` when given (e.g. a real scanned meal photo); otherwise falls
 * back to the bundled default bowl photo above — never a gradient/icon
 * placeholder, so every screen using this always shows a real photo.
 */
export function FoodHeroImage({ imageUri, style, bleedRight = false, size = 220, width, height }: FoodHeroImageProps) {
  const finalWidth = width ?? size;
  const finalHeight = height ?? size;

  return (
    <View style={[{ width: finalWidth, height: finalHeight }, styles.wrapper, bleedRight && styles.bleedRight, style]}>
      <Image source={imageUri ? { uri: imageUri } : defaultHeroSource} style={styles.image} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: theme.radius['2xl'],
    overflow: 'hidden',
  },
  bleedRight: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
