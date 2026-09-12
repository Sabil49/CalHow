import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { theme } from '@/constants/theme';

interface HeroGlowProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Soft radial yellow-green bloom fading to transparent — the ambient glow
 * visible behind hero food photography on Home/Login/Signup/Welcome in the
 * reference designs (see constants/colors.ts's `gradients.ambientGlow`
 * tokens, previously defined but never actually rendered anywhere).
 *
 * `size` sets both the SVG's own width/height and is exposed so callers
 * can center it (e.g. `marginLeft: -size / 2`) — deliberately NOT
 * `StyleSheet.absoluteFillObject`-based, since that sets top/right/
 * bottom/left all to 0, which would fight with a caller's centering
 * offsets instead of being cleanly overridden by them. Render it as the
 * first child behind the hero image/content, not on top, with `position:
 * 'absolute'` supplied via `style`.
 */
export function HeroGlow({ size = 340, style }: HeroGlowProps) {
  return (
    <Svg width={size} height={size} style={style} pointerEvents="none">
      <Defs>
        <RadialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={theme.palette.glowYellow} stopOpacity={0.85} />
          <Stop offset="55%" stopColor={theme.palette.lime200} stopOpacity={0.3} />
          <Stop offset="100%" stopColor={theme.palette.cream} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={size} height={size} fill="url(#heroGlow)" />
    </Svg>
  );
}
