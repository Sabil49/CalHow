import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { ProgressSteps } from '@/components/ui/ProgressSteps';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { Button } from '@/components/ui/Button';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useScanSession } from '@/hooks/useScanSession';
import { clarifyMeal, ApiError } from '@/services/api';
import { theme } from '@/constants/theme';

const SCAN_STEPS = [
  { key: 'scan', label: 'Scan' },
  { key: 'analyzing', label: 'AI Analyzing' },
  { key: 'clarify', label: 'Clarify' },
  { key: 'review', label: 'Review' },
  { key: 'result', label: 'Result' },
];

/** Gradates light -> heavy for options like None/Light/Regular/Heavy; cycles if a question has more options. */
const OPTION_ICON_COLORS = [theme.colors.brandPrimary, '#E0A233', '#E0752E', theme.colors.error];

export default function ClarifyScreen() {
  const { clarificationQuestions, clarificationAnswers, setClarificationAnswer, analysisId, applyClarifiedPrediction } =
    useScanSession();
  const [questionIndex, setQuestionIndex] = useState(0);
  const question = clarificationQuestions[questionIndex];

  const existingAnswer = question
    ? clarificationAnswers.find((a) => a.questionId === question.id)?.optionId
    : undefined;
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>(existingAnswer);

  const { run: handleContinue, loading, error } = useAsyncAction(async () => {
    if (!question || !selectedOptionId || !analysisId) return;
    setClarificationAnswer({ questionId: question.id, optionId: selectedOptionId });

    const isLastQuestion = questionIndex === clarificationQuestions.length - 1;
    if (!isLastQuestion) {
      setQuestionIndex((i) => i + 1);
      setSelectedOptionId(undefined);
      return;
    }

    const allAnswers = [
      ...clarificationAnswers.filter((a) => a.questionId !== question.id),
      { questionId: question.id, optionId: selectedOptionId },
    ];
    const response = await clarifyMeal({ analysisId, answers: allAnswers });
    applyClarifiedPrediction(response.prediction);
    router.replace('/scan/review');
  });

  if (!question) {
    // Shouldn't normally happen (analyzing.tsx only routes here when there ARE questions),
    // but fail gracefully rather than showing a blank screen.
    return (
      <ScreenContainer>
        <AppHeader left="back" onLeftPress={() => router.back()} />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No clarification needed.</Text>
          <Button label="Continue to Review" onPress={() => router.replace('/scan/review')} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} />
      <ProgressSteps steps={SCAN_STEPS} currentIndex={2} />

      <Text style={styles.eyebrow}>
        Just {clarificationQuestions.length} quick question{clarificationQuestions.length > 1 ? 's' : ''}!
      </Text>
      <Text style={styles.heading}>
        Help us better understand your <Text style={styles.headingAccent}>meal</Text>
      </Text>
      <Text style={styles.subtitle}>Your answer helps our AI give you more accurate nutrition results.</Text>

      <View style={styles.card}>
        <View style={styles.questionHeader}>
          <View style={styles.questionIconWrap}>
            <Feather name="help-circle" size={18} color={theme.colors.brandDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.questionCounter}>
              Question {questionIndex + 1} of {clarificationQuestions.length}
            </Text>
            <Text style={styles.questionText}>{question.question}</Text>
            {question.helperText && <Text style={styles.questionHelper}>{question.helperText}</Text>}
          </View>
        </View>

        <View style={styles.optionList}>
          {question.options.map((option, index) => (
            <SelectableCard
              key={option.id}
              title={option.label}
              description={option.description}
              selected={selectedOptionId === option.id}
              onPress={() => setSelectedOptionId(option.id)}
              icon="droplet"
              iconColor={OPTION_ICON_COLORS[index % OPTION_ICON_COLORS.length]}
            />
          ))}
        </View>

        <View style={styles.tip}>
          <Feather name="zap" size={14} color={theme.colors.brandDark} />
          <Text style={styles.tipText}>If you're not sure, choose the option that is closest to how it was prepared.</Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button label="Continue" onPress={handleContinue} loading={loading} disabled={!selectedOptionId} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
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
  card: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  questionHeader: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  questionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionCounter: {
    ...theme.text.label,
    color: theme.colors.brandDark,
  },
  questionText: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  questionHelper: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  optionList: {
    gap: theme.spacing.sm,
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
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  emptyText: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
  },
});
