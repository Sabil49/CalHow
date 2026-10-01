import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { Button } from '@/components/ui/Button';
import { TargetsSection } from '@/components/goals/TargetsSection';
import { CustomTargetsCard, type CustomTargetsValues } from '@/components/goals/CustomTargetsCard';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { updateUserProfile } from '@/services/firestore';
import { ACTIVITY_OPTIONS, GOAL_OPTIONS } from '@/constants/goalOptions';
import {
  calculateAge,
  checkCustomTargets,
  estimateCalorieTargetOutlook,
  estimateMaintenanceCalories,
  estimateDailyCalorieTarget,
  estimateGoalDate,
  estimateMacroTargets,
} from '@/utils/nutrition';
import { kgToLb } from '@/utils/units';
import { theme } from '@/constants/theme';
import type { ActivityLevel, GoalType, UserGoals } from '@/types/models';

/** Blank means "not entered" (NaN, which checkCustomTargets rejects) — plain Number('') would silently be 0. */
function parseTarget(text: string): number {
  return text.trim() === '' ? NaN : Number(text);
}

function toCustomValues(calories: number, macros: NonNullable<UserGoals['macroTargets']>): CustomTargetsValues {
  return {
    calories: String(calories),
    proteinG: String(macros.proteinG),
    carbsG: String(macros.carbsG),
    fatsG: String(macros.fatsG),
    fiberG: macros.fiberG != null ? String(macros.fiberG) : '',
  };
}

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

  // Custom Goals & Macros (CalHow Pro) — see components/goals/CustomTargetsCard.tsx.
  const isPro = useFeatureGate('customGoalsAndMacros');
  const savedGoals = profile?.goals;
  const [customEnabled, setCustomEnabled] = useState(savedGoals?.customTargets ?? false);
  const [customValues, setCustomValues] = useState<CustomTargetsValues>(() =>
    savedGoals?.customTargets && savedGoals.dailyCalorieTarget && savedGoals.macroTargets
      ? toCustomValues(savedGoals.dailyCalorieTarget, savedGoals.macroTargets)
      : toCustomValues(dailyCalorieTarget, estimateMacroTargets(dailyCalorieTarget)),
  );
  const customCheck = useMemo(
    () =>
      checkCustomTargets({
        calories: parseTarget(customValues.calories),
        proteinG: parseTarget(customValues.proteinG),
        carbsG: parseTarget(customValues.carbsG),
        fatsG: parseTarget(customValues.fatsG),
      }),
    [customValues],
  );
  const useCustom = isPro && customEnabled;

  // How the custom calories get the user to their goal (see utils/nutrition.ts).
  const customOutlook = useMemo(() => {
    const calories = parseTarget(customValues.calories);
    if (!Number.isFinite(calories)) return undefined;
    const maintenanceCalories = estimateMaintenanceCalories({
      gender: profile?.gender,
      heightCm: profile?.heightCm,
      weightKg: currentWeightKg,
      age: calculateAge(profile?.dateOfBirth),
      activityLevel,
    });
    return estimateCalorieTargetOutlook({
      calories,
      maintenanceCalories,
      currentWeightKg,
      targetWeightKg: isPaceRelevant ? targetWeightNumber : undefined,
    });
  }, [customValues.calories, profile, currentWeightKg, activityLevel, isPaceRelevant, targetWeightNumber]);
  const targetWeightLabel =
    profile?.preferredUnit === 'imperial' ? `${kgToLb(targetWeightNumber).toFixed(0)} lb` : `${targetWeightNumber} kg`;

  function resetCustomValues() {
    setCustomValues(toCustomValues(dailyCalorieTarget, estimateMacroTargets(dailyCalorieTarget)));
  }

  function handleCustomEnabledChange(enabled: boolean) {
    // Turning custom targets on for the first time starts from the current
    // recommendation rather than whatever was prefilled when the screen mounted.
    if (enabled && !savedGoals?.customTargets) resetCustomValues();
    setCustomEnabled(enabled);
  }

  const goalDate = useMemo(
    () => (isPaceRelevant ? estimateGoalDate(currentWeightKg, targetWeightNumber, weeklyPaceKg) : undefined),
    [isPaceRelevant, currentWeightKg, targetWeightNumber, weeklyPaceKg],
  );

  const { run: handleSave, loading, error } = useAsyncAction(async () => {
    if (!user) return;
    if (useCustom && customCheck.errors.length > 0) {
      throw new Error(customCheck.errors[0]);
    }
    // A user who isn't (or is no longer) Pro saves the recommended targets,
    // which also turns custom targets off.
    await updateUserProfile(user.uid, {
      goals: {
        goalType,
        activityLevel,
        targetWeightKg: isPaceRelevant ? targetWeightNumber : currentWeightKg,
        weeklyPaceKg: isPaceRelevant ? weeklyPaceKg : undefined,
        customTargets: useCustom,
        dailyCalorieTarget: useCustom ? Math.round(Number(customValues.calories)) : dailyCalorieTarget,
        macroTargets: useCustom
          ? {
              proteinG: Math.round(Number(customValues.proteinG)),
              carbsG: Math.round(Number(customValues.carbsG)),
              fatsG: Math.round(Number(customValues.fatsG)),
              fiberG: customValues.fiberG.trim() ? Math.round(Number(customValues.fiberG)) : undefined,
            }
          : estimateMacroTargets(dailyCalorieTarget),
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

      <CustomTargetsCard
        isPro={isPro}
        enabled={customEnabled}
        onEnabledChange={handleCustomEnabledChange}
        values={customValues}
        onValuesChange={setCustomValues}
        check={customCheck}
        onReset={resetCustomValues}
        outlook={customOutlook}
        targetWeightLabel={isPaceRelevant ? targetWeightLabel : undefined}
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
