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
 * V1 placeholder. No support email, help-center URL, or live-chat
 * integration has been configured for this project, so none is
 * fabricated here — each row below says so plainly instead of linking to
 * a made-up address.
 */
export default function HelpSupportScreen() {
  const { profile } = useUserProfile();

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <Text style={styles.heading}>Help & Support</Text>
      <Text style={styles.subtitle}>Get help with CalHow.</Text>

      <Card style={styles.card}>
        <InfoRow icon="mail" title="Email support" subtitle="Not configured yet" />
        <InfoRow icon="message-circle" title="Live chat" subtitle="Not configured yet" />
        <InfoRow icon="help-circle" title="FAQ / Help Center" subtitle="Not configured yet" />
      </Card>

      <View style={styles.note}>
        <Feather name="info" size={14} color={theme.colors.brandDark} />
        <Text style={styles.noteText}>
          This screen is a placeholder. Add a real support email, help center URL, or chat integration here before
          release.
        </Text>
      </View>
    </ScreenContainer>
  );
}

function InfoRow({ icon, title, subtitle }: { icon: keyof typeof Feather.glyphMap; title: string; subtitle: string }) {
  return (
    <View style={styles.row}>
      <Feather name={icon} size={18} color={theme.colors.textMuted} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
    </View>
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
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  rowTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  rowSubtitle: {
    ...theme.text.caption,
    color: theme.colors.textMuted,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  noteText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
});
