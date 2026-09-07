import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { SelectField } from '@/components/forms/SelectField';
import { Button } from '@/components/ui/Button';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { updateUserProfile } from '@/services/firestore';
import { theme } from '@/constants/theme';
import type { UnitSystem } from '@/types/models';

const UNIT_OPTIONS: { label: string; value: UnitSystem }[] = [
  { label: 'Kilograms (kg)', value: 'metric' },
  { label: 'Pounds (lb)', value: 'imperial' },
];

/**
 * Only the display-unit preference is edited here. Weight is always
 * stored canonically in kilograms (UserProfile.currentWeightKg,
 * UserGoals.targetWeightKg) — this screen never rewrites those stored
 * numbers, it only changes which unit they're displayed in elsewhere in
 * the app. Height is stored in cm only; no imperial height unit is used
 * anywhere in this app today, so there's nothing to convert for height.
 */
export default function UnitsScreen() {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [preferredUnit, setPreferredUnit] = useState<UnitSystem>(profile?.preferredUnit ?? 'metric');

  const { run: handleSave, loading, error } = useAsyncAction(async () => {
    if (!user) return;
    await updateUserProfile(user.uid, { preferredUnit });
    router.back();
  });

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <Text style={styles.heading}>Units</Text>
      <Text style={styles.subtitle}>Choose how weight is displayed throughout CalHow.</Text>

      <View style={styles.card}>
        <SelectField label="Weight unit" icon="sliders" value={preferredUnit} options={UNIT_OPTIONS} onChange={setPreferredUnit} />

        <View style={styles.note}>
          <Feather name="info" size={14} color={theme.colors.brandDark} />
          <Text style={styles.noteText}>
            This only changes how weights are displayed. Your data is always stored precisely — changing this won't
            alter your logged history.
          </Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button label="Save" icon="check" onPress={handleSave} loading={loading} />
      </View>
    </ScreenContainer>
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
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
  },
  noteText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  errorText: {
    ...theme.text.caption,
    color: theme.colors.error,
  },
});
