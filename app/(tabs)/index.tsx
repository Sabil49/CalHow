import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Card } from '@/components/ui/Card';
import { ProgressRing, ProgressRingLabel } from '@/components/ui/ProgressRing';
import { NutritionMetric } from '@/components/nutrition/NutritionMetric';
import { FoodHeroImage } from '@/components/ui/FoodHeroImage';
import { ScanFoodButton } from '@/components/meal/ScanFoodButton';
import { MealListItem } from '@/components/meal/MealListItem';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTodayMeals } from '@/hooks/useTodayMeals';
import { DEFAULT_CALORIE_GOAL, getGreeting } from '@/utils/nutrition';
import { theme } from '@/constants/theme';
export default function HomeScreen() {
  const { profile } = useUserProfile();
  const { meals, totals, loading } = useTodayMeals();

  const firstName = profile?.fullName?.split(' ')[0] || 'there';
  const calorieGoal = profile?.goals?.dailyCalorieTarget ?? DEFAULT_CALORIE_GOAL;
  const macroGoals = profile?.goals?.macroTargets;

  const percentOfGoal = calorieGoal > 0 ? Math.min(100, Math.round((totals.calories / calorieGoal) * 100)) : 0;
  const caloriesLeft = Math.max(0, calorieGoal - totals.calories);

  const macroPercent = (value: number, goal?: number) => (goal ? Math.round((value / goal) * 100) : undefined);

  return (
    <ScreenContainer>
      <AppHeader
        left="menu"
        onLeftPress={() => router.push('/(tabs)/profile')}
        showProfile
        avatarUrl={profile?.photoUrl}
        onAvatarPress={() => router.push('/(tabs)/profile')}
      />

      <Text style={styles.greeting}>
        {getGreeting()}, {firstName} 👋
      </Text>
      <Text style={styles.heading}>
        Let's check your <Text style={styles.headingUnderline}>meal together</Text>
      </Text>

      <View style={styles.heroWrap}>
        <FoodHeroImage width="100%" height={220} style={styles.hero} />
        <View style={styles.scanButtonWrap}>
          <ScanFoodButton onPress={() => router.push('/scan/camera')} />
        </View>
      </View>

      <Card style={styles.intakeCard}>
        <View style={styles.intakeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.intakeLabel}>Today's intake</Text>
            <View style={styles.intakeValueRow}>
              <Text style={styles.intakeValue}>{totals.calories.toLocaleString()}</Text>
              <Text style={styles.intakeGoal}> / {calorieGoal.toLocaleString()} kcal</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percentOfGoal}%` }]} />
            </View>
            <Text style={styles.caloriesLeft}>{caloriesLeft.toLocaleString()} kcal left</Text>
          </View>
          <ProgressRing progress={percentOfGoal} size={88} strokeWidth={8}>
            <ProgressRingLabel value={`${percentOfGoal}%`} label="of goal" />
          </ProgressRing>
        </View>
      </Card>

      <Card style={styles.macroCard}>
        <NutritionMetric
          kind="carbs"
          value={`${Math.round(totals.carbs)} g`}
          label="Carbs"
          helperText={macroPercent(totals.carbs, macroGoals?.carbsG) != null ? `${macroPercent(totals.carbs, macroGoals?.carbsG)}%` : undefined}
        />
        <NutritionMetric
          kind="fats"
          value={`${Math.round(totals.fats)} g`}
          label="Fats"
          helperText={macroPercent(totals.fats, macroGoals?.fatsG) != null ? `${macroPercent(totals.fats, macroGoals?.fatsG)}%` : undefined}
        />
        <NutritionMetric
          kind="protein"
          value={`${Math.round(totals.protein)} g`}
          label="Protein"
          helperText={macroPercent(totals.protein, macroGoals?.proteinG) != null ? `${macroPercent(totals.protein, macroGoals?.proteinG)}%` : undefined}
        />
      </Card>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Today's meals</Text>
        <Text style={styles.seeAll} onPress={() => router.push('/(tabs)/history')}>
          See all →
        </Text>
      </View>

      {!loading && meals.length === 0 && (
        <Card tinted style={styles.emptyState}>
          <Feather name="camera" size={20} color={theme.colors.brandDark} />
          <Text style={styles.emptyStateText}>
            No meals logged yet today. Tap "Scan Food" above to log your first meal.
          </Text>
        </Card>
      )}

      {meals.map((meal) => (
        <MealListItem
          key={meal.id}
          imageUri={meal.imageUrl}
          title={meal.foods[0]?.name ? `${meal.foods[0].name}${meal.foods.length > 1 ? ' + more' : ''}` : 'Meal'}
          subtitle={mealTypeLabel(meal.mealType)}
          kcal={meal.calories}
          onPress={() => router.push(`/meal/${meal.id}`)}
          rightAccessory={<Feather name="chevron-right" size={18} color={theme.colors.textMuted} />}
        />
      ))}
    </ScreenContainer>
  );
}

function mealTypeLabel(mealType: string): string {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

const styles = StyleSheet.create({
  greeting: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  heading: {
    ...theme.text.screenHeading,
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xxs,
  },
  headingUnderline: {
    color: theme.colors.brandPrimary,
    textDecorationLine: 'underline',
  },
  heroWrap: {
    marginTop: theme.spacing.lg,
    position: 'relative',
  },
  hero: {},
  scanButtonWrap: {
    position: 'absolute',
    bottom: -30,
    left: -theme.spacing.sm,
  },
  intakeCard: {
    // The floating ScanFoodButton (130px, positioned bottom:-30 relative
    // to heroWrap) extends 30px below the hero photo's bottom edge —
    // this margin must clear that plus real breathing room, or the
    // button's shadow visually collides with this card's top edge.
    marginTop: theme.spacing['4xl'],
  },
  intakeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  intakeLabel: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  intakeValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  intakeValue: {
    fontFamily: theme.fontFamily.serifBold,
    fontSize: theme.fontSize['3xl'],
    color: theme.colors.textPrimary,
  },
  intakeGoal: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
  },
  progressTrack: {
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
    marginTop: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandPrimary,
  },
  caloriesLeft: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  macroCard: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing['2xl'],
  },
  sectionHeading: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
  },
  seeAll: {
    ...theme.text.label,
    color: theme.colors.brandDark,
  },
  emptyState: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  emptyStateText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
});
