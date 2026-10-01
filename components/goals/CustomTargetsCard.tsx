import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatShortDate, type CalorieTargetOutlook, type CustomTargetsCheck } from '@/utils/nutrition';
import { theme } from '@/constants/theme';

export interface CustomTargetsValues {
  calories: string;
  proteinG: string;
  carbsG: string;
  fatsG: string;
  fiberG: string;
}

interface CustomTargetsCardProps {
  isPro: boolean;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  values: CustomTargetsValues;
  onValuesChange: (values: CustomTargetsValues) => void;
  /** Result of checkCustomTargets on `values` — owned by the caller so Save can be blocked on the same errors shown here. */
  check: CustomTargetsCheck;
  /** Refills every field from the current recommended targets. */
  onReset: () => void;
  /** What the entered calories mean for the user's weight; undefined while the calories are invalid. */
  outlook?: CalorieTargetOutlook;
  /** Shown with the outlook, when the goal has a target weight. */
  targetWeightLabel?: string;
}

/** "You'd lose about 0.4 kg a week …" — how a custom target gets the user to their goal. */
function OutlookNote({ outlook, targetWeightLabel }: { outlook: CalorieTargetOutlook; targetWeightLabel?: string }) {
  const { weeklyChangeKg, maintenanceCalories, goalDate } = outlook;
  const pace = Math.abs(weeklyChangeKg).toFixed(Math.abs(weeklyChangeKg) < 0.1 ? 2 : 1);
  const direction =
    weeklyChangeKg === 0 ? 'keep your weight about the same' : `${weeklyChangeKg < 0 ? 'lose' : 'gain'} about ${pace} kg a week`;
  return (
    <View style={styles.outlook}>
      <Feather name="trending-up" size={14} color={theme.colors.brandDark} />
      <Text style={styles.outlookText}>
        At this target you'd <Text style={styles.outlookAccent}>{direction}</Text> (your estimated maintenance is{' '}
        {maintenanceCalories.toLocaleString()} kcal/day).
        {goalDate && targetWeightLabel ? (
          <>
            {' '}You'd reach {targetWeightLabel} around <Text style={styles.outlookAccent}>{formatShortDate(goalDate)}</Text>.
          </>
        ) : null}
      </Text>
    </View>
  );
}

/**
 * "Custom Goals & Macros" (CalHow Pro) — lets a Pro user replace the
 * estimated calorie/macro targets with their own. Free users see the same
 * card locked, pointing at the paywall. Used by the Goals settings screen.
 */
export function CustomTargetsCard({ isPro, enabled, onEnabledChange, values, onValuesChange, check, onReset, outlook, targetWeightLabel }: CustomTargetsCardProps) {
  if (!isPro) {
    return (
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>Custom Goals & Macros</Text>
          <View style={styles.proBadge}>
            <Feather name="lock" size={11} color={theme.colors.brandDark} />
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        </View>
        <Text style={styles.cardDescription}>
          Set your own daily calorie, protein, carb, fat and fiber targets instead of the recommended ones.
        </Text>
        <Button label="Unlock with CalHow Pro" variant="outline" icon="star" onPress={() => router.push('/paywall')} />
      </Card>
    );
  }

  const set = (key: keyof CustomTargetsValues) => (text: string) => onValuesChange({ ...values, [key]: text });
  const gramsSuffix = <Text style={styles.unitSuffix}>g</Text>;

  return (
    <Card style={styles.card}>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Custom Goals & Macros</Text>
          <Text style={styles.cardDescription}>Use your own targets instead of the recommended ones.</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onEnabledChange}
          trackColor={{ true: theme.colors.brandPrimary, false: theme.colors.border }}
          accessibilityLabel="Use custom calorie and macro targets"
        />
      </View>

      {enabled && (
        <>
          <Input
            label="Daily Calories"
            icon="zap"
            value={values.calories}
            onChangeText={set('calories')}
            keyboardType="number-pad"
            rightAdornment={<Text style={styles.unitSuffix}>kcal</Text>}
          />
          <View style={styles.row}>
            <Input label="Protein" value={values.proteinG} onChangeText={set('proteinG')} keyboardType="number-pad" rightAdornment={gramsSuffix} containerStyle={styles.rowField} />
            <Input label="Carbs" value={values.carbsG} onChangeText={set('carbsG')} keyboardType="number-pad" rightAdornment={gramsSuffix} containerStyle={styles.rowField} />
          </View>
          <View style={styles.row}>
            <Input label="Fat" value={values.fatsG} onChangeText={set('fatsG')} keyboardType="number-pad" rightAdornment={gramsSuffix} containerStyle={styles.rowField} />
            <Input label="Fiber (optional)" value={values.fiberG} onChangeText={set('fiberG')} keyboardType="number-pad" rightAdornment={gramsSuffix} containerStyle={styles.rowField} />
          </View>

          {outlook && check.errors.length === 0 && <OutlookNote outlook={outlook} targetWeightLabel={targetWeightLabel} />}

          {check.macroCalories > 0 && (
            <View style={styles.splitRow}>
              <SplitPill label="Protein" value={check.percent.protein} />
              <SplitPill label="Carbs" value={check.percent.carbs} />
              <SplitPill label="Fat" value={check.percent.fats} />
              <Text style={styles.splitTotal}>= {check.macroCalories.toLocaleString()} kcal</Text>
            </View>
          )}

          {check.errors.map((message) => (
            <Notice key={message} kind="error" message={message} />
          ))}
          {check.warnings.map((message) => (
            <Notice key={message} kind="warning" message={message} />
          ))}

          <View style={styles.footerRow}>
            <Pressable onPress={onReset} hitSlop={8} accessibilityRole="button">
              <Text style={styles.resetText}>Reset to recommended</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/settings/sources')} hitSlop={8} accessibilityRole="link">
              <Text style={styles.sourcesText}>Recommended ranges: Sources</Text>
            </Pressable>
          </View>
        </>
      )}
    </Card>
  );
}

function SplitPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>
        {label} {value}%
      </Text>
    </View>
  );
}

function Notice({ kind, message }: { kind: 'error' | 'warning'; message: string }) {
  const isError = kind === 'error';
  return (
    <View style={[styles.notice, isError ? styles.noticeError : styles.noticeWarning]}>
      <Feather name={isError ? 'alert-circle' : 'info'} size={14} color={isError ? theme.colors.error : theme.colors.brandDark} />
      <Text style={[styles.noticeText, isError && { color: theme.colors.error }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  cardTitle: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
  },
  cardDescription: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  proBadgeText: {
    ...theme.text.caption,
    fontSize: 10,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.brandDark,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  rowField: {
    flex: 1,
  },
  unitSuffix: {
    ...theme.text.label,
    color: theme.colors.textMuted,
  },
  splitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  pill: {
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  pillText: {
    ...theme.text.caption,
    fontSize: 11,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.brandDark,
  },
  splitTotal: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  outlook: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
  },
  outlookText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  outlookAccent: {
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.brandDark,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
  },
  noticeError: {
    backgroundColor: theme.colors.errorBg,
  },
  noticeWarning: {
    backgroundColor: theme.colors.brandTint,
  },
  noticeText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  resetText: {
    ...theme.text.caption,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.brandDark,
  },
  sourcesText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
    textDecorationLine: 'underline',
  },
});
