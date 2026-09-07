import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NutritionMetric } from '@/components/nutrition/NutritionMetric';
import { DetectedFoodRow } from '@/components/meal/DetectedFoodRow';
import { MealTotalsCard } from '@/components/meal/MealTotalsCard';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useScanSession, suggestMealTypeForNow } from '@/hooks/useScanSession';
import { saveMeal, logCorrection } from '@/services/firestore';
import { persistMealImage } from '@/services/mealImagePersistence';
import { diffFoodCorrections } from '@/utils/mealCorrections';
import { generateMealInsight } from '@/utils/mealInsights';
import { DEFAULT_CALORIE_GOAL } from '@/utils/nutrition';
import { theme } from '@/constants/theme';

export default function ResultScreen() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { foods, finalTotals, prediction, clarificationAnswers, mealType, imageBase64, mimeType, analysisId, quota, setSavedMealId } =
    useScanSession();

  const calorieGoal = profile?.goals?.dailyCalorieTarget ?? DEFAULT_CALORIE_GOAL;

  // finalTotals is written by review.tsx only after recalculateMeal succeeds.
  // Use a zero-filled placeholder solely so useMemo deps below are always defined
  // (Rules of Hooks — no conditional hook calls). The guard below prevents any
  // zero-calorie data from actually being saved or rendered as valid results.
  const totals = finalTotals ?? { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: undefined };

  const macroShares = useMemo(() => {
    const totalMacroCalories = totals.protein * 4 + totals.carbs * 4 + totals.fats * 9;
    if (totalMacroCalories <= 0) return { carbs: 0, protein: 0, fats: 0 };
    return {
      carbs: Math.round(((totals.carbs * 4) / totalMacroCalories) * 100),
      protein: Math.round(((totals.protein * 4) / totalMacroCalories) * 100),
      fats: Math.round(((totals.fats * 9) / totalMacroCalories) * 100),
    };
  }, [totals]);

  const insight = useMemo(() => generateMealInsight(totals), [totals]);

  const { run: handleSave, loading, error } = useAsyncAction(async () => {
    if (!user || !prediction || !finalTotals) return;
    const finalMealType = mealType ?? suggestMealTypeForNow();
    const persistedImageUrl =
      imageBase64 && mimeType && analysisId ? await persistMealImage(imageBase64, mimeType, analysisId) : undefined;

    const mealId = await saveMeal(user.uid, {
      userId: user.uid,
      mealType: finalMealType,
      imageUrl: persistedImageUrl,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fats: totals.fats,
      fiber: totals.fiber,
      foods,
      aiPrediction: prediction,
      clarificationAnswers: clarificationAnswers.length > 0 ? clarificationAnswers : undefined,
      userCorrections:
        JSON.stringify(foods) !== JSON.stringify(prediction.foods)
          ? { foods, calories: totals.calories, protein: totals.protein, carbs: totals.carbs, fats: totals.fats, fiber: totals.fiber }
          : undefined,
      confidence: prediction.confidence,
      isSaved: true,
      loggedAt: new Date(),
    });

    const corrections = diffFoodCorrections(prediction.foods, foods);
    await Promise.all(
      corrections.map((c) => logCorrection(user.uid, { ...c, userId: user.uid, mealId })),
    );

    setSavedMealId(mealId);
    router.replace('/meal/saved');
  });

  // Guard: all hooks called above — safe to conditionally return now.
  // finalTotals absent means review.tsx never completed recalculation.
  if (!finalTotals) {
    return (
      <ScreenContainer>
        <AppHeader left="back" onLeftPress={() => router.replace('/scan/review')} />
        <View style={styles.errorWrap}>
          <View style={styles.errorIcon}>
            <Feather name="alert-triangle" size={28} color={theme.colors.error} />
          </View>
          <Text style={styles.errorTitle}>Nutrition not yet calculated</Text>
          <Text style={styles.errorBody}>
            Please confirm your meal items on the Review screen before saving.
          </Text>
          <Button label="Back to Review" icon="arrow-left" onPress={() => router.replace('/scan/review')} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile />

      <View style={styles.eyebrowRow}>
        <Feather name="check-circle" size={14} color={theme.colors.success} />
        <Text style={styles.eyebrow}>Scan completed!</Text>
      </View>
      <Text style={styles.heading}>Here's your meal analysis</Text>
      <Text style={styles.subtitle}>
        We found {foods.length} item{foods.length === 1 ? '' : 's'} and calculated the nutrition for you.
      </Text>
      {quota?.entitlement === 'free' && quota.scansRemainingToday != null && (
        <View style={styles.quotaRow}>
          <Feather name="zap" size={12} color={theme.colors.textSecondary} />
          <Text style={styles.quotaText}>
            {quota.scansRemainingToday > 0
              ? `${quota.scansRemainingToday} free scan${quota.scansRemainingToday === 1 ? '' : 's'} left today`
              : "That was your last free scan today — upgrade to CalHow Pro for unlimited scans"}
          </Text>
        </View>
      )}

      <View style={styles.totalsCardWrap}>
        <MealTotalsCard
          calories={totals.calories}
          carbs={totals.carbs}
          protein={totals.protein}
          fats={totals.fats}
          fiber={totals.fiber}
          calorieGoal={calorieGoal}
        />
      </View>

      <Card style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Detected food items</Text>
          <View style={styles.itemsBadge}>
            <Text style={styles.itemsBadgeText}>{foods.length} items found</Text>
          </View>
        </View>
        {foods.map((food) => (
          <DetectedFoodRow key={food.id} food={food} />
        ))}
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Nutrition summary</Text>
        </View>
        <View style={styles.nutritionRow}>
          <NutritionMetric kind="calories" value={`${Math.round(totals.calories)}`} label="Calories" />
          <NutritionMetric kind="carbs" value={`${Math.round(totals.carbs)} g`} label="Carbs" helperText={`${macroShares.carbs}%`} />
          <NutritionMetric kind="fats" value={`${Math.round(totals.fats)} g`} label="Fats" helperText={`${macroShares.fats}%`} />
          <NutritionMetric kind="protein" value={`${Math.round(totals.protein)} g`} label="Protein" helperText={`${macroShares.protein}%`} />
          {totals.fiber != null && (
            <NutritionMetric kind="fiber" value={`${Math.round(totals.fiber)} g`} label="Fiber" />
          )}
        </View>
        <View style={styles.tip}>
          <Feather name="zap" size={14} color={theme.colors.brandDark} />
          <Text style={styles.tipText}>{insight}</Text>
        </View>
      </Card>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.buttonRow}>
        <Button label="Scan Another" variant="outline" icon="camera" onPress={() => router.replace('/scan/camera')} style={{ flex: 1 }} />
        <Button label="Save Meal" variant="solid" icon="check-circle" onPress={handleSave} loading={loading} style={{ flex: 1 }} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.xl,
  },
  eyebrow: {
    ...theme.text.label,
    color: theme.colors.success,
  },
  heading: {
    ...theme.text.screenHeading,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xxs,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  quotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xxs,
    marginTop: theme.spacing.xs,
  },
  quotaText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  totalsCardWrap: {
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
    marginBottom: theme.spacing.sm,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
  },
  tipText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  errorText: {
    ...theme.text.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  errorTitle: {
    ...theme.text.sectionHeading,
    color: theme.colors.textPrimary,
  },
  errorBody: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
});
