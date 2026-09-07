import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Card } from '@/components/ui/Card';
import { FoodHeroImage } from '@/components/ui/FoodHeroImage';
import { NutritionMetric } from '@/components/nutrition/NutritionMetric';
import { DetectedFoodRow } from '@/components/meal/DetectedFoodRow';
import { MealTotalsCard } from '@/components/meal/MealTotalsCard';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getMeal } from '@/services/firestore';
import { DEFAULT_CALORIE_GOAL } from '@/utils/nutrition';
import { theme } from '@/constants/theme';
import type { Meal, MealType } from '@/types/models';

const MEAL_TYPE_ICON: Record<MealType, keyof typeof Feather.glyphMap> = {
  breakfast: 'sunrise',
  lunch: 'sun',
  dinner: 'sunset',
  snack: 'moon',
};

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

/**
 * Read-only meal detail view. Loaded strictly via
 * `getMeal(currentUser.uid, id)`, which reads from
 * `users/{currentUser.uid}/meals/{id}` — there is no code path here (or in
 * services/firestore.ts) that can read another user's meal subcollection,
 * so a mealId that doesn't belong to the signed-in user simply resolves as
 * "not found" rather than exposing someone else's data.
 *
 * Shows the meal's FINAL confirmed values (the top-level Meal fields,
 * which reflect the user's saved/corrected totals) — never
 * `meal.aiPrediction`, which is preserved separately as the original,
 * untouched AI output for future Smart Meal Memory use.
 */
export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, initializing: authInitializing } = useAuth();
  const { profile } = useUserProfile();

  const [meal, setMeal] = useState<Meal | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (authInitializing) return;
      if (!user || !id) {
        if (!cancelled) setState('not-found');
        return;
      }
      setState('loading');
      try {
        const result = await getMeal(user.uid, id);
        if (cancelled) return;
        if (!result) {
          setState('not-found');
        } else {
          setMeal(result);
          setState('ready');
        }
      } catch {
        if (!cancelled) setState('error');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, id, authInitializing]);

  if (state === 'loading') {
    return (
      <ScreenContainer>
        <AppHeader left="back" onLeftPress={() => router.back()} />
        <View style={styles.centerWrap}>
          <ActivityIndicator color={theme.colors.brandPrimary} />
        </View>
      </ScreenContainer>
    );
  }

  if (state === 'not-found') {
    return (
      <ScreenContainer>
        <AppHeader left="back" onLeftPress={() => router.back()} />
        <View style={styles.centerWrap}>
          <View style={styles.stateIconWrap}>
            <Feather name="search" size={24} color={theme.colors.textMuted} />
          </View>
          <Text style={styles.stateTitle}>Meal not found</Text>
          <Text style={styles.stateBody}>
            This meal may have been deleted, or it doesn't belong to your account.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (state === 'error' || !meal) {
    return (
      <ScreenContainer>
        <AppHeader left="back" onLeftPress={() => router.back()} />
        <View style={styles.centerWrap}>
          <View style={[styles.stateIconWrap, styles.stateIconWrapError]}>
            <Feather name="alert-triangle" size={24} color={theme.colors.error} />
          </View>
          <Text style={styles.stateTitle}>Couldn't load this meal</Text>
          <Text style={styles.stateBody}>Please check your connection and try again.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const calorieGoal = profile?.goals?.dailyCalorieTarget ?? DEFAULT_CALORIE_GOAL;
  const dateLabel = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(meal.loggedAt);
  const timeLabel = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(meal.loggedAt);
  const mealTypeLabel = meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1);
  const mealTitle = meal.foods[0]?.name ?? 'Meal';

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <FoodHeroImage imageUri={meal.imageUrl} width="100%" height={200} style={styles.hero} />

      <View style={styles.metaRow}>
        <View style={styles.mealTypeBadge}>
          <Feather name={MEAL_TYPE_ICON[meal.mealType]} size={12} color={theme.colors.brandDark} />
          <Text style={styles.mealTypeText}>{mealTypeLabel}</Text>
        </View>
        {meal.confidence != null && (
          <View style={styles.confidenceBadge}>
            <Feather name="bar-chart-2" size={12} color={theme.colors.brandDark} />
            <Text style={styles.confidenceBadgeText}>{Math.round(meal.confidence * 100)}% confidence</Text>
          </View>
        )}
      </View>

      <Text style={styles.heading} numberOfLines={2}>
        {mealTitle}
      </Text>
      <View style={styles.dateRow}>
        <Feather name="calendar" size={13} color={theme.colors.textSecondary} />
        <Text style={styles.dateText}>
          {dateLabel} • {timeLabel}
        </Text>
      </View>

      <View style={styles.totalsWrap}>
        <MealTotalsCard
          calories={meal.calories}
          carbs={meal.carbs}
          protein={meal.protein}
          fats={meal.fats}
          fiber={meal.fiber}
          calorieGoal={calorieGoal}
        />
      </View>

      <Card style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Detected food items</Text>
          <View style={styles.itemsBadge}>
            <Text style={styles.itemsBadgeText}>
              {meal.foods.length} item{meal.foods.length === 1 ? '' : 's'}
            </Text>
          </View>
        </View>
        {meal.foods.map((food) => (
          <DetectedFoodRow key={food.id} food={food} />
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Nutrition</Text>
        <View style={styles.nutritionRow}>
          <NutritionMetric kind="calories" value={`${Math.round(meal.calories)}`} label="Calories" />
          <NutritionMetric kind="carbs" value={`${Math.round(meal.carbs)} g`} label="Carbs" />
          <NutritionMetric kind="fats" value={`${Math.round(meal.fats)} g`} label="Fats" />
          <NutritionMetric kind="protein" value={`${Math.round(meal.protein)} g`} label="Protein" />
          {meal.fiber != null && <NutritionMetric kind="fiber" value={`${Math.round(meal.fiber)} g`} label="Fiber" />}
        </View>
      </Card>

      {meal.userCorrections && (
        <View style={styles.correctionNote}>
          <Feather name="edit-2" size={13} color={theme.colors.brandDark} />
          <Text style={styles.correctionNoteText}>
            You edited this meal's detected items or totals after scanning — the values above reflect your final version.
          </Text>
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  stateIconWrap: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.palette.ink100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  stateIconWrapError: {
    backgroundColor: theme.colors.errorBg,
  },
  stateTitle: {
    ...theme.text.sectionHeading,
    color: theme.colors.textPrimary,
  },
  stateBody: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  hero: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.xl,
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  mealTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  mealTypeText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.brandDark,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.palette.ink100,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  confidenceBadgeText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  heading: {
    ...theme.text.screenHeading,
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.xxs,
  },
  dateText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  totalsWrap: {
    marginTop: theme.spacing.lg,
  },
  card: {
    marginTop: theme.spacing.md,
    gap: 0,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  cardTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  itemsBadge: {
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  itemsBadgeText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.brandDark,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
  nutritionRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.xs,
  },
  correctionNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  correctionNoteText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  bottomSpacer: {
    height: theme.spacing.lg,
  },
});
