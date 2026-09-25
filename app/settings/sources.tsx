import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Card } from '@/components/ui/Card';
import { useUserProfile } from '@/hooks/useUserProfile';
import { theme } from '@/constants/theme';
import { CITATIONS } from '@/constants/citations';

export default function SourcesScreen() {
  const { profile } = useUserProfile();

  function openSource(url: string) {
    Linking.openURL(url).catch(() => {});
  }

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <Text style={styles.heading}>Sources & Citations</Text>
      <Text style={styles.subtitle}>
        Where the calorie, macro and pace numbers CalHow shows you come from.
      </Text>

      <Card style={styles.noticeCard}>
        <Feather name="info" size={16} color={theme.colors.brandDark} />
        <Text style={styles.noticeText}>
          These are general estimates based on public health formulas and guidance, not a medical calculation.
          They don't account for medical conditions, medications or individual health history — talk to a doctor
          or registered dietitian before making significant changes to your diet.
        </Text>
      </Card>

      {CITATIONS.map((citation) => (
        <Card key={citation.id} style={styles.card}>
          <Text style={styles.cardTitle}>{citation.title}</Text>
          <Text style={styles.cardBody}>{citation.body}</Text>
          <Pressable style={styles.sourceRow} onPress={() => openSource(citation.url)}>
            <Feather name="external-link" size={14} color={theme.colors.brandDark} />
            <Text style={styles.sourceText}>{citation.sourceLabel}</Text>
          </Pressable>
        </Card>
      ))}

      <View style={styles.footer} />
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
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.brandTint,
  },
  noticeText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  card: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  cardTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  cardBody: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sourceText: {
    ...theme.text.caption,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.brandDark,
  },
  footer: {
    marginBottom: theme.spacing.lg,
  },
});
