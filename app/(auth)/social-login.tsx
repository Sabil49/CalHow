import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Button } from '@/components/ui/Button';
import { FoodHeroImage } from '@/components/ui/FoodHeroImage';
import { HeroGlow } from '@/components/ui/HeroGlow';
import { LeafAccent } from '@/components/ui/LeafAccent';
import { PrivacyNote } from '@/components/ui/PrivacyNote';
import { SocialAuthButton } from '@/components/forms/SocialAuthButton';
import { useSocialAuth } from '@/hooks/useSocialAuth';
import { theme } from '@/constants/theme';

export default function SocialLoginScreen() {
  const { signInWithGoogle, signInWithApple, googleLoading, appleLoading, appleAvailable, error } = useSocialAuth();

  async function handleGoogle() {
    if (await signInWithGoogle()) router.replace('/');
  }
  async function handleApple() {
    if (await signInWithApple()) router.replace('/');
  }

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} />

      <View style={styles.heroRow}>
        <View style={styles.heroTextCol}>
          <Text style={styles.heading}>Let's get{'\n'}you started</Text>
          <Text style={styles.subtitle}>
            Sign in or create an account to personalize your <Text style={styles.subtitleAccent}>nutrition journey</Text>.
          </Text>
        </View>
        <View style={styles.heroWrap}>
          <HeroGlow size={160} style={styles.heroGlow} />
          <FoodHeroImage size={110} />
        </View>
      </View>

      <LeafAccent style={styles.leaf} rotation={15} />

      <View style={styles.card}>
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialList}>
          <SocialAuthButton provider="google" onPress={handleGoogle} loading={googleLoading} disabled={appleLoading} />
          {appleAvailable && (
            <SocialAuthButton provider="apple" onPress={handleApple} loading={appleLoading} disabled={googleLoading} />
          )}
        </View>
        {error && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          label="Continue with Email"
          variant="outline"
          icon="mail"
          onPress={() => router.push('/(auth)/signup')}
        />
      </View>

      <PrivacyNote text="We respect your privacy and keep your data safe and secure." />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: -25,
    left: -25,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  heroTextCol: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  heading: {
    ...theme.text.displayHeading,
    fontSize: theme.fontSize['3xl'],
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
  },
  subtitleAccent: {
    color: theme.colors.brandPrimary,
  },
  leaf: {
    alignSelf: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  card: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  socialList: {
    gap: theme.spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
  },
  errorText: {
    ...theme.text.caption,
    color: theme.colors.error,
    flex: 1,
  },
});
