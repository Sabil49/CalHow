import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordChecklist } from '@/components/forms/PasswordChecklist';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { changePassword, isPasswordProvider } from '@/services/auth';
import { theme } from '@/constants/theme';

export default function ChangePasswordScreen() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const canChangePassword = !!user && isPasswordProvider(user);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const newPasswordValid = newPassword.length >= 8 && /\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);
  const confirmValid = confirmPassword.length > 0 && confirmPassword === newPassword;
  const formValid = currentPassword.length > 0 && newPasswordValid && confirmValid;

  const { run: handleSave, loading, error } = useAsyncAction(async () => {
    if (!formValid) return;
    await changePassword(currentPassword, newPassword);
    router.back();
  });

  if (!canChangePassword) {
    return (
      <ScreenContainer>
        <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />
        <View style={styles.unavailableWrap}>
          <Feather name="lock" size={28} color={theme.colors.textMuted} />
          <Text style={styles.unavailableTitle}>Not available for your sign-in method</Text>
          <Text style={styles.unavailableBody}>
            Your account isn't signed in with email/password, so there's no CalHow password to change.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <Text style={styles.heading}>Change Password</Text>
      <Text style={styles.subtitle}>Enter your current password, then choose a new one.</Text>

      <View style={styles.card}>
        <Input label="Current Password" icon="lock" placeholder="Enter your current password" value={currentPassword} onChangeText={setCurrentPassword} isPassword />

        <View style={{ gap: theme.spacing.xxs }}>
          <Input label="New Password" icon="lock" placeholder="Create a new password" value={newPassword} onChangeText={setNewPassword} isPassword />
          <PasswordChecklist password={newPassword} />
        </View>

        <Input
          label="Confirm New Password"
          icon="lock"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
          error={confirmPassword.length > 0 && !confirmValid ? "Passwords don't match." : undefined}
        />

        {error && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button label="Update Password" icon="check" onPress={handleSave} loading={loading} disabled={!formValid} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...theme.text.screenHeading,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xl,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  card: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
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
  unavailableWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  unavailableTitle: {
    ...theme.text.sectionHeading,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  unavailableBody: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
