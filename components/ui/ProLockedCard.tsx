import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';

interface ProLockedCardProps {
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  style?: StyleProp<ViewStyle>;
}

/** What a free user sees in place of a CalHow Pro feature: what it does, and a way to the paywall. */
export function ProLockedCard({ title, description, icon, style }: ProLockedCardProps) {
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.titleRow}>
        <View style={styles.iconWrap}>
          <Feather name={icon} size={16} color={theme.colors.brandDark} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.proBadge}>
          <Feather name="lock" size={11} color={theme.colors.brandDark} />
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
      </View>
      <Text style={styles.description}>{description}</Text>
      <Button label="Unlock with CalHow Pro" variant="outline" icon="star" onPress={() => router.push('/paywall')} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  proBadgeText: {
    ...theme.text.caption,
    fontSize: 10,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.brandDark,
  },
  description: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
});
