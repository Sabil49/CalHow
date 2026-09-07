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
}

export function SettingsRow({ icon, title, subtitle, trailingText, onPress, danger = false }: SettingsRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Feather name={icon} size={18} color={danger ? theme.colors.error : theme.colors.brandDark} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, danger && styles.titleDanger]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {trailingText && <Text style={styles.trailingText}>{trailingText}</Text>}
      {!danger && <Feather name="chevron-right" size={16} color={theme.colors.textMuted} />}
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
  title: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  titleDanger: {
    color: theme.colors.error,
  },
  subtitle: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  trailingText: {
    ...theme.text.caption,
    color: theme.colors.brandDark,
  },
});
