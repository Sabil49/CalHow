import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Card } from '@/components/ui/Card';
import { useUserProfile } from '@/hooks/useUserProfile';
import { theme } from '@/constants/theme';

/**
 * PLACEHOLDER. No real Terms of Use has been drafted or supplied for
 * CalHow. Do not treat the text below as legally binding — replace this
 * entire screen's content (or point it at a hosted URL) with real,
 * lawyer-reviewed Terms of Use before release.
 */
export default function TermsScreen() {
  const { profile } = useUserProfile();

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <Text style={styles.heading}>Terms & Policies</Text>
      <Text style={styles.subtitle}>Terms of Use</Text>

      <Card style={styles.placeholderCard}>
        <Feather name="file-text" size={24} color={theme.colors.textMuted} />
        <Text style={styles.placeholderTitle}>Terms of Use not yet available</Text>
        <Text style={styles.placeholderBody}>
          This is a placeholder screen. CalHow's real Terms of Use text (or a link to a hosted version) needs to be
          supplied here before this app is released to users.
        </Text>
      </Card>

      <Card style={styles.linkCard}>
        <Text style={styles.linkText} onPress={() => router.push('/settings/privacy')}>
          View Privacy Policy →
        </Text>
      </Card>
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
  placeholderCard: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  placeholderTitle: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
  },
  placeholderBody: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  linkCard: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    ...theme.text.bodyMedium,
    color: theme.colors.brandDark,
  },
});
