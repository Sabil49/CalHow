import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { Button } from '@/components/ui/Button';
import { TargetsSection } from '@/components/goals/TargetsSection';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { updateUserProfile } from '@/services/firestore';
import { ACTIVITY_OPTIONS, GOAL_OPTIONS } from '@/constants/goalOptions';
import {
  calculateAge,
  estimateDailyCalorieTarget,
  estimateGoalDate,
  estimateMacroTargets,
} from '@/utils/nutrition';
import { theme } from '@/constants/theme';
import type { ActivityLevel, GoalType } from '@/types/models';

/**
 * Reuses the exact same calculation helpers as onboarding's Target Setup
 * (utils/nutrition.ts) — there is only one calorie/macro estimation
 * system in this app, and this screen doesn't reimplement it.
 */
export default function GoalsScreen() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const currentWeightKg = profile?.currentWeightKg ?? 70;

  const [goalType, setGoalType] = useState<GoalType>(profile?.goals?.goalType ?? 'lose_weight');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile?.goals?.activityLevel ?? 'sedentary');
  const [targetWeightKg, setTargetWeightKg] = useState(
    profile?.goals?.targetWeightKg ? String(profile.goals.targetWeightKg) : String(currentWeightKg),
  );
  const [weeklyPaceKg, setWeeklyPaceKg] = useState(profile?.goals?.weeklyPaceKg ?? 0.25);

  const isPaceRelevant = goalType === 'lose_weight' || goalType === 'build_muscle';
  const targetWeightNumber = Number(targetWeightKg) || currentWeightKg;

  const dailyCalorieTarget = useMemo(
    () =>
      estimateDailyCalorieTarget({
        gender: profile?.gender,
        heightCm: profile?.heightCm,
        weightKg: currentWeightKg,
        age: calculateAge(profile?.dateOfBirth),
        activityLevel,
        goalType,
        weeklyPaceKg,
      }),
    [profile, currentWeightKg, goalType, activityLevel, weeklyPaceKg],
  );

  const goalDate = useMemo(
    () => (isPaceRelevant ? estimateGoalDate(currentWeightKg, targetWeightNumber, weeklyPaceKg) : undefined),
    [isPaceRelevant, currentWeightKg, targetWeightNumber, weeklyPaceKg],
  );

  const { run: handleSave, loading, error } = useAsyncAction(async () => {
    if (!user) return;
    await updateUserProfile(user.uid, {
      goals: {
        goalType,
        activityLevel,
        targetWeightKg: isPaceRelevant ? targetWeightNumber : currentWeightKg,
        weeklyPaceKg: isPaceRelevant ? weeklyPaceKg : undefined,
        dailyCalorieTarget,
        macroTargets: estimateMacroTargets(dailyCalorieTarget),
      },
    });
    router.back();
  });

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <Text style={styles.heading}>Goals</Text>
      <Text style={styles.subtitle}>Update your goal, activity level and targets any time.</Text>

      <Text style={styles.sectionHeading}>Main goal</Text>
      <View style={styles.grid}>
        {GOAL_OPTIONS.map((option) => (
          <SelectableCard
            key={option.value}
            layout="column"
            style={styles.gridItem}
            selected={goalType === option.value}
            onPress={() => setGoalType(option.value)}
            icon={option.icon}
            iconColor={option.color}
            title={option.title}
            description={option.description}
          />
        ))}
      </View>

      <Text style={styles.sectionHeading}>Activity level</Text>
      <View style={styles.activityList}>
        {ACTIVITY_OPTIONS.map((option) => (
          <SelectableCard
            key={option.value}
            layout="row"
            indicator="check"
            selected={activityLevel === option.value}
            onPress={() => setActivityLevel(option.value)}
            icon={option.icon}
            iconColor={option.color}
            title={option.title}
            description={option.description}
          />
        ))}
      </View>

      <TargetsSection
        goalType={goalType}
        targetWeightKg={targetWeightKg}
        onTargetWeightChange={setTargetWeightKg}
        weeklyPaceKg={weeklyPaceKg}
        onWeeklyPaceChange={setWeeklyPaceKg}
        dailyCalorieTarget={dailyCalorieTarget}
        goalDate={goalDate}
        preferredUnit={profile?.preferredUnit ?? 'metric'}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.footer}>
        <Button label="Save Goals" icon="check" onPress={handleSave} loading={loading} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...theme.text.screenHeading,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xl,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  sectionHeading: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  gridItem: {
    width: '47%',
  },
  activityList: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  errorText: {
    ...theme.text.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
  footer: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
});
