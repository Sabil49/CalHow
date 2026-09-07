import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { ProgressSteps } from '@/components/ui/ProgressSteps';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { Button } from '@/components/ui/Button';
import { LeafAccent } from '@/components/ui/LeafAccent';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { updateUserProfile } from '@/services/firestore';
import { theme } from '@/constants/theme';
import { ACTIVITY_OPTIONS, GOAL_OPTIONS } from '@/constants/goalOptions';
import type { ActivityLevel, GoalType } from '@/types/models';

const ONBOARDING_STEPS = [
  { key: 'goal', label: 'Goal Setup' },
  { key: 'personal', label: 'Personal Details' },
  { key: 'target', label: 'Target Setup' },
  { key: 'done', label: 'Almost Done' },
];

export default function GoalSetupScreen() {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [goalType, setGoalType] = useState<GoalType>(profile?.goals?.goalType ?? 'lose_weight');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    profile?.goals?.activityLevel ?? 'sedentary',
  );

  const { run: handleContinue, loading } = useAsyncAction(async () => {
    if (!user) return;
    await updateUserProfile(user.uid, {
      goals: { ...profile?.goals, goalType, activityLevel },
    });
    router.push('/onboarding/personal-details');
  });

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile={false} />
      <LeafAccent style={styles.leaf} />

      <ProgressSteps steps={ONBOARDING_STEPS} currentIndex={0} variant="numbered" />

      <Text style={styles.stepLabel}>Step 1 of 4</Text>
      <Text style={styles.heading}>
        What's your main <Text style={styles.headingAccent}>goal?</Text>
      </Text>
      <Text style={styles.subtitle}>
        Choose the goal that matters most to you. We'll personalize your plan accordingly.
      </Text>

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

      <Text style={styles.sectionHeading}>How active are you?</Text>
      <Text style={styles.sectionSubtitle}>This helps us estimate your daily calorie needs.</Text>

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

      <View style={styles.tip}>
        <Feather name="zap" size={16} color={theme.colors.brandDark} />
        <Text style={styles.tipText}>You can always change your goal or activity level later in your profile settings.</Text>
      </View>

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
  stepLabel: {
    ...theme.text.label,
    color: theme.colors.brandDark,
    marginTop: theme.spacing.xl,
  },
  heading: {
    ...theme.text.screenHeading,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xxs,
  },
  headingAccent: {
    color: theme.colors.brandPrimary,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  gridItem: {
    width: '47%',
  },
  sectionHeading: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing['2xl'],
  },
  sectionSubtitle: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  activityList: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  tipText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  footer: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
});
