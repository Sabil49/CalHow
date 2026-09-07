import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FoodHeroImage } from './FoodHeroImage';
import { theme } from '@/constants/theme';

interface MealThumbnailProps {
  imageUri?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Small photo thumbnail for one specific meal or detected food item in a
 * list (History rows, Home's "Today's meals", detected-food rows).
 * Deliberately does NOT fall back to FoodHeroImage's generic bundled bowl
 * photo when `imageUri` is missing — in a list of several rows, that
 * would show the identical stock photo repeated on every row lacking a
 * real one, which reads as broken rather than intentionally generic.
 * Shows a neutral icon instead; FoodHeroImage's photo fallback stays
 * reserved for true single decorative-hero contexts (Welcome, Login,
 * Splash, Home's top banner, etc.).
 */
export function MealThumbnail({ imageUri, size = 52, style }: MealThumbnailProps) {
  if (imageUri) {
    return <FoodHeroImage imageUri={imageUri} size={size} style={style} />;
  }
  return (
    <View style={[{ width: size, height: size }, styles.fallback, style]}>
      <Feather name="image" size={size * 0.38} color={theme.colors.brandDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
