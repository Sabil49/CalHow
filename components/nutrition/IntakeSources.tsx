import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getCitation, type CitationId } from '@/constants/citations';
import { theme } from '@/constants/theme';

interface IntakeSourcesProps {
  /**
   * Where the goal shown comes from: the FDA 2,000 kcal reference default,
   * CalHow's personal estimate (Mifflin-St Jeor), or targets a Pro user
   * entered themselves (only the ranges and food data still apply).
   */
  goalSource: 'default' | 'personal' | 'custom';
}

const IDS_BY_SOURCE: Record<IntakeSourcesProps['goalSource'], CitationId[]> = {
  default: ['defaultGoal', 'macros', 'foodData'],
  personal: ['bmr', 'activity', 'macros', 'foodData'],
  custom: ['macros', 'foodData'],
};

/**
 * Inline, tappable citations for the calorie goal and macro percentages on
 * Home's "Today's intake" card — App Store guideline 1.4.1 requires the
 * source of health recommendations to be easy to find, so these link
 * straight to the external source from the card itself, plus a link to the
 * full Sources & Citations screen.
 */
export function IntakeSources({ goalSource }: IntakeSourcesProps) {
  const ids = IDS_BY_SOURCE[goalSource];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Feather name="book-open" size={12} color={theme.colors.textMuted} />
        <Text style={styles.headerText}>Sources for these recommendations</Text>
      </View>
      {ids.map((id) => {
        const citation = getCitation(id);
        return (
          <Pressable
            key={id}
            style={styles.linkRow}
            onPress={() => Linking.openURL(citation.url).catch(() => {})}
            accessibilityRole="link"
            accessibilityLabel={`${citation.title}: ${citation.sourceLabel}`}
          >
            <Feather name="external-link" size={11} color={theme.colors.brandDark} />
            <Text style={styles.linkText}>
              <Text style={styles.linkTitle}>{citation.title}: </Text>
              {citation.sourceLabel}
            </Text>
          </Pressable>
        );
      })}
      <Pressable style={styles.linkRow} onPress={() => router.push('/settings/sources')} accessibilityRole="link">
        <Feather name="info" size={11} color={theme.colors.textMuted} />
        <Text style={styles.allSourcesText}>How is this calculated? All Sources & Citations</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerText: {
    ...theme.text.caption,
    fontSize: 11,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.textSecondary,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  linkText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.brandDark,
    textDecorationLine: 'underline',
    flex: 1,
  },
  linkTitle: {
    fontFamily: theme.fontFamily.sansSemiBold,
  },
  allSourcesText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
    textDecorationLine: 'underline',
    flex: 1,
  },
});
