import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProLockedCard } from '@/components/ui/ProLockedCard';
import { getMealInsights, ApiError } from '@/services/api';
import { theme } from '@/constants/theme';
import type { MealInsight, MealInsightKind } from '@/types/models';

interface MealInsightsCardProps {
  mealId: string;
  isPro: boolean;
  /** Insights already cached on the meal, shown without another request. */
  initialInsights?: MealInsight[];
}

const KIND_STYLE: Record<MealInsightKind, { icon: keyof typeof Feather.glyphMap; color: string }> = {
  positive: { icon: 'thumbs-up', color: theme.colors.success },
  suggestion: { icon: 'zap', color: theme.colors.brandDark },
  watch: { icon: 'eye', color: theme.colors.warning },
};

/**
 * CalHow Pro "AI Meal Insights" on the meal detail screen. Generated on
 * request (not on every open) and cached server-side on the meal, so each
 * meal costs at most one AI call until its totals change.
 */
export function MealInsightsCard({ mealId, isPro, initialInsights }: MealInsightsCardProps) {
  const [insights, setInsights] = useState<MealInsight[] | undefined>(initialInsights?.length ? initialInsights : undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isPro) {
    return (
      <ProLockedCard
        icon="zap"
        title="AI Meal Insights"
        description="Get personalized notes on this meal — what it did well and ideas for the rest of your day, based on your goals."
      />
    );
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const result = await getMealInsights(mealId);
      setInsights(result.insights);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'pro_required') {
        setError("We couldn't confirm your CalHow Pro subscription. Try Restore Purchases on the Pro screen.");
      } else {
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.titleRow}>
        <Feather name="zap" size={16} color={theme.colors.brandDark} />
        <Text style={styles.cardTitle}>AI Meal Insights</Text>
      </View>

      {insights ? (
        insights.map((insight, index) => {
          const kind = KIND_STYLE[insight.kind] ?? KIND_STYLE.suggestion;
          return (
            <View key={index} style={styles.insightRow}>
              <View style={[styles.insightIcon, { borderColor: kind.color }]}>
                <Feather name={kind.icon} size={12} color={kind.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightBody}>{insight.body}</Text>
              </View>
            </View>
          );
        })
      ) : (
        <>
          <Text style={styles.muted}>Get personalized notes on this meal, based on your goals and the rest of your day.</Text>
          <Button label="Get AI Insights" icon="zap" variant="outline" onPress={handleGenerate} loading={loading} />
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.disclaimer}>
        AI-generated from this meal's nutrition and your targets. General wellness information, not medical advice.
      </Text>
      <Pressable onPress={() => router.push('/settings/sources')} hitSlop={6} accessibilityRole="link">
        <Text style={styles.sourcesLink}>How your targets are calculated: Sources & Citations</Text>
      </Pressable>
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
    gap: theme.spacing.xs,
  },
  cardTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  muted: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  insightIcon: {
    width: 26,
    height: 26,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  insightTitle: {
    ...theme.text.body,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.textPrimary,
  },
  insightBody: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  error: {
    ...theme.text.caption,
    color: theme.colors.error,
  },
  disclaimer: {
    ...theme.text.caption,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  sourcesLink: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
    textDecorationLine: 'underline',
  },
});
