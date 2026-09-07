import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { ProgressSteps } from '@/components/ui/ProgressSteps';
import { Button } from '@/components/ui/Button';
import { LeafAccent } from '@/components/ui/LeafAccent';
import { TargetsSection } from '@/components/goals/TargetsSection';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { updateUserProfile } from '@/services/firestore';
import {
  calculateAge,
  estimateDailyCalorieTarget,
  estimateGoalDate,
  estimateMacroTargets,
} from '@/utils/nutrition';
import { theme } from '@/constants/theme';

const ONBOARDING_STEPS = [
  { key: 'goal', label: 'Goal Setup' },
  { key: 'personal', label: 'Personal Details' },
  { key: 'target', label: 'Target Setup' },
  { key: 'done', label: 'Almost Done' },
];

export default function TargetSetupScreen() {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const goalType = profile?.goals?.goalType ?? 'lose_weight';
  const isPaceRelevant = goalType === 'lose_weight' || goalType === 'build_muscle';
  const isGaining = goalType === 'build_muscle';
  const currentWeightKg = profile?.currentWeightKg ?? 70;

  const [targetWeightKg, setTargetWeightKg] = useState(
    profile?.goals?.targetWeightKg
      ? String(profile.goals.targetWeightKg)
      : String(Math.round((isGaining ? currentWeightKg + 3 : currentWeightKg - 5) * 10) / 10),
  );
  const [weeklyPaceKg, setWeeklyPaceKg] = useState(profile?.goals?.weeklyPaceKg ?? 0.25);

  const targetWeightNumber = Number(targetWeightKg) || currentWeightKg;

  const dailyCalorieTarget = useMemo(
    () =>
      estimateDailyCalorieTarget({
        gender: profile?.gender,
        heightCm: profile?.heightCm,
        weightKg: currentWeightKg,
        age: calculateAge(profile?.dateOfBirth),
        activityLevel: profile?.goals?.activityLevel,
        goalType,
        weeklyPaceKg,
      }),
    [profile, currentWeightKg, goalType, weeklyPaceKg],
  );

  const goalDate = useMemo(
    () => (isPaceRelevant ? estimateGoalDate(currentWeightKg, targetWeightNumber, weeklyPaceKg) : undefined),
    [isPaceRelevant, currentWeightKg, targetWeightNumber, weeklyPaceKg],
  );

  const { run: handleContinue, loading } = useAsyncAction(async () => {
    if (!user) return;
    await updateUserProfile(user.uid, {
      goals: {
        ...profile?.goals,
        goalType,
        activityLevel: profile?.goals?.activityLevel ?? 'sedentary',
        targetWeightKg: isPaceRelevant ? targetWeightNumber : currentWeightKg,
        weeklyPaceKg: isPaceRelevant ? weeklyPaceKg : undefined,
        dailyCalorieTarget,
        macroTargets: estimateMacroTargets(dailyCalorieTarget),
      },
      onboardingComplete: true,
    });
    router.replace('/(tabs)');
  });

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} />
      <LeafAccent style={styles.leaf} />

      <ProgressSteps steps={ONBOARDING_STEPS} currentIndex={2} variant="numbered" />

      <Text style={styles.heading}>Let's set your targets</Text>
      <Text style={styles.subtitle}>
        These targets help us create a realistic plan to <Text style={styles.subtitleAccent}>reach your goal</Text>.
      </Text>

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

      <View style={styles.footer}>
        <Button label="Continue" onPress={handleContinue} loading={loading} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  leaf: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.lg,
  },
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
  subtitleAccent: {
    color: theme.colors.brandPrimary,
  },
  footer: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
});
