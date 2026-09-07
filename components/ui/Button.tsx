import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

export type ButtonVariant = 'gradient' | 'solid' | 'outline' | 'ghost' | 'danger-ghost';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** Feather icon name shown after the label. Pass `null` to show no icon at all. */
  icon?: keyof typeof Feather.glyphMap | null;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Primary interactive control across CalHow.
 *
 * - `gradient`: main CTA ("Continue", "Log In", "Start 7-Day Free Trial") —
 *   green -> lime diagonal gradient, pill-shaped, dark arrow icon.
 * - `solid`: secondary confirm actions on cream/white surfaces ("Save Meal",
 *   "Confirm & Analyze", "Done").
 * - `outline`: low-emphasis action next to a solid/gradient button
 *   ("Scan Again", "Scan Another").
 * - `ghost`: plain text action, no container.
 */
export function Button({
  label,
  onPress,
  variant = 'gradient',
  icon = 'arrow-right',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? theme.colors.brandDark : theme.colors.textPrimary} />
      ) : (
        <>
          <Text style={[styles.label, labelColorForVariant(variant)]} numberOfLines={1}>
            {label}
          </Text>
          {icon && (
            <Feather
              name={icon}
              size={18}
              color={variant === 'outline' || variant === 'ghost' ? theme.colors.brandDark : theme.colors.textPrimary}
            />
          )}
        </>
      )}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={({ pressed }) => [
          fullWidth && styles.fullWidth,
          { opacity: isDisabled ? 0.6 : pressed ? 0.9 : 1 },
          style,
        ]}
      >
        <LinearGradient
          colors={theme.gradients.primaryButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.2 }}
          style={[styles.base, theme.shadows.button]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        variantStyle(variant),
        { opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

function variantStyle(variant: ButtonVariant): ViewStyle {
  switch (variant) {
    case 'solid':
      return { backgroundColor: theme.colors.brandDark };
    case 'outline':
      return {
        backgroundColor: theme.colors.card,
        borderWidth: 1.5,
        borderColor: theme.colors.brandPrimary,
      };
    case 'danger-ghost':
      return { backgroundColor: 'transparent' };
    case 'ghost':
    default:
      return { backgroundColor: 'transparent' };
  }
}

function labelColorForVariant(variant: ButtonVariant) {
  switch (variant) {
    case 'solid':
      return { color: theme.colors.textInverse };
    case 'outline':
    case 'ghost':
      return { color: theme.colors.brandDark };
    case 'danger-ghost':
      return { color: theme.colors.error };
    case 'gradient':
    default:
      return { color: theme.colors.textPrimary };
  }
}

const styles = StyleSheet.create({
  fullWidth: { width: '100%' },
  base: {
    minHeight: 56,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.text.button,
  },
});
