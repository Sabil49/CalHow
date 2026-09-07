import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FoodHeroImage } from '@/components/ui/FoodHeroImage';
import { LeafAccent } from '@/components/ui/LeafAccent';
import { SocialAuthButton } from '@/components/forms/SocialAuthButton';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { loginWithEmail, sendPasswordReset, SOCIAL_AUTH_ENABLED } from '@/services/auth';
import { theme } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const { run: submit, loading, error } = useAsyncAction(async () => {
    await loginWithEmail(email.trim(), password);
    // Let app/index.tsx's auth-state redirect decide where to land
    // (Home vs. onboarding), rather than duplicating that logic here.
    router.replace('/');
  });

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'Type your email address above first, then tap "Forgot password?" again.');
      return;
    }
    try {
      await sendPasswordReset(email.trim());
      Alert.alert('Check your inbox', `We sent a password reset link to ${email.trim()}.`);
    } catch (err) {
      Alert.alert('Something went wrong', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} />

      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>
            Welcome{'\n'}
            <Text style={styles.headingAccent}>back!</Text>
          </Text>
          <Text style={styles.subtitle}>
            Log in to continue your <Text style={styles.subtitleAccent}>nutrition</Text> journey.
          </Text>
        </View>
        <LeafAccent style={styles.leaf} />
      </View>

      <FoodHeroImage size={130} style={styles.hero} />

      <View style={styles.card}>
        <Input
          label="Email Address"
          icon="mail"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View>
          <View style={styles.passwordLabelRow}>
            <Text style={styles.passwordLabel}>Password</Text>
            <Text style={styles.forgotLink} onPress={handleForgotPassword}>
              Forgot password?
            </Text>
          </View>
          <Input placeholder="Enter your password" value={password} onChangeText={setPassword} isPassword />
        </View>

        <Pressable style={styles.rememberRow} onPress={() => setRememberMe((v) => !v)}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Feather name="check" size={12} color={theme.colors.textInverse} />}
          </View>
          <Text style={styles.rememberText}>Remember me</Text>
        </Pressable>

        {error && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button label="Log In" onPress={submit} loading={loading} />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.circleRow}>
          <SocialAuthButton provider="google" variant="circle" onPress={() => {}} disabled={!SOCIAL_AUTH_ENABLED} />
          <SocialAuthButton provider="apple" variant="circle" onPress={() => {}} disabled={!SOCIAL_AUTH_ENABLED} />
          <SocialAuthButton provider="facebook" variant="circle" onPress={() => {}} disabled={!SOCIAL_AUTH_ENABLED} />
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Text style={styles.footerLink} onPress={() => router.push('/(auth)/signup')}>
          Sign up →
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.spacing.md,
  },
  heading: {
    ...theme.text.displayHeading,
    fontSize: theme.fontSize['3xl'],
    color: theme.colors.textPrimary,
  },
  headingAccent: {
    color: theme.colors.brandPrimary,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  subtitleAccent: {
    color: theme.colors.brandPrimary,
  },
  leaf: {
    marginTop: theme.spacing.xs,
  },
  hero: {
    alignSelf: 'flex-end',
    marginTop: -theme.spacing.xl,
  },
  card: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xxs,
  },
  passwordLabel: {
    ...theme.text.label,
    color: theme.colors.textPrimary,
  },
  forgotLink: {
    ...theme.text.label,
    color: theme.colors.brandDark,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.brandPrimary,
    borderColor: theme.colors.brandPrimary,
  },
  rememberText: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
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
  circleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xl,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  footerText: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
  },
  footerLink: {
    ...theme.text.bodyMedium,
    color: theme.colors.brandDark,
  },
});
