import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { GoogleGlyph } from '@/components/ui/GoogleGlyph';

export type SocialProvider = 'google' | 'apple';

const PROVIDER_CONFIG: Record<SocialProvider, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  // 'color' only drives the loading spinner (the icon itself is GoogleGlyph's
  // real multi-color mark, unaffected by this) — Google's brand yellow reads
  // as more "Google" than picking just one of its four colors at random.
  google: { icon: 'logo-google', color: '#FBBC05', label: 'Google' },
  apple: { icon: 'logo-apple', color: '#000000', label: 'Apple' },
};

function ProviderIcon({ provider, size, color }: { provider: SocialProvider; size: number; color: string }) {
  // Google's brand mark is multi-color and can't be represented by a single-tint icon font glyph.
  if (provider === 'google') return <GoogleGlyph size={size} />;
  return <Ionicons name={PROVIDER_CONFIG[provider].icon} size={size} color={color} />;
}

interface SocialAuthButtonProps {
  provider: SocialProvider;
  onPress: () => void;
  loading?: boolean;
  /** 'full': "Continue with Google" row (Social_Auth screen). 'circle': icon-only chip (Login/Signup screens). */
  variant?: 'full' | 'circle';
  /** When true, the button is visually dimmed and cannot be pressed — used to disable one provider's button while the other's sign-in is in flight. */
  disabled?: boolean;
}

export function SocialAuthButton({ provider, onPress, loading = false, variant = 'full', disabled = false }: SocialAuthButtonProps) {
  const config = PROVIDER_CONFIG[provider];
  const isInactive = disabled || loading;

  if (variant === 'circle') {
    return (
      <View style={styles.circleColumn}>
        <Pressable
          onPress={onPress}
          disabled={isInactive}
          style={({ pressed }) => [styles.circleButton, disabled && styles.circleButtonDisabled, { opacity: pressed ? 0.8 : 1 }]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={config.color} />
          ) : (
            <View style={disabled && styles.iconDisabled}>
              <ProviderIcon provider={provider} size={22} color={disabled ? theme.colors.textMuted : config.color} />
            </View>
          )}
        </Pressable>
        <Text style={styles.circleLabel}>{config.label}</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      style={({ pressed }) => [styles.fullButton, disabled && styles.fullButtonDisabled, { opacity: pressed ? 0.85 : 1 }]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.textPrimary} />
      ) : (
        <>
          <View style={disabled && styles.iconDisabled}>
            <ProviderIcon provider={provider} size={20} color={disabled ? theme.colors.textMuted : config.color} />
          </View>
          <Text style={[styles.fullLabel, disabled && styles.fullLabelDisabled]}>Continue with {config.label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    minHeight: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
  },
  fullButtonDisabled: {
    backgroundColor: theme.palette.ink100,
    borderColor: theme.palette.ink100,
  },
  fullLabel: {
    ...theme.text.bodyMedium,
    color: theme.colors.textPrimary,
  },
  fullLabelDisabled: {
    color: theme.colors.textMuted,
  },
  circleColumn: {
    alignItems: 'center',
    gap: theme.spacing.xxs,
  },
  circleButton: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonDisabled: {
    backgroundColor: theme.palette.ink100,
    borderColor: theme.palette.ink100,
  },
  circleLabel: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  iconDisabled: {
    opacity: 0.5,
  },
});
