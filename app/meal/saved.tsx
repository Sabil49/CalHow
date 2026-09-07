import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NutritionMetric } from '@/components/nutrition/NutritionMetric';
import { useAuth } from '@/hooks/useAuth';
import { useScanSession } from '@/hooks/useScanSession';
import { getMeal } from '@/services/firestore';
import { generateMealInsight } from '@/utils/mealInsights';
import { theme } from '@/constants/theme';
import type { Meal } from '@/types/models';

export default function MealSavedScreen() {
  const { user } = useAuth();
  const { savedMealId, reset } = useScanSession();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user || !savedMealId) {
        setLoading(false);
        return;
      }
      const result = await getMeal(user.uid, savedMealId);
      if (!cancelled) {
        setMeal(result);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, savedMealId]);

  function handleDone() {
    reset();
    router.replace('/(tabs)');
  }

  if (loading) {
    return (
      <ScreenContainer>
        <AppHeader left="back" onLeftPress={handleDone} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.brandPrimary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!meal) {
    return (
      <ScreenContainer>
        <AppHeader left="back" onLeftPress={handleDone} />
        <View style={styles.loadingWrap}>
          <Text style={styles.notFoundText}>We couldn't find that meal.</Text>
          <Button label="Back to Home" onPress={handleDone} />
        </View>
      </ScreenContainer>
    );
  }

  const insight = generateMealInsight(meal);
  const dateLabel = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(meal.loggedAt);
  const timeLabel = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(meal.loggedAt);

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={handleDone} showProfile />

      <View style={styles.checkWrap}>
        <View style={styles.checkCircle}>
          <Feather name="check" size={32} color={theme.colors.success} />
        </View>
      </View>
      <Text style={styles.heading}>
        Your meal has been <Text style={styles.headingAccent}>saved!</Text>
      </Text>
      <Text style={styles.subtitle}>Great choice! You're one step closer to your health goals.</Text>

      <Card style={styles.savedToCard}>
        <View style={styles.savedToRow}>
          <View style={styles.savedToIcon}>
            <Feather name="bookmark" size={16} color={theme.colors.brandDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.savedToLabel}>Meal saved to</Text>
            <Text style={styles.savedToValue}>Today</Text>
            <View style={styles.dateRow}>
              <Feather name="calendar" size={12} color={theme.colors.textSecondary} />
              <Text style={styles.dateText}>
                {dateLabel} • {timeLabel}
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.addAnotherButton}
            onPress={() => Alert.alert('Add to another meal or day', 'Coming soon.')}
          >
            <Feather name="plus" size={14} color={theme.colors.brandDark} />
            <Text style={styles.addAnotherText}>Add to another meal or day</Text>
          </Pressable>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Meal summary</Text>
        <View style={styles.nutritionRow}>
          <NutritionMetric kind="calories" value={`${Math.round(meal.calories)}`} label="Calories" />
          <NutritionMetric kind="carbs" value={`${Math.round(meal.carbs)} g`} label="Carbs" />
          <NutritionMetric kind="fats" value={`${Math.round(meal.fats)} g`} label="Fats" />
          <NutritionMetric kind="protein" value={`${Math.round(meal.protein)} g`} label="Protein" />
          {meal.fiber != null && <NutritionMetric kind="fiber" value={`${Math.round(meal.fiber)} g`} label="Fiber" />}
        </View>
        <View style={styles.tip}>
          <Feather name="zap" size={14} color={theme.colors.brandDark} />
          <Text style={styles.tipText}>{insight}</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>What's next?</Text>
        <NextStepRow icon="bar-chart-2" title="View your progress" subtitle="See how you're doing" onPress={() => router.push('/(tabs)/progress')} />
        <NextStepRow icon="clock" title="Check today's summary" subtitle="See your daily intake" onPress={() => router.push('/(tabs)')} />
        <NextStepRow
          icon="plus"
          title="Scan another meal"
          subtitle="Keep tracking your meals"
          onPress={() => {
            reset();
            router.replace('/scan/camera');
          }}
        />
      </Card>

      <View style={styles.footer}>
        <Button label="Done" icon="check" onPress={handleDone} />
      </View>
    </ScreenContainer>
  );
}

function NextStepRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.nextStepRow} onPress={onPress}>
      <View style={styles.nextStepIcon}>
        <Feather name={icon} size={16} color={theme.colors.brandDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.nextStepTitle}>{title}</Text>
        <Text style={styles.nextStepSubtitle}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={theme.colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  notFoundText: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
  },
  checkWrap: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    ...theme.text.screenHeading,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  headingAccent: {
    color: theme.colors.success,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  savedToCard: {
    marginTop: theme.spacing.xl,
  },
  savedToRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  savedToIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedToLabel: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  savedToValue: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  addAnotherText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.brandDark,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
  card: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cardTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  nutritionRow: {
    flexDirection: 'row',
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
  nextStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  nextStepIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextStepTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  nextStepSubtitle: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  footer: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
});
