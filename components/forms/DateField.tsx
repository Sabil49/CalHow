import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';

interface DateFieldProps {
  label?: string;
  icon?: keyof typeof Feather.glyphMap;
  placeholder?: string;
  /** Canonical value: ISO date string "YYYY-MM-DD", or undefined if unset. */
  value?: string;
  onChange: (isoDate: string) => void;
  maximumDate?: Date;
  minimumDate?: Date;
}

function isoToDate(iso?: string): Date {
  if (iso) {
    const parsed = new Date(`${iso}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const fallback = new Date();
  fallback.setFullYear(fallback.getFullYear() - 25);
  return fallback;
}

function dateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatIsoForDisplay(iso?: string): string | undefined {
  if (!iso) return undefined;
  const date = isoToDate(iso);
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

/**
 * Date input backed by the native date picker — replaces free-text
 * "DD/MM/YYYY" fields, which stored a string `new Date()` can't reliably
 * parse (and which never matched what calculateAge() in
 * utils/nutrition.ts expects). Always stores/returns an unambiguous ISO
 * "YYYY-MM-DD" string.
 */
export function DateField({ label, icon = 'calendar', placeholder = 'Select a date', value, onChange, maximumDate, minimumDate }: DateFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date>(() => isoToDate(value));

  function openPicker() {
    setDraftDate(isoToDate(value));
    setPickerOpen(true);
  }

  function handleChange(_: unknown, selected?: Date) {
    if (Platform.OS === 'android') {
      setPickerOpen(false);
      if (selected) onChange(dateToIso(selected));
      return;
    }
    if (selected) setDraftDate(selected);
  }

  function handleDone() {
    onChange(dateToIso(draftDate));
    setPickerOpen(false);
  }

  const displayText = formatIsoForDisplay(value);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable onPress={openPicker} style={styles.field}>
        <Feather name={icon} size={18} color={theme.colors.textMuted} style={styles.icon} />
        <Text style={[styles.value, !displayText && styles.placeholder]} numberOfLines={1}>
          {displayText ?? placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color={theme.colors.textMuted} />
      </Pressable>

      {pickerOpen &&
        (Platform.OS === 'ios' ? (
          <Modal transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
            <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
              <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
                <SafeAreaView edges={['bottom']}>
                  <DateTimePicker
                    value={draftDate}
                    mode="date"
                    display="spinner"
                    maximumDate={maximumDate}
                    minimumDate={minimumDate}
                    onChange={handleChange}
                  />
                  <Button label="Done" icon={null} onPress={handleDone} />
                </SafeAreaView>
              </Pressable>
            </Pressable>
          </Modal>
        ) : (
          <DateTimePicker
            value={draftDate}
            mode="date"
            display="default"
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={handleChange}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.xxs,
  },
  label: {
    ...theme.text.label,
    color: theme.colors.textPrimary,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    minHeight: 52,
  },
  icon: {
    marginRight: theme.spacing.xxs,
  },
  value: {
    flex: 1,
    ...theme.text.body,
    color: theme.colors.textPrimary,
  },
  placeholder: {
    color: theme.colors.textMuted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: theme.palette.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
});
