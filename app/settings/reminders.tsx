import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Card } from '@/components/ui/Card';
import { SelectField } from '@/components/forms/SelectField';
import { Button } from '@/components/ui/Button';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { updateUserProfile } from '@/services/firestore';
import { theme } from '@/constants/theme';

const DAY_OPTIONS: { label: string; value: `${number}` }[] = [
  { label: 'Sunday', value: '0' },
  { label: 'Monday', value: '1' },
  { label: 'Tuesday', value: '2' },
  { label: 'Wednesday', value: '3' },
  { label: 'Thursday', value: '4' },
  { label: 'Friday', value: '5' },
  { label: 'Saturday', value: '6' },
];

/** "HH:mm" (24h, canonical storage) <-> Date, used only for feeding the native time picker. */
function timeStringToDate(time?: string): Date {
  const d = new Date();
  if (time) {
    const [h, m] = time.split(':').map(Number);
    d.setHours(h || 0, m || 0, 0, 0);
  } else {
    d.setHours(8, 0, 0, 0);
  }
  return d;
}
function dateToTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
function formatTimeString(time?: string): string {
  if (!time) return 'Set time';
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(timeStringToDate(time));
}

/**
 * Persists reminder PREFERENCES only. This app does not have
 * expo-notifications installed and has no permission/scheduling code
 * anywhere — see services/notifications.ts (absent). Saving a time here
 * does not schedule anything; the notice below makes that explicit rather
 * than implying reminders will fire.
 */
export default function RemindersScreen() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const reminders = profile?.reminders;

  const [mealRemindersEnabled, setMealRemindersEnabled] = useState(reminders?.mealRemindersEnabled ?? false);
  const [breakfastTime, setBreakfastTime] = useState(reminders?.breakfastTime ?? '08:00');
  const [lunchTime, setLunchTime] = useState(reminders?.lunchTime ?? '12:30');
  const [dinnerTime, setDinnerTime] = useState(reminders?.dinnerTime ?? '19:00');

  const [weightReminderEnabled, setWeightReminderEnabled] = useState(reminders?.weightReminderEnabled ?? false);
  const [weightReminderDay, setWeightReminderDay] = useState<`${number}`>(
    (String(reminders?.weightReminderDay ?? 1) as `${number}`),
  );
  const [weightReminderTime, setWeightReminderTime] = useState(reminders?.weightReminderTime ?? '08:00');

  const [activePicker, setActivePicker] = useState<null | 'breakfast' | 'lunch' | 'dinner' | 'weight'>(null);

  const { run: handleSave, loading, error } = useAsyncAction(async () => {
    if (!user) return;
    await updateUserProfile(user.uid, {
      reminders: {
        mealRemindersEnabled,
        breakfastTime: mealRemindersEnabled ? breakfastTime : undefined,
        lunchTime: mealRemindersEnabled ? lunchTime : undefined,
        dinnerTime: mealRemindersEnabled ? dinnerTime : undefined,
        weightReminderEnabled,
        weightReminderDay: weightReminderEnabled ? Number(weightReminderDay) : undefined,
        weightReminderTime: weightReminderEnabled ? weightReminderTime : undefined,
      },
    });
    router.back();
  });

  function handleTimeChange(_: unknown, selected?: Date) {
    if (Platform.OS === 'android') setActivePicker(null);
    if (!selected) return;
    const value = dateToTimeString(selected);
    if (activePicker === 'breakfast') setBreakfastTime(value);
    else if (activePicker === 'lunch') setLunchTime(value);
    else if (activePicker === 'dinner') setDinnerTime(value);
    else if (activePicker === 'weight') setWeightReminderTime(value);
  }

  const currentPickerValue =
    activePicker === 'breakfast'
      ? breakfastTime
      : activePicker === 'lunch'
        ? lunchTime
        : activePicker === 'dinner'
          ? dinnerTime
          : weightReminderTime;

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <Text style={styles.heading}>Reminders</Text>
      <Text style={styles.subtitle}>Choose when you'd like to be reminded to log meals and your weight.</Text>

      <View style={styles.notice}>
        <Feather name="bell-off" size={16} color={theme.colors.warning} />
        <Text style={styles.noticeText}>
          Push notifications aren't set up in this app yet. Your reminder times are saved, but no notifications will
          actually be sent until that's built.
        </Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Meal reminders</Text>
            <Text style={styles.toggleSubtitle}>Remind me to log breakfast, lunch and dinner</Text>
          </View>
          <Switch value={mealRemindersEnabled} onValueChange={setMealRemindersEnabled} trackColor={{ true: theme.colors.brandPrimary }} />
        </View>

        {mealRemindersEnabled && (
          <View style={styles.timeRows}>
            <TimeRow label="Breakfast" value={breakfastTime} onPress={() => setActivePicker('breakfast')} />
            <TimeRow label="Lunch" value={lunchTime} onPress={() => setActivePicker('lunch')} />
            <TimeRow label="Dinner" value={dinnerTime} onPress={() => setActivePicker('dinner')} />
          </View>
        )}
      </Card>

      <Card style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Weight reminder</Text>
            <Text style={styles.toggleSubtitle}>Remind me to log my weight weekly</Text>
          </View>
          <Switch value={weightReminderEnabled} onValueChange={setWeightReminderEnabled} trackColor={{ true: theme.colors.brandPrimary }} />
        </View>

        {weightReminderEnabled && (
          <View style={styles.timeRows}>
            <SelectField label="Day of week" icon="calendar" value={weightReminderDay} options={DAY_OPTIONS} onChange={setWeightReminderDay} />
            <TimeRow label="Time" value={weightReminderTime} onPress={() => setActivePicker('weight')} />
          </View>
        )}
      </Card>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.footer}>
        <Button label="Save Reminders" icon="check" onPress={handleSave} loading={loading} />
      </View>

      {activePicker &&
        (Platform.OS === 'ios' ? (
          <Modal transparent animationType="slide" onRequestClose={() => setActivePicker(null)}>
            <Pressable style={styles.pickerBackdrop} onPress={() => setActivePicker(null)}>
              <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
                <DateTimePicker value={timeStringToDate(currentPickerValue)} mode="time" display="spinner" onChange={handleTimeChange} />
                <Button label="Done" icon={null} onPress={() => setActivePicker(null)} />
              </Pressable>
            </Pressable>
          </Modal>
        ) : (
          <DateTimePicker value={timeStringToDate(currentPickerValue)} mode="time" display="default" onChange={handleTimeChange} />
        ))}
    </ScreenContainer>
  );
}

function TimeRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={styles.timeRow} onPress={onPress}>
      <Text style={styles.timeRowLabel}>{label}</Text>
      <View style={styles.timeRowValueWrap}>
        <Text style={styles.timeRowValue}>{formatTimeString(value)}</Text>
        <Feather name="clock" size={14} color={theme.colors.brandDark} />
      </View>
    </Pressable>
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
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.warningBg,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  noticeText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  card: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  toggleTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  toggleSubtitle: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  timeRows: {
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  timeRowLabel: {
    ...theme.text.body,
    color: theme.colors.textPrimary,
  },
  timeRowValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  timeRowValue: {
    ...theme.text.caption,
    color: theme.colors.brandDark,
    fontFamily: theme.fontFamily.sansSemiBold,
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
