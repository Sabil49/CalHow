import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useScanSession, suggestMealTypeForNow } from '@/hooks/useScanSession';
import { getMealIdeas, ApiError } from '@/services/api';
import type { ScanMenuDish } from '@/types/api';
import { Card } from '@/components/ui/Card';
import { MealThumbnail } from '@/components/ui/MealThumbnail';
import { ProLockedCard } from '@/components/ui/ProLockedCard';
import type { EatNextResult } from '@/utils/eatNext';
import { theme } from '@/constants/theme';
import type { Meal } from '@/types/models';

interface EatNextCardProps {
  isPro: boolean;
  result: EatNextResult;
  onRelog: (meal: Meal) => Promise<void>;
}

/** CalHow Pro "What Should I Eat Next?" card on Home — see utils/eatNext.ts for how suggestions are picked. */
export function EatNextCard({ isPro, result, onRelog }: EatNextCardProps) {
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<ScanMenuDish[] | null>(null);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const { reset, setAnalysis } = useScanSession();

  if (!isPro) {
    return (
      <ProLockedCard
        icon="star"
        title="What Should I Eat Next?"
        description="Get suggestions from meals you've logged before that fit your remaining calories and protein for today — and log them again in one tap."
      />
    );
  }

  /** New ideas from AI + USDA (backend /mealIdeas) — for when past meals don't fit, or for variety. */
  async function handleGetIdeas() {
    setIdeasLoading(true);
    try {
      const response = await getMealIdeas({
        remainingCalories: result.remainingCalories,
        remainingProtein: result.remainingProtein ?? undefined,
        mealType: suggestMealTypeForNow(),
      });
      setIdeas(response.ideas);
    } catch (err) {
      Alert.alert("Couldn't get ideas", err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setIdeasLoading(false);
    }
  }

  function handleLogIdea(idea: ScanMenuDish) {
    if (!idea.analysisId || !idea.prediction) return;
    reset();
    setAnalysis({ analysisId: idea.analysisId, prediction: idea.prediction, clarificationQuestions: idea.clarificationQuestions });
    router.push(idea.needsClarification ? '/scan/clarify' : '/scan/review');
  }

  async function handleRelog(meal: Meal) {
    if (loggingId) return;
    setLoggingId(meal.id);
    try {
      await onRelog(meal);
    } catch {
      Alert.alert("Couldn't log meal", 'Please check your connection and try again.');
    } finally {
      setLoggingId(null);
    }
  }

  const { remainingCalories, remainingProtein, status, suggestions } = result;

  return (
    <Card style={styles.card}>
      <View style={styles.titleRow}>
        <Feather name="star" size={16} color={theme.colors.brandDark} />
        <Text style={styles.cardTitle}>What Should I Eat Next?</Text>
      </View>

      {status === 'goal_reached' ? (
        <Text style={styles.muted}>You've reached your calorie goal for today. Nice work!</Text>
      ) : (
        <>
          <Text style={styles.muted}>
            You have <Text style={styles.accent}>{remainingCalories.toLocaleString()} kcal</Text>
            {remainingProtein != null && remainingProtein > 0 ? (
              <>
                {' '}and <Text style={styles.accent}>{remainingProtein} g protein</Text>
              </>
            ) : null}{' '}
            left today.
          </Text>

          {status === 'no_match' ? (
            <Text style={styles.muted}>
              None of your past meals fit what's left. Tap "Get new meal ideas" for suggestions that do.
            </Text>
          ) : (
            suggestions.map(({ meal, timesLogged }) => (
              <View key={meal.id} style={styles.row}>
                <MealThumbnail imageUri={meal.imageUrl} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealName} numberOfLines={1}>
                    {meal.foods.map((f) => f.name).join(', ')}
                  </Text>
                  <Text style={styles.mealMeta}>
                    {meal.calories.toLocaleString()} kcal · {Math.round(meal.protein)} g protein
                    {timesLogged > 1 ? ` · logged ${timesLogged}×` : ''}
                  </Text>
                </View>
                <Pressable
                  style={styles.logButton}
                  onPress={() => handleRelog(meal)}
                  disabled={loggingId != null}
                  accessibilityRole="button"
                  accessibilityLabel={`Log ${meal.foods.map((f) => f.name).join(', ')} again`}
                >
                  {loggingId === meal.id ? (
                    <ActivityIndicator size="small" color={theme.colors.brandDark} />
                  ) : (
                    <>
                      <Feather name="plus" size={14} color={theme.colors.brandDark} />
                      <Text style={styles.logButtonText}>Log</Text>
                    </>
                  )}
                </Pressable>
              </View>
            ))
          )}
          <Text style={styles.footnote}>Suggestions come from meals you've logged before, with their saved nutrition.</Text>

          {ideas?.map((idea, index) => (
            <View key={`idea-${index}`} style={styles.row}>
              <View style={styles.ideaIcon}>
                <Feather name="zap" size={16} color={theme.colors.brandDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealName} numberOfLines={1}>
                  {idea.name}
                </Text>
                {idea.prediction && (
                  <Text style={styles.mealMeta}>
                    {Math.round(idea.prediction.calories).toLocaleString()} kcal · {Math.round(idea.prediction.protein)} g protein
                  </Text>
                )}
              </View>
              <Pressable style={styles.logButton} onPress={() => handleLogIdea(idea)} accessibilityRole="button" accessibilityLabel={`Log ${idea.name}`}>
                <Feather name="plus" size={14} color={theme.colors.brandDark} />
                <Text style={styles.logButtonText}>Log</Text>
              </Pressable>
            </View>
          ))}
          {ideas && ideas.length > 0 && (
            <Text style={styles.footnote}>New ideas are AI suggestions; their nutrition is calculated from USDA FoodData Central. You can adjust them before saving.</Text>
          )}
          <Button
            label={ideas ? 'Get different ideas' : 'Get new meal ideas'}
            icon="zap"
            variant="ghost"
            onPress={handleGetIdeas}
            loading={ideasLoading}
          />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: theme.spacing.md,
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
  accent: {
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.brandDark,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  mealName: {
    ...theme.text.body,
    color: theme.colors.textPrimary,
  },
  mealMeta: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 60,
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.brandPrimary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  logButtonText: {
    ...theme.text.caption,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.brandDark,
  },
  ideaIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footnote: {
    ...theme.text.caption,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
});
