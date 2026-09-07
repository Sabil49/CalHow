import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';

export interface SelectOption<T extends string> {
  label: string;
  value: T;
}

interface SelectFieldProps<T extends string> {
  label?: string;
  icon?: keyof typeof Feather.glyphMap;
  placeholder?: string;
  value: T | undefined;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  error?: string;
}

/**
 * Dropdown field matching the icon-prefixed, chevron-suffixed selects in
 * Personal Details (Gender, Preferred Unit): tapping opens a simple modal
 * option list rather than a native <Picker>, so the look stays consistent
 * across iOS/Android without extra native dependencies.
 */
export function SelectField<T extends string>({
  label,
  icon,
  placeholder = 'Select an option',
  value,
  options,
  onChange,
  error,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.field, !!error && styles.fieldError]}
      >
        {icon && <Feather name={icon} size={18} color={theme.colors.textMuted} style={styles.icon} />}
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color={theme.colors.textMuted} />
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <SafeAreaView edges={['bottom']}>
              <View style={styles.sheetHandle} />
              {label && <Text style={styles.sheetTitle}>{label}</Text>}
              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                style={styles.optionList}
                renderItem={({ item }) => {
                  const isSelected = item.value === value;
                  return (
                    <Pressable
                      style={[styles.option, isSelected && styles.optionSelected]}
                      onPress={() => {
                        onChange(item.value);
                        setOpen(false);
                      }}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {item.label}
                      </Text>
                      {isSelected && <Feather name="check" size={18} color={theme.colors.brandDark} />}
                    </Pressable>
                  );
                }}
              />
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
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
  fieldError: {
    borderColor: theme.colors.error,
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
  errorText: {
    ...theme.text.caption,
    color: theme.colors.error,
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
    maxHeight: '70%',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  sheetTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  optionList: {
    marginBottom: theme.spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionSelected: {
    // background intentionally unchanged; the check icon + text color carry the selected state
  },
  optionText: {
    ...theme.text.body,
    color: theme.colors.textPrimary,
  },
  optionTextSelected: {
    color: theme.colors.brandDark,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
});
