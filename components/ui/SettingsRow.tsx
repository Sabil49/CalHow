import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface SettingsRowProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  trailingText?: string;
  onPress: () => void;
  danger?: boolean;
  /** Not built yet — renders dimmed with a "Coming soon" badge instead of the chevron, and isn't pressable. */
  disabled?: boolean;
}

export function SettingsRow({ icon, title, subtitle, trailingText, onPress, danger = false, disabled = false }: SettingsRowProps) {
  return (
    <Pressable style={[styles.row, disabled && styles.rowDisabled]} onPress={disabled ? undefined : onPress} disabled={disabled}>
      <Feather name={icon} size={18} color={danger ? theme.colors.error : disabled ? theme.colors.textMuted : theme.colors.brandDark} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, danger && styles.titleDanger, disabled && styles.titleDisabled]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {disabled ? (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming soon</Text>
        </View>
      ) : (
        <>
          {trailingText && <Text style={styles.trailingText}>{trailingText}</Text>}
          {!danger && <Feather name="chevron-right" size={16} color={theme.colors.textMuted} />}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  title: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  titleDanger: {
    color: theme.colors.error,
  },
  titleDisabled: {
    color: theme.colors.textSecondary,
  },
  subtitle: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  trailingText: {
    ...theme.text.caption,
    color: theme.colors.brandDark,
  },
  comingSoonBadge: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  comingSoonText: {
    ...theme.text.caption,
    fontSize: 10,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.textSecondary,
  },
});
