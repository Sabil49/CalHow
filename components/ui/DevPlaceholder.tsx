import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContainer } from './ScreenContainer';
import { theme } from '@/constants/theme';

/**
 * TEMPORARY placeholder screen body. Every route currently rendering this
 * will be replaced screen-by-screen in the upcoming build batches (see
 * project plan). It exists only so the navigation graph is complete and
 * every route is reachable/testable today.
 */
export function DevPlaceholder({ title }: { title: string }) {
  return (
    <ScreenContainer>
      <Text style={styles.eyebrow}>Coming in a later batch</Text>
      <Text style={styles.title}>{title}</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...theme.text.label,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xl,
  },
  title: {
    ...theme.text.screenHeading,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
  },
});
