import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Input } from '@/components/ui/Input';
import { SelectField } from '@/components/forms/SelectField';
import { DateField } from '@/components/forms/DateField';
import { Button } from '@/components/ui/Button';
import { LeafAccent } from '@/components/ui/LeafAccent';
import { PrivacyNote } from '@/components/ui/PrivacyNote';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { updateUserProfile } from '@/services/firestore';
import { kgToLb, lbToKg } from '@/utils/units';
import { calculateAge } from '@/utils/nutrition';
import { theme } from '@/constants/theme';
import type { Gender, UnitSystem } from '@/types/models';

/** CalHow's minimum age — see Settings → Terms of Use, "Who can use CalHow". */
const MINIMUM_AGE = 18;

const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

const UNIT_OPTIONS: { label: string; value: UnitSystem }[] = [
  { label: 'Kilograms (kg)', value: 'metric' },
  { label: 'Pounds (lb)', value: 'imperial' },
];

// The date picker itself can't be scrolled past this, so no one can select
// a birthdate that would make them younger than MINIMUM_AGE today.
const MAX_DOB = new Date(new Date().getFullYear() - MINIMUM_AGE, new Date().getMonth(), new Date().getDate());
const MIN_DOB = new Date(new Date().getFullYear() - 120, 0, 1);

export default function PersonalDetailsScreen() {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [gender, setGender] = useState<Gender | undefined>(profile?.gender);
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth);
  const [heightCm, setHeightCm] = useState(profile?.heightCm ? String(profile.heightCm) : '170');
  const [preferredUnit, setPreferredUnit] = useState<UnitSystem>(profile?.preferredUnit ?? 'metric');
  const [weightText, setWeightText] = useState(() => {
    const kg = profile?.currentWeightKg ?? 70;
    const value = preferredUnit === 'imperial' ? kgToLb(kg) : kg;
    return value.toFixed(1);
  });
  const [bodyFatPercent, setBodyFatPercent] = useState(
    profile?.bodyFatPercent ? String(profile.bodyFatPercent) : '',
  );
  const [waistCircumferenceCm, setWaistCircumferenceCm] = useState(
    profile?.waistCircumferenceCm ? String(profile.waistCircumferenceCm) : '',
  );

  /**
   * Re-express whatever number is currently in the weight field under the
   * new unit, so switching kg<->lb mid-entry doesn't silently change what
   * the number means (the root cause of a real weight-corruption bug —
   * this field used to just relabel the unit without converting).
   */
  function handleUnitChange(nextUnit: UnitSystem) {
    const currentValue = Number(weightText);
    if (currentValue > 0) {
      const kg = preferredUnit === 'imperial' ? lbToKg(currentValue) : currentValue;
      const displayValue = nextUnit === 'imperial' ? kgToLb(kg) : kg;
      setWeightText(displayValue.toFixed(1));
    }
    setPreferredUnit(nextUnit);
  }

  const { run: handleContinue, loading, error } = useAsyncAction(async () => {
    if (!user) return;
    if (!dateOfBirth) {
      throw new Error('Please enter your date of birth to continue.');
    }
    const age = calculateAge(dateOfBirth);
    if (age === undefined || age < MINIMUM_AGE) {
      throw new Error(`You must be at least ${MINIMUM_AGE} years old to use CalHow.`);
    }

    const weightValue = Number(weightText);
    const currentWeightKg = weightValue > 0 ? (preferredUnit === 'imperial' ? lbToKg(weightValue) : weightValue) : undefined;

    await updateUserProfile(user.uid, {
      fullName: fullName.trim(),
      gender,
      dateOfBirth,
      heightCm: Number(heightCm) || undefined,
      currentWeightKg,
      preferredUnit,
      bodyFatPercent: bodyFatPercent ? Number(bodyFatPercent) : undefined,
      waistCircumferenceCm: waistCircumferenceCm ? Number(waistCircumferenceCm) : undefined,
    });
    router.push('/onboarding/target-setup');
  });

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} />
      <LeafAccent style={styles.leaf} />

      <Text style={styles.heading}>
        Tell us about{'\n'}
        <Text style={styles.headingAccent}>yourself</Text>
      </Text>
      <Text style={styles.subtitle}>
        Your details help us calculate <Text style={styles.subtitleAccent}>accurate</Text> calorie needs for you.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardHeading}>Basic Information</Text>

        <Input label="Full Name" icon="user" placeholder="Enter your full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />

        <SelectField label="Gender" icon="user" placeholder="Select your gender" value={gender} options={GENDER_OPTIONS} onChange={setGender} />

        <View style={styles.row}>
          <View style={styles.rowField}>
            <DateField label="Date of Birth" value={dateOfBirth} onChange={setDateOfBirth} maximumDate={MAX_DOB} minimumDate={MIN_DOB} />
          </View>
          <Input
            label="Height"
            icon="chevrons-up"
            placeholder="170"
            value={heightCm}
            onChangeText={setHeightCm}
            keyboardType="number-pad"
            rightAdornment={<Text style={styles.unitSuffix}>cm</Text>}
            containerStyle={styles.rowField}
          />
        </View>

        <View style={styles.row}>
          <Input
            label="Current Weight"
            icon="bar-chart-2"
            placeholder={preferredUnit === 'imperial' ? '154' : '70'}
            value={weightText}
            onChangeText={setWeightText}
            keyboardType="decimal-pad"
            rightAdornment={<Text style={styles.unitSuffix}>{preferredUnit === 'metric' ? 'kg' : 'lb'}</Text>}
            containerStyle={styles.rowField}
          />
          <View style={styles.rowField}>
            <SelectField
              label="Preferred Unit"
              icon="sliders"
              value={preferredUnit}
              options={UNIT_OPTIONS}
              onChange={handleUnitChange}
            />
          </View>
        </View>

        <Text style={styles.optionalHeading}>Optional (Helps personalize better)</Text>

        <Input
          label="Body Fat % (Optional)"
          icon="percent"
          placeholder="Enter body fat percentage"
          value={bodyFatPercent}
          onChangeText={setBodyFatPercent}
          keyboardType="decimal-pad"
        />
        <Input
          label="Waist Circumference (Optional)"
          icon="minus"
          placeholder="Enter waist measurement"
          value={waistCircumferenceCm}
          onChangeText={setWaistCircumferenceCm}
          keyboardType="decimal-pad"
          rightAdornment={<Text style={styles.unitSuffix}>cm</Text>}
        />

        <PrivacyNote text="Don't worry, we keep your data private and secure." />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.footer}>
        <Button label="Continue" onPress={handleContinue} loading={loading} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  leaf: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.lg,
  },
  heading: {
    ...theme.text.screenHeading,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xl,
  },
  headingAccent: {
    color: theme.colors.brandPrimary,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  subtitleAccent: {
    color: theme.colors.brandPrimary,
  },
  card: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  cardHeading: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  rowField: {
    flex: 1,
  },
  unitSuffix: {
    ...theme.text.label,
    color: theme.colors.textMuted,
  },
  optionalHeading: {
    ...theme.text.label,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  errorText: {
    ...theme.text.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.lg,
  },
  footer: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
});
