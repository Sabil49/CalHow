import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Input } from '@/components/ui/Input';
import { SelectField } from '@/components/forms/SelectField';
import { DateField } from '@/components/forms/DateField';
import { Button } from '@/components/ui/Button';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { updateUserProfile } from '@/services/firestore';
import { kgToLb, lbToKg } from '@/utils/units';
import { theme } from '@/constants/theme';
import type { Gender } from '@/types/models';

const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

const MAX_DOB = new Date();
const MIN_DOB = new Date(new Date().getFullYear() - 120, 0, 1);

export default function PersonalInformationScreen() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const preferredUnit = profile?.preferredUnit ?? 'metric';

  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [gender, setGender] = useState<Gender | undefined>(profile?.gender);
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth);
  const [heightCm, setHeightCm] = useState(profile?.heightCm ? String(profile.heightCm) : '');
  const [weightText, setWeightText] = useState(() => {
    if (!profile?.currentWeightKg) return '';
    const value = preferredUnit === 'imperial' ? kgToLb(profile.currentWeightKg) : profile.currentWeightKg;
    return value.toFixed(1);
  });

  const { run: handleSave, loading, error } = useAsyncAction(async () => {
    if (!user) return;
    const weightValue = Number(weightText);
    const currentWeightKg = weightValue > 0 ? (preferredUnit === 'imperial' ? lbToKg(weightValue) : weightValue) : undefined;

    await updateUserProfile(user.uid, {
      fullName: fullName.trim(),
      gender,
      dateOfBirth,
      heightCm: Number(heightCm) || undefined,
      currentWeightKg,
    });
    router.back();
  });

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <Text style={styles.heading}>Personal Information</Text>
      <Text style={styles.subtitle}>Update your name and details used to calculate your calorie needs.</Text>

      <View style={styles.card}>
        <Input label="Full Name" icon="user" placeholder="Enter your full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />

        <Input label="Email Address" icon="mail" value={profile?.email ?? user?.email ?? ''} editable={false} containerStyle={styles.readOnlyField} />
        <View style={styles.readOnlyNote}>
          <Feather name="lock" size={12} color={theme.colors.textMuted} />
          <Text style={styles.readOnlyNoteText}>Email can't be changed here yet.</Text>
        </View>

        <SelectField label="Gender" icon="user" placeholder="Select your gender" value={gender} options={GENDER_OPTIONS} onChange={setGender} />

        <DateField label="Date of Birth" value={dateOfBirth} onChange={setDateOfBirth} maximumDate={MAX_DOB} minimumDate={MIN_DOB} />

        <Input
          label="Height"
          icon="chevrons-up"
          placeholder="170"
          value={heightCm}
          onChangeText={setHeightCm}
          keyboardType="number-pad"
          rightAdornment={<Text style={styles.unitSuffix}>cm</Text>}
        />

        <Input
          label="Current Weight"
          icon="bar-chart-2"
          placeholder={preferredUnit === 'imperial' ? '154' : '70'}
          value={weightText}
          onChangeText={setWeightText}
          keyboardType="decimal-pad"
          rightAdornment={<Text style={styles.unitSuffix}>{preferredUnit === 'imperial' ? 'lb' : 'kg'}</Text>}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button label="Save Changes" icon="check" onPress={handleSave} loading={loading} />
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
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  readOnlyField: {
    marginBottom: -theme.spacing.xs,
  },
  readOnlyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readOnlyNoteText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  unitSuffix: {
    ...theme.text.label,
    color: theme.colors.textMuted,
  },
  errorText: {
    ...theme.text.caption,
    color: theme.colors.error,
  },
});
