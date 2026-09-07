import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface WeekStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  /** Date keys (YYYY-MM-DD) that have at least one logged meal — shown as a small dot. */
  markedDateKeys?: Set<string>;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function dateKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function isSameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

/**
 * Shows the calendar week containing `selectedDate`, with chevrons to move
 * a week at a time. Tapping a day calls `onSelectDate`. This is a
 * simplified week-strip rather than a full month grid — matches the
 * reference's 7-day row while keeping the navigation model simple.
 */
export function WeekStrip({ selectedDate, onSelectDate, markedDateKeys }: WeekStripProps) {
  const weekStart = startOfWeek(selectedDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(selectedDate);

  function shiftWeek(delta: number) {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + delta * 7);
    onSelectDate(next);
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => shiftWeek(-1)} hitSlop={8}>
          <Feather name="chevron-left" size={16} color={theme.colors.textSecondary} />
        </Pressable>
        <View style={styles.monthRow}>
          <Feather name="calendar" size={14} color={theme.colors.brandDark} />
          <Text style={styles.monthLabel}>{monthLabel}</Text>
        </View>
        <Pressable onPress={() => shiftWeek(1)} hitSlop={8}>
          <Feather name="chevron-right" size={16} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.daysRow}>
        {days.map((day, i) => {
          const selected = isSameDay(day, selectedDate);
          const marked = markedDateKeys?.has(dateKey(day));
          return (
            <Pressable key={i} onPress={() => onSelectDate(day)} style={styles.dayColumn}>
              <Text style={styles.dayLabel}>{DAY_LABELS[i]}</Text>
              <View style={[styles.dateCircle, selected && styles.dateCircleSelected]}>
                <Text style={[styles.dateNumber, selected && styles.dateNumberSelected]}>{day.getDate()}</Text>
              </View>
              {marked && <View style={styles.dot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthLabel: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 4,
    width: 36,
  },
  dayLabel: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleSelected: {
    backgroundColor: theme.colors.brandPrimary,
  },
  dateNumber: {
    ...theme.text.bodyMedium,
    color: theme.colors.textPrimary,
  },
  dateNumberSelected: {
    color: theme.colors.textInverse,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandPrimary,
  },
});
