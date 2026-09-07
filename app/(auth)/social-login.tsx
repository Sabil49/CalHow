import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Button } from '@/components/ui/Button';
import { FoodHeroImage } from '@/components/ui/FoodHeroImage';
import { LeafAccent } from '@/components/ui/LeafAccent';
import { PrivacyNote } from '@/components/ui/PrivacyNote';
import { SocialAuthButton } from '@/components/forms/SocialAuthButton';
import { SOCIAL_AUTH_ENABLED } from '@/services/auth';
import { theme } from '@/constants/theme';

export default function SocialLoginScreen() {
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
        <FoodHeroImage size={110} />
      </View>

      <LeafAccent style={styles.leaf} rotation={15} />

      <View style={styles.card}>
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialList}>
          <SocialAuthButton provider="google" onPress={() => {}} disabled={!SOCIAL_AUTH_ENABLED} />
          <SocialAuthButton provider="apple" onPress={() => {}} disabled={!SOCIAL_AUTH_ENABLED} />
          <SocialAuthButton provider="facebook" onPress={() => {}} disabled={!SOCIAL_AUTH_ENABLED} />
        </View>
        {!SOCIAL_AUTH_ENABLED && <Text style={styles.socialNote}>Social sign-in is coming soon — use email for now.</Text>}

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
  socialNote: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
