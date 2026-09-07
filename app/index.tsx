import { StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
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
 */
export default function Index() {
  const { user, initializing } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  const resolved = !initializing && !(user && profileLoading);

  if (resolved) {
    if (!user) return <Redirect href="/(auth)/welcome" />;
    if (!profile?.onboardingComplete) return <Redirect href="/onboarding/goal-setup" />;
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <LeafAccent size={26} rotation={-15} style={styles.leafTopLeft} />
      <LeafAccent size={22} rotation={20} style={styles.leafTopRight} />

      <View style={styles.content}>
        <CalHowLogo markSize={40} textSize={theme.fontSize['2xl']} />

        <Text style={styles.tagline}>
          Understand calories.{'\n'}Build a <Text style={styles.taglineAccent}>healthier</Text> you.
        </Text>
      </View>

      <View style={styles.heroWrap}>
        <FoodHeroImage size={320} style={styles.hero} />
      </View>

      <View style={styles.footer}>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.tip}>
          <Text style={styles.tipLabel}>Tip: </Text>
          Small steps every day lead to big changes.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'space-between',
    paddingTop: theme.spacing['4xl'],
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
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  hero: {
    borderTopLeftRadius: theme.radius['2xl'],
    borderTopRightRadius: theme.radius['2xl'],
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
    width: '55%',
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
