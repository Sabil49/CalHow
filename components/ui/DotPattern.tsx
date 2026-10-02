import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Mask, Pattern, Rect, Stop } from 'react-native-svg';
import { theme } from '@/constants/theme';

/** Distance between dots, px. Rows are staggered by half of it. */
const SPACING = 22;

/**
 * Soft staggered dot grid in the brand green, strongest at the top of the
 * screen and fading out by about two-thirds of the way down, so it adds
 * texture behind headers without sitting under dense content. Drawn by
 * ScreenContainer over the cream/stripe background.
 */
export function DotPattern() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="calhow-dots" patternUnits="userSpaceOnUse" width={SPACING} height={SPACING}>
            <Circle cx={SPACING / 4} cy={SPACING / 4} r={1.5} fill={theme.palette.green500} />
            <Circle cx={(SPACING * 3) / 4} cy={(SPACING * 3) / 4} r={1.1} fill={theme.palette.lime400} />
          </Pattern>
          <LinearGradient id="calhow-dots-fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset="0.35" stopColor="#FFFFFF" stopOpacity={0.55} />
            <Stop offset="0.65" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
          <Mask id="calhow-dots-mask">
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#calhow-dots-fade)" />
          </Mask>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#calhow-dots)" mask="url(#calhow-dots-mask)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.22,
  },
});
