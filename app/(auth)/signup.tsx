import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FoodHeroImage } from '@/components/ui/FoodHeroImage';
import { SocialAuthButton } from '@/components/forms/SocialAuthButton';
import { PasswordChecklist } from '@/components/forms/PasswordChecklist';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { signUpWithEmail, SOCIAL_AUTH_ENABLED } from '@/services/auth';
import { theme } from '@/constants/theme';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState(false);

  const passwordValid = password.length >= 8 && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const confirmValid = confirmPassword.length > 0 && confirmPassword === password;

  const formValid = fullName.trim().length > 0 && emailValid && passwordValid && confirmValid;

  const { run: submit, loading, error } = useAsyncAction(async () => {
    setTouched(true);
    if (!formValid) return;
    await signUpWithEmail({ fullName: fullName.trim(), email: email.trim(), password });
    router.replace('/onboarding/goal-setup');
  });

  const fieldErrors = useMemo(() => {
    if (!touched) return {};
    return {
      fullName: fullName.trim().length === 0 ? 'Please enter your name.' : undefined,
      email: !emailValid ? 'Enter a valid email address.' : undefined,
      confirmPassword: !confirmValid ? "Passwords don't match." : undefined,
    };
  }, [touched, fullName, emailValid, confirmValid]);

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} />

      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>
            Create your{'\n'}Cal<Text style={styles.headingAccent}>How</Text> account
          </Text>
          <Text style={styles.subtitle}>
            Join CalHow and take the first step towards a <Text style={styles.subtitleAccent}>healthier</Text> you.
          </Text>
        </View>
        <FoodHeroImage size={100} />
      </View>

      <View style={styles.card}>
        <Input label="Full Name" icon="user" placeholder="Enter your full name" value={fullName} onChangeText={setFullName} error={fieldErrors.fullName} autoCapitalize="words" />
        <Input
          label="Email Address"
          icon="mail"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          error={fieldErrors.email}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <View style={{ gap: theme.spacing.xxs }}>
          <Input
            label="Password"
            icon="lock"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            isPassword
          />
          <PasswordChecklist password={password} />
        </View>
        <Input
          label="Confirm Password"
          icon="lock"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
          error={fieldErrors.confirmPassword}
        />

        {error && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button label="Create Account" onPress={submit} loading={loading} />

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
        <Text style={styles.footerText}>Already have an account? </Text>
        <Text style={styles.footerLink} onPress={() => router.push('/(auth)/login')}>
          Log in →
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  heading: {
    ...theme.text.screenHeading,
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
  card: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadows.card,
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
