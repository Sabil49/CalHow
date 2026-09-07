import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface Requirement {
  label: string;
  met: boolean;
}

export function PasswordChecklist({ password }: { password: string }) {
  const requirements: Requirement[] = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One number', met: /\d/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <View style={styles.row}>
      {requirements.map((req) => (
        <View key={req.label} style={styles.item}>
          <Feather
            name="check-circle"
            size={13}
            color={req.met ? theme.colors.success : theme.colors.textMuted}
          />
          <Text style={[styles.label, req.met && styles.labelMet]}>{req.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  labelMet: {
    color: theme.colors.success,
  },
});
