import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

export function PrivacyNote({ text }: { text: string }) {
  return (
    <View style={styles.row}>
      <Feather name="shield" size={14} color={theme.colors.brandPrimary} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xxs,
    paddingVertical: theme.spacing.sm,
  },
  text: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
