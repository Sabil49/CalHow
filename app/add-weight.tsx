import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { AuthGuard } from '@/components/navigation/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LineChartMini } from '@/components/charts/LineChartMini';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWeightLogs } from '@/hooks/useWeightLogs';
import { addWeightLog } from '@/services/firestore';
import { lbToKg } from '@/utils/units';
import { theme } from '@/constants/theme';

export default function AddWeightScreen() {
  return (
    <AuthGuard>
      <AddWeightScreenContent />
    </AuthGuard>
  );
}

function AddWeightScreenContent() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { logs } = useWeightLogs(30);

  const latestWeight = logs[0]?.weightKg ?? profile?.currentWeightKg ?? 70;
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [unit, setUnit] = useState<'kg' | 'lb'>(profile?.preferredUnit === 'imperial' ? 'lb' : 'kg');
  const [weightText, setWeightText] = useState(String(latestWeight));
  const [note, setNote] = useState('');
  const [noteExpanded, setNoteExpanded] = useState(false);

  const weightValue = Number(weightText) || 0;
  const weightKg = unit === 'kg' ? weightValue : lbToKg(weightValue);

  const { run: handleSave, loading, error } = useAsyncAction(async () => {
    if (!user || weightValue <= 0) return;
    await addWeightLog(user.uid, { weightKg, note: note.trim() || undefined, loggedAt: date });
    router.back();
  });

  const previousWeight = logs[0]?.weightKg;
  const startingWeight = logs[logs.length - 1]?.weightKg ?? previousWeight ?? weightKg;
  const deltaVsLast = previousWeight != null ? weightKg - previousWeight : undefined;

  const trendPoints = useMemo(() => [...logs].reverse().slice(-7).map((l) => l.weightKg), [logs]);
  const trendLabels = useMemo(
    () =>
      [...logs]
        .reverse()
        .slice(-7)
        .map((l) => new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(l.loggedAt)),
    [logs],
  );

  const rulerTicks = useMemo(() => {
    const center = weightValue || latestWeight;
    const ticks: number[] = [];
    for (let i = -5; i <= 5; i++) {
      ticks.push(Math.round((center + i * 0.25) * 100) / 100);
    }
    return ticks;
  }, [weightValue, latestWeight]);

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <Text style={styles.heading}>Add your weight</Text>
      <Text style={styles.subtitle}>Track your weight to see your progress and stay motivated.</Text>

      <Card style={styles.card}>
        <View style={styles.dateRow}>
          <View style={styles.dateIconWrap}>
            <Feather name="calendar" size={16} color={theme.colors.brandDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dateLabel}>Today's date</Text>
            <Text style={styles.dateValue}>
              {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date)} •{' '}
              {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date)}
            </Text>
          </View>
          <Pressable onPress={() => setShowDatePicker(true)}>
            <Text style={styles.changeLink}>Change</Text>
          </Pressable>
        </View>

        <View style={styles.weightHeaderRow}>
          <Text style={styles.weightSectionLabel}>Your weight</Text>
          <View style={styles.unitToggle}>
            <Pressable onPress={() => setUnit('kg')} style={[styles.unitOption, unit === 'kg' && styles.unitOptionActive]}>
              <Text style={[styles.unitText, unit === 'kg' && styles.unitTextActive]}>kg</Text>
            </Pressable>
            <Pressable onPress={() => setUnit('lb')} style={[styles.unitOption, unit === 'lb' && styles.unitOptionActive]}>
              <Text style={[styles.unitText, unit === 'lb' && styles.unitTextActive]}>lb</Text>
            </Pressable>
          </View>
        </View>

        <TextInput
          value={weightText}
          onChangeText={setWeightText}
          keyboardType="decimal-pad"
          style={styles.weightInput}
        />

        <View style={styles.rulerRow}>
          {rulerTicks.map((tick, i) => (
            <View key={i} style={styles.rulerTickCol}>
              <View style={[styles.rulerTick, i === 5 && styles.rulerTickCenter]} />
              {i % 2 === 0 && <Text style={styles.rulerLabel}>{tick.toFixed(1)}</Text>}
            </View>
          ))}
        </View>

        <Pressable style={styles.noteRow} onPress={() => setNoteExpanded((v) => !v)}>
          <Feather name="file-text" size={16} color={theme.colors.brandDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.noteLabel}>Add a note (optional)</Text>
            {!noteExpanded && <Text style={styles.noteHint}>How are you feeling today?</Text>}
          </View>
          <Feather name={noteExpanded ? 'chevron-up' : 'chevron-right'} size={16} color={theme.colors.textMuted} />
        </Pressable>
        {noteExpanded && (
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="How are you feeling today?"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            style={styles.noteInput}
          />
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button label="Save Weight" icon="check-circle" onPress={handleSave} loading={loading} disabled={weightValue <= 0} />
      </Card>

      <Card style={styles.card}>
        <View style={styles.progressHeaderRow}>
          <Text style={styles.cardTitle}>Your progress</Text>
          <Pressable onPress={() => router.push('/(tabs)/progress')}>
            <Text style={styles.viewFullLink}>View full progress →</Text>
          </Pressable>
        </View>
        <View style={styles.statsRow}>
          <StatCol icon="trending-up" value={`${weightKg.toFixed(1)} kg`} label="Current weight" />
          {deltaVsLast != null && (
            <StatCol
              icon={deltaVsLast <= 0 ? 'arrow-down' : 'arrow-up'}
              value={`${deltaVsLast >= 0 ? '+' : ''}${deltaVsLast.toFixed(1)} kg`}
              label="vs last entry"
            />
          )}
          <StatCol icon="flag" value={`${startingWeight.toFixed(1)} kg`} label="Starting weight" />
        </View>
      </Card>

      {trendPoints.length > 1 && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Weight trend</Text>
          <LineChartMini values={trendPoints} width={280} height={90} />
          <View style={styles.trendLabelsRow}>
            {trendLabels.map((label, i) => (
              <Text key={i} style={styles.trendLabelText}>
                {label}
              </Text>
            ))}
          </View>
        </Card>
      )}

      <View style={styles.tip}>
        <Feather name="zap" size={14} color={theme.colors.brandDark} />
        <Text style={styles.tipText}>Weigh yourself at the same time of day for the most accurate tracking.</Text>
      </View>

      {showDatePicker &&
        (Platform.OS === 'ios' ? (
          <Modal transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
            <Pressable style={styles.pickerBackdrop} onPress={() => setShowDatePicker(false)}>
              <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
                <DateTimePicker value={date} mode="datetime" display="spinner" onChange={(_, selected) => selected && setDate(selected)} />
                <Button label="Done" icon={null} onPress={() => setShowDatePicker(false)} />
              </Pressable>
            </Pressable>
          </Modal>
        ) : (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(_, selected) => {
              setShowDatePicker(false);
              if (selected) setDate(selected);
            }}
          />
        ))}
    </ScreenContainer>
  );
}

