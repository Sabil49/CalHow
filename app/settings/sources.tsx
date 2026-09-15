import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Card } from '@/components/ui/Card';
import { useUserProfile } from '@/hooks/useUserProfile';
import { theme } from '@/constants/theme';

interface Citation {
  title: string;
  body: string;
  sourceLabel: string;
  url: string;
}

/**
 * Every formula/threshold behind CalHow's calorie, macro and pace
 * recommendations (utils/nutrition.ts, utils/mealInsights.ts), each paired
 * with the public source it's drawn from — required by App Store guideline
 * 1.4.1 (health info needs a findable citation). Linked from the Settings
 * menu and inline from TargetsSection wherever a number derived from these
 * shows up, so the citation sits close to the claim it backs.
 */
const CITATIONS: Citation[] = [
  {
    title: 'Daily calorie target (BMR)',
    body: "Your \"Recommended\" daily calorie target starts from your Basal Metabolic Rate, estimated with the Mifflin-St Jeor equation — a formula derived from measured resting energy expenditure in 498 adults.",
    sourceLabel: 'Mifflin MD, St Jeor ST, et al. — Am J Clin Nutr, 1990',
    url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/',
  },
  {
    title: 'Activity level adjustment',
    body: 'Your BMR is scaled by an activity multiplier (sedentary through very active) to estimate total daily energy expenditure — the same Physical Activity Level concept used in the national Dietary Reference Intakes for Energy.',
    sourceLabel: 'National Academies — Dietary Reference Intakes for Energy',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK591034/',
  },
  {
    title: 'Weekly weight loss / gain pace',
    body: 'The weekly pace options CalHow suggests fall within the range public health guidance associates with sustainable, more easily maintained weight loss, rather than faster, harder-to-sustain rates.',
    sourceLabel: 'CDC — Losing Weight',
    url: 'https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html',
  },
  {
    title: 'Minimum calorie floor',
    body: "CalHow never suggests a target below 1,200 kcal/day. That floor matches the lower bound used in clinical weight-management guidance, below which a diet is unlikely to meet basic nutrient needs without supervision.",
    sourceLabel: 'Mayo Clinic — Calorie Calculator',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/weight-loss/in-depth/calorie-calculator/itt-20402304',
  },
  {
    title: 'Macro split (protein / carbs / fat)',
    body: "CalHow's default macro targets fall inside the Acceptable Macronutrient Distribution Ranges for adults — roughly 10-35% protein, 45-65% carbohydrate and 20-35% fat of total calories.",
    sourceLabel: 'Dietary Guidelines for Americans, 2020-2025',
    url: 'https://www.dietaryguidelines.gov/sites/default/files/2021-03/Dietary_Guidelines_for_Americans-2020-2025.pdf',
  },
  {
    title: 'Fiber guidance',
    body: 'Meal insights that flag a meal as "good in fiber" use a threshold well within a day\'s worth of the FDA Daily Value for fiber, which is 28 grams per day on a 2,000-calorie diet.',
    sourceLabel: 'FDA — Nutrition Facts Label',
    url: 'https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label',
  },
  {
    title: 'Calories & macros for scanned foods',
    body: "When CalHow's AI identifies food in a photo, the calorie and macro values for each food come from a public nutrition database, not from the AI itself.",
    sourceLabel: 'USDA FoodData Central',
    url: 'https://fdc.nal.usda.gov/',
  },
];

export default function SourcesScreen() {
  const { profile } = useUserProfile();

  function openSource(url: string) {
    Linking.openURL(url).catch(() => {});
  }

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <Text style={styles.heading}>Sources & Citations</Text>
      <Text style={styles.subtitle}>
        Where the calorie, macro and pace numbers CalHow shows you come from.
      </Text>

      <Card style={styles.noticeCard}>
        <Feather name="info" size={16} color={theme.colors.brandDark} />
        <Text style={styles.noticeText}>
          These are general estimates based on public health formulas and guidance, not a medical calculation.
          They don't account for medical conditions, medications or individual health history — talk to a doctor
          or registered dietitian before making significant changes to your diet.
        </Text>
      </Card>

      {CITATIONS.map((citation) => (
        <Card key={citation.title} style={styles.card}>
          <Text style={styles.cardTitle}>{citation.title}</Text>
          <Text style={styles.cardBody}>{citation.body}</Text>
          <Pressable style={styles.sourceRow} onPress={() => openSource(citation.url)}>
            <Feather name="external-link" size={14} color={theme.colors.brandDark} />
            <Text style={styles.sourceText}>{citation.sourceLabel}</Text>
          </Pressable>
        </Card>
      ))}

      <View style={styles.footer} />
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
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.brandTint,
  },
  noticeText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  card: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  cardTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  cardBody: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sourceText: {
    ...theme.text.caption,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.brandDark,
  },
  footer: {
    marginBottom: theme.spacing.lg,
  },
});
