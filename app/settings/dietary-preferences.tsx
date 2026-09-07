import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { TagInput } from '@/components/forms/TagInput';
import { Button } from '@/components/ui/Button';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { updateUserProfile } from '@/services/firestore';
import { theme } from '@/constants/theme';
import type { DietType } from '@/types/models';

const DIET_OPTIONS: { value: DietType; title: string; description: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: 'none', title: 'No preference', description: 'No specific diet', icon: 'circle' },
  { value: 'vegetarian', title: 'Vegetarian', description: 'No meat or fish', icon: 'feather' },
  { value: 'vegan', title: 'Vegan', description: 'No animal products', icon: 'feather' },
  { value: 'pescatarian', title: 'Pescatarian', description: 'Fish, no other meat', icon: 'droplet' },
  { value: 'keto', title: 'Keto', description: 'Low carb, high fat', icon: 'zap' },
  { value: 'paleo', title: 'Paleo', description: 'Whole foods, no grains', icon: 'target' },
  { value: 'halal', title: 'Halal', description: 'Halal-certified foods', icon: 'check-circle' },
  { value: 'kosher', title: 'Kosher', description: 'Kosher dietary laws', icon: 'check-circle' },
];

/**
 * Persists to `users/{uid}.dietaryPreferences` (types/models.ts). This is
 * read by whichever backend integration eventually calls the AI provider
 * for meal analysis, so the AI can factor in the user's diet/allergies —
 * that backend integration is out of scope of this Expo app.
 */
export default function DietaryPreferencesScreen() {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [dietType, setDietType] = useState<DietType>(profile?.dietaryPreferences?.dietType ?? 'none');
  const [allergies, setAllergies] = useState<string[]>(profile?.dietaryPreferences?.allergies ?? []);
  const [dislikedIngredients, setDislikedIngredients] = useState<string[]>(
    profile?.dietaryPreferences?.dislikedIngredients ?? [],
  );

  const { run: handleSave, loading, error } = useAsyncAction(async () => {
    if (!user) return;
    await updateUserProfile(user.uid, {
      dietaryPreferences: {
        dietType,
        allergies,
        dislikedIngredients,
      },
    });
    router.back();
  });

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <Text style={styles.heading}>Dietary Preferences</Text>
      <Text style={styles.subtitle}>Help CalHow's AI understand your diet, allergies and ingredients to avoid.</Text>

      <Text style={styles.sectionHeading}>Diet type</Text>
      <View style={styles.grid}>
        {DIET_OPTIONS.map((option) => (
          <SelectableCard
            key={option.value}
            layout="column"
            style={styles.gridItem}
            selected={dietType === option.value}
            onPress={() => setDietType(option.value)}
            icon={option.icon}
            iconColor={theme.colors.brandDark}
            title={option.title}
            description={option.description}
          />
        ))}
      </View>

      <View style={styles.card}>
        <TagInput label="Allergies & intolerances" placeholder="e.g. peanuts" tags={allergies} onChange={setAllergies} />
        <TagInput label="Ingredients to avoid" placeholder="e.g. cilantro" tags={dislikedIngredients} onChange={setDislikedIngredients} />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.footer}>
        <Button label="Save Preferences" icon="check" onPress={handleSave} loading={loading} />
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
  sectionHeading: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  gridItem: {
    width: '47%',
  },
  card: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    ...theme.shadows.card,
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
});