function StatCol({ icon, value, label }: { icon: keyof typeof Feather.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.statCol}>
      <View style={styles.statIconWrap}>
        <Feather name={icon} size={14} color={theme.colors.brandDark} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  card: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dateIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  dateValue: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  changeLink: {
    ...theme.text.label,
    color: theme.colors.brandDark,
  },
  weightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  weightSectionLabel: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.pill,
    padding: 2,
  },
  unitOption: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  unitOptionActive: {
    backgroundColor: theme.colors.brandPrimary,
  },
  unitText: {
    ...theme.text.caption,
    color: theme.colors.brandDark,
  },
  unitTextActive: {
    color: theme.colors.textInverse,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
  weightInput: {
    fontFamily: theme.fontFamily.serifBold,
    fontSize: 48,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    paddingVertical: theme.spacing.sm,
  },
  rulerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.sm,
  },
  rulerTickCol: {
    alignItems: 'center',
    gap: 4,
    width: 24,
  },
  rulerTick: {
    width: 2,
    height: 14,
    backgroundColor: theme.colors.border,
    borderRadius: 1,
  },
  rulerTickCenter: {
    height: 22,
    backgroundColor: theme.colors.brandPrimary,
    width: 3,
  },
  rulerLabel: {
    ...theme.text.caption,
    fontSize: 9,
    color: theme.colors.textMuted,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
  },
  noteLabel: {
    ...theme.text.label,
    color: theme.colors.brandDark,
  },
  noteHint: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  noteInput: {
    ...theme.text.body,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  errorText: {
    ...theme.text.caption,
    color: theme.colors.error,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  viewFullLink: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.brandDark,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontFamily: theme.fontFamily.sansBold,
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
  },
  statLabel: {
    ...theme.text.caption,
    fontSize: 10,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  trendLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendLabelText: {
    ...theme.text.caption,
    fontSize: 10,
    color: theme.colors.textMuted,
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
  pickerBackdrop: {
    flex: 1,
    backgroundColor: theme.palette.overlay,
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
});
