import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Feather.glyphMap;
  error?: string;
  /** Renders an eye/eye-off toggle and masks input — for password fields. */
  isPassword?: boolean;
  rightAdornment?: React.ReactNode;
  /** Style for the outer label+field wrapper — use this (not `style`) to size the field within a row, e.g. `{ flex: 1 }`. */
  containerStyle?: StyleProp<ViewStyle>;
}

/** Labeled text input matching the rounded, icon-prefixed fields from login/signup/personal-details. */
export function Input({
  label,
  icon,
  error,
  isPassword = false,
  rightAdornment,
  containerStyle,
  style,
  ...textInputProps
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(isPassword);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}
      >
        {icon && <Feather name={icon} size={18} color={theme.colors.textMuted} style={styles.icon} />}
        <TextInput
          {...textInputProps}
          secureTextEntry={secure}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            textInputProps.onBlur?.(e);
          }}
          style={[styles.input, style]}
        />
        {isPassword && (
          <Pressable hitSlop={8} onPress={() => setSecure((s) => !s)}>
            <Feather name={secure ? 'eye' : 'eye-off'} size={18} color={theme.colors.textMuted} />
          </Pressable>
        )}
        {rightAdornment}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
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
  fieldFocused: {
    borderColor: theme.colors.brandPrimary,
  },
  fieldError: {
    borderColor: theme.colors.error,
  },
  icon: {
    marginRight: theme.spacing.xxs,
  },
  input: {
    flex: 1,
    ...theme.text.body,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.sm,
  },
  errorText: {
    ...theme.text.caption,
    color: theme.colors.error,
  },
});
