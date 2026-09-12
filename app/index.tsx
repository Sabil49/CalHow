import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { theme } from '@/constants/theme';
import { CalHowLogo } from '@/components/ui/CalHowLogo';
import { FoodHeroImage } from '@/components/ui/FoodHeroImage';
import { LeafAccent } from '@/components/ui/LeafAccent';

/**
 * Entry route — this IS the "Splash" screen from the V1 flow (see
 * Splash.png reference): CalHow wordmark, tagline, hero food image, and a
 * rotating tip. It's shown for the brief moment it takes to resolve
 * Firebase auth state, then redirects to:
 *   - not signed in -> (auth)/welcome
 *   - signed in, onboarding incomplete -> onboarding/goal-setup
 *   - signed in, onboarding complete -> (tabs) Home
 *
 * (The native OS launch splash — the one shown before any JS runs — is
 * configured separately in app.json / expo-splash-screen in app/_layout.tsx.)
 *
 * MINIMUM_VISIBLE_MS enforces a floor on how long this screen stays on
 * screen. Without it, a returning user with an already-cached Firebase
 * session resolves `initializing`/`profileLoading` in well under one
 * frame, so this branded screen (tagline, hero photo, progress bar, tip)
 * could redirect away before a human ever perceives it rendered at all.
 */
const MINIMUM_VISIBLE_MS = 900;

export default function Index() {
  const { user, initializing } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [minDurationElapsed, setMinDurationElapsed] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(() => setMinDurationElapsed(true), MINIMUM_VISIBLE_MS);
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: MINIMUM_VISIBLE_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // animating a `width` percentage isn't supported by the native driver
    }).start();
    return () => clearTimeout(timer);
  }, [progressAnim]);

  const resolved = !initializing && !(user && profileLoading) && minDurationElapsed;

  if (resolved) {
    if (!user) return <Redirect href="/(auth)/welcome" />;
    if (!profile?.onboardingComplete) return <Redirect href="/onboarding/goal-setup" />;
    return <Redirect href="/(tabs)" />;
  }

  return (
    <LinearGradient
      colors={theme.gradients.screenBackground}
      style={[styles.container, { paddingTop: insets.top + theme.spacing.lg }]}
    >
      <LeafAccent size={26} rotation={-15} style={styles.leafTopLeft} />
      <LeafAccent size={22} rotation={20} style={styles.leafTopRight} />

      <View style={styles.content}>
        <CalHowLogo markSize={40} textSize={theme.fontSize['2xl']} />

        <Text style={styles.tagline}>
          Understand calories.{'\n'}Build a <Text style={styles.taglineAccent}>healthier</Text> you.
        </Text>
      </View>

      <View style={styles.heroWrap}>
        <FoodHeroImage width="100%" height="100%" style={styles.hero} />
      </View>

      <View style={[styles.footer, { paddingBottom: theme.spacing['2xl'] + insets.bottom }]}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]}
          />
        </View>
        <Text style={styles.tip}>
          <Text style={styles.tipLabel}>Tip: </Text>
          Small steps every day lead to big changes.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  leafTopLeft: {
    position: 'absolute',
    top: theme.spacing['3xl'],
    left: theme.spacing.lg,
  },
  leafTopRight: {
    position: 'absolute',
    top: theme.spacing['2xl'],
    right: theme.spacing['2xl'],
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  tagline: {
    ...theme.text.sectionHeading,
    textAlign: 'center',
    color: theme.colors.textPrimary,
  },
  taglineAccent: {
    color: theme.colors.brandPrimary,
  },
  heroWrap: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  hero: {
    borderTopLeftRadius: theme.radius['2xl'],
    borderTopRightRadius: theme.radius['2xl'],
    borderBottomLeftRadius: theme.radius['2xl'],
    borderBottomRightRadius: theme.radius['2xl'],
  },
  footer: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingBottom: theme.spacing['2xl'],
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  progressTrack: {
    width: 120,
    height: 3,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandPrimary,
  },
  tip: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  tipLabel: {
    color: theme.colors.brandPrimary,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
});
