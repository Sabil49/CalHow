import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { ProgressSteps } from '@/components/ui/ProgressSteps';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NutritionMetric } from '@/components/nutrition/NutritionMetric';
import { useScanSession } from '@/hooks/useScanSession';
import { analyzeMeal, ApiError } from '@/services/api';
import { theme } from '@/constants/theme';

const SCAN_STEPS = [
  { key: 'scan', label: 'Scan' },
  { key: 'analyzing', label: 'AI Analyzing' },
  { key: 'clarify', label: 'Clarify' },
  { key: 'review', label: 'Review' },
  { key: 'result', label: 'Result' },
];

const STAGES = [
  { key: 'scan_image', title: 'Scanning image', description: 'Enhancing and preparing your photo', icon: 'camera' as const, threshold: 20 },
  { key: 'detect_items', title: 'Detecting food items', description: 'Finding and identifying the food', icon: 'search' as const, threshold: 50 },
  { key: 'analyze_ingredients', title: 'Analyzing ingredients', description: 'Understanding ingredients and portions', icon: 'zap' as const, threshold: 80 },
  { key: 'calc_nutrition', title: 'Calculating nutrition', description: 'Calculating calories and nutrients', icon: 'bar-chart-2' as const, threshold: 100 },
];

export default function AnalyzingScreen() {
  const { imageBase64, mimeType, setAnalysis } = useScanSession();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let navigateTimeout: ReturnType<typeof setTimeout> | undefined;
    doneRef.current = false;
    setError(null);
    setProgress(0);

    // Purely a loading-state animation — eases toward 90% while the real
    // request is in flight. It is NOT tied to fabricated intermediate
    // results; detected items / nutrition below only render once the
    // actual API response arrives.
    const tick = setInterval(() => {
      if (cancelled) return;
      setProgress((p) => (doneRef.current ? p : Math.min(90, p + Math.random() * 6 + 2)));
    }, 250);

    async function run() {
      if (!imageBase64) {
        if (!cancelled) setError('No photo found. Please go back and scan your meal again.');
        return;
      }
      if (!mimeType) {
        if (!cancelled) setError('Image type could not be determined. Please go back and scan your meal again.');
        return;
      }
      try {
        const response = await analyzeMeal({ imageBase64, mimeType });
        if (cancelled) return;
        doneRef.current = true;
        setProgress(100);
        setAnalysis({
          analysisId: response.analysisId,
          prediction: response.prediction,
          clarificationQuestions: response.clarificationQuestions,
          quota: response.quota,
        });
        navigateTimeout = setTimeout(() => {
          if (cancelled) return;
          router.replace(response.needsClarification ? '/scan/clarify' : '/scan/review');
        }, 700);
      } catch (err) {
        if (cancelled) return;
        doneRef.current = true;
        // The backend is the sole source of truth for the free-tier scan
        // limit (see calhow-backend/services/usage/scanLimit.ts) — this
        // app never decides "you're out of scans" itself. When the
        // backend says so, send the user straight to the existing Pro
        // paywall instead of showing a generic network/server error.
        if (err instanceof ApiError && err.code === 'scan_limit_reached') {
          router.replace('/paywall');
          return;
        }
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Something went wrong while analyzing your meal. Please try again.');
        }
      }
    }
    run();

    return () => {
      cancelled = true;
      clearInterval(tick);
      if (navigateTimeout) clearTimeout(navigateTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  if (error) {
    return (
      <ScreenContainer>
        <AppHeader left="back" onLeftPress={() => router.back()} />
        <View style={styles.errorWrap}>
          <View style={styles.errorIcon}>
            <Feather name="alert-triangle" size={28} color={theme.colors.error} />
          </View>
          <Text style={styles.errorTitle}>Couldn't analyze your meal</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Button label="Try Again" onPress={() => setAttempt((a) => a + 1)} icon="refresh-cw" />
          <Button label="Cancel" variant="ghost" icon={null} onPress={() => router.replace('/(tabs)')} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} />
      <ProgressSteps steps={SCAN_STEPS} currentIndex={1} />

      <Text style={styles.heading}>
        AI is analyzing your <Text style={styles.headingAccent}>meal</Text>...
      </Text>
      <Text style={styles.subtitle}>
        Our AI is identifying the food items, analyzing ingredients and calculating nutrition.
      </Text>

      <View style={styles.topRow}>
        <ProgressRing progress={progress} size={150} strokeWidth={10}>
          <Feather name="cpu" size={28} color={theme.colors.brandPrimary} />
          <Text style={styles.percentText}>{Math.round(progress)}%</Text>
          <Text style={styles.percentLabel}>Analyzing...</Text>
        </ProgressRing>

        <Card style={styles.stagesCard}>
          <Text style={styles.stagesTitle}>What we're doing</Text>
          {STAGES.map((stage) => {
            const complete = progress >= stage.threshold;
            const active = !complete && progress >= stage.threshold - 20;
            return (
              <View key={stage.key} style={styles.stageRow}>
                <View style={[styles.stageIcon, complete && styles.stageIconDone]}>
                  <Feather name={stage.icon} size={14} color={complete ? theme.colors.textInverse : theme.colors.brandDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stageTitle}>{stage.title}</Text>
                  <Text style={styles.stageDescription}>{stage.description}</Text>
                </View>
                {complete ? (
                  <Feather name="check-circle" size={16} color={theme.colors.success} />
                ) : active ? (
                  <Feather name="loader" size={16} color={theme.colors.warning} />
                ) : null}
              </View>
            );
          })}
        </Card>
      </View>

      <Card style={styles.nutritionCard}>
        <View style={styles.nutritionHeader}>
          <Text style={styles.nutritionTitle}>Estimated nutrition (so far)</Text>
        </View>
        <View style={styles.nutritionRow}>
          <NutritionMetric kind="calories" value="—" label="Calories" />
          <NutritionMetric kind="carbs" value="—" label="Carbs" />
          <NutritionMetric kind="fats" value="—" label="Fats" />
          <NutritionMetric kind="protein" value="—" label="Protein" />
          <NutritionMetric kind="fiber" value="—" label="Fiber" />
        </View>
        <Text style={styles.nutritionHint}>
          {progress < 100 ? 'Almost there! AI is finalizing the nutrition details.' : 'Done!'}
        </Text>
      </Card>

      <View style={styles.tip}>
        <Feather name="camera" size={16} color={theme.colors.brandDark} />
        <Text style={styles.tipText}>For best results, use clear photos in good lighting with all food visible.</Text>
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
  headingAccent: {
    color: theme.colors.brandPrimary,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  percentText: {
    fontFamily: theme.fontFamily.serifBold,
    fontSize: theme.fontSize.xl,
    color: theme.colors.textPrimary,
    marginTop: 4,
  },
  percentLabel: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  stagesCard: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  stagesTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  stageIcon: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageIconDone: {
    backgroundColor: theme.colors.success,
  },
  stageTitle: {
    ...theme.text.caption,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.textPrimary,
  },
  stageDescription: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  nutritionCard: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  nutritionRow: {
    flexDirection: 'row',
  },
  nutritionHint: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  tipText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flex: 1,
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
