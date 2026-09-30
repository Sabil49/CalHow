import type { ActivityLevel, Gender, GoalType } from '@/types/models';

/**
 * Rough client-side estimates used to pre-fill onboarding (e.g. the
 * "Recommended" daily calorie target, the projected goal date). These are
 * intentionally simple (Mifflin-St Jeor + standard activity multipliers)
 * and are meant as a reasonable starting point the user can see and the
 * backend/future "Custom Goals & Macros" Pro feature can refine — not a
 * medical calculation.
 */

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const KCAL_PER_KG_FAT = 7700;

/** Fallback shown before a user has a real `goals.dailyCalorieTarget` (e.g. before onboarding finishes). */
export const DEFAULT_CALORIE_GOAL = 2000;

export function calculateAge(dateOfBirthIso: string | undefined): number | undefined {
  if (!dateOfBirthIso) return undefined;
  const dob = new Date(dateOfBirthIso);
  if (Number.isNaN(dob.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

interface BmrInput {
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  age?: number;
}

/** Mifflin-St Jeor equation. Falls back to sensible averages when a field is missing. */
export function estimateBmr({ gender, heightCm = 165, weightKg = 70, age = 30 }: BmrInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') return base + 5;
  if (gender === 'female') return base - 161;
  // 'other' / 'prefer_not_to_say' / unset: split the difference rather than guessing.
  return base - 78;
}

interface DailyCalorieTargetInput extends BmrInput {
  activityLevel?: ActivityLevel;
  goalType?: GoalType;
  weeklyPaceKg?: number;
}

export function estimateDailyCalorieTarget({
  activityLevel = 'sedentary',
  goalType = 'maintain_weight',
  weeklyPaceKg = 0.25,
  ...bmrInput
}: DailyCalorieTargetInput): number {
  const bmr = estimateBmr(bmrInput);
  const tdee = bmr * ACTIVITY_MULTIPLIER[activityLevel];

  let target = tdee;
  if (goalType === 'lose_weight') {
    target = tdee - (weeklyPaceKg * KCAL_PER_KG_FAT) / 7;
  } else if (goalType === 'build_muscle') {
    target = tdee + 300;
  }

  // Never suggest something dangerously low.
  target = Math.max(target, 1200);
  return Math.round(target / 10) * 10;
}

/**
 * Suggested macro split (grams) for a given calorie target — 25/50/25
 * protein/carb/fat, chosen to sit inside every Acceptable Macronutrient
 * Distribution Range (MACRO_RANGES below) with room for rounding, as the
 * Sources & Citations screen states. (It used to be 30/40/30, whose 40%
 * carbs fell below the 45% AMDR floor that screen cites.)
 */
export function estimateMacroTargets(calorieTarget: number) {
  return {
    proteinG: Math.round((calorieTarget * 0.25) / 4),
    carbsG: Math.round((calorieTarget * 0.5) / 4),
    fatsG: Math.round((calorieTarget * 0.25) / 9),
    fiberG: 25,
  };
}

/** Lowest daily calorie target CalHow accepts — same floor as estimateDailyCalorieTarget (see Sources & Citations, "Minimum calorie floor"). */
export const MIN_CALORIE_TARGET = 1200;
export const MAX_CALORIE_TARGET = 6000;

/** Acceptable Macronutrient Distribution Ranges for adults, as % of calories (National Academies DRI — see constants/citations.ts, "macros"). */
export const MACRO_RANGES = {
  protein: { min: 10, max: 35 },
  carbs: { min: 45, max: 65 },
  fats: { min: 20, max: 35 },
} as const;

export interface CustomTargetsInput {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

export interface CustomTargetsCheck {
  /** Calories implied by the macro grams (4/4/9 kcal per gram). */
  macroCalories: number;
  /** Each macro's share of `macroCalories`, rounded to whole %. 0 when no macros entered. */
  percent: { protein: number; carbs: number; fats: number };
  /** Blocking problems — saving is not allowed while any exist. */
  errors: string[];
  /** Non-blocking advice (outside the AMDR, macros don't add up to the calorie target). */
  warnings: string[];
}

/**
 * Validates a Pro user's hand-entered calorie and macro targets. Anything
 * outside the calorie floor/ceiling is blocked; a macro split outside the
 * AMDR, or macros that don't roughly add up to the calorie target, is only
 * flagged — people on keto, high-protein etc. diets legitimately go outside
 * those ranges, and it's their call.
 */
export function checkCustomTargets({ calories, proteinG, carbsG, fatsG }: CustomTargetsInput): CustomTargetsCheck {
  const errors: string[] = [];
  const warnings: string[] = [];

  const valid = (n: number) => Number.isFinite(n) && n >= 0;
  if (!valid(calories) || !valid(proteinG) || !valid(carbsG) || !valid(fatsG)) {
    errors.push('Please enter a number for every target.');
  }
  if (calories < MIN_CALORIE_TARGET) {
    errors.push(`Daily calories can't be below ${MIN_CALORIE_TARGET.toLocaleString()} kcal — below that, a diet is unlikely to meet basic nutrient needs without medical supervision.`);
  } else if (calories > MAX_CALORIE_TARGET) {
    errors.push(`Daily calories can't be above ${MAX_CALORIE_TARGET.toLocaleString()} kcal.`);
  }

  const macroCalories = Math.round(proteinG * 4 + carbsG * 4 + fatsG * 9);
  const pct = (kcal: number) => (macroCalories > 0 ? Math.round((kcal / macroCalories) * 100) : 0);
  const percent = { protein: pct(proteinG * 4), carbs: pct(carbsG * 4), fats: pct(fatsG * 9) };

  if (errors.length === 0 && macroCalories > 0) {
    if (Math.abs(macroCalories - calories) > calories * 0.1) {
      warnings.push(`Your macros add up to ${macroCalories.toLocaleString()} kcal, which is more than 10% away from your ${calories.toLocaleString()} kcal target.`);
    }
    const outside = (Object.keys(MACRO_RANGES) as (keyof typeof MACRO_RANGES)[]).filter(
      (key) => percent[key] < MACRO_RANGES[key].min || percent[key] > MACRO_RANGES[key].max,
    );
    if (outside.length > 0) {
      const names = { protein: 'Protein', carbs: 'Carbs', fats: 'Fat' };
      warnings.push(
        `${outside.map((key) => `${names[key]} (${percent[key]}%)`).join(', ')} ${outside.length === 1 ? 'is' : 'are'} outside the generally recommended range for adults. That can be fine for specific diets — check with a doctor or dietitian if unsure.`,
      );
    }
  }

  return { macroCalories, percent, errors, warnings };
}

/** Projected date to reach `targetWeightKg` at `weeklyPaceKg` per week from `currentWeightKg`. */
export function estimateGoalDate(
  currentWeightKg: number,
  targetWeightKg: number,
  weeklyPaceKg: number,
): Date | undefined {
  if (weeklyPaceKg <= 0) return undefined;
  const diffKg = Math.abs(currentWeightKg - targetWeightKg);
  if (diffKg === 0) return new Date();
  const weeks = diffKg / weeklyPaceKg;
  const date = new Date();
  date.setDate(date.getDate() + Math.round(weeks * 7));
  return date;
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

/** "Good morning" / "Good afternoon" / "Good evening" based on the current local hour. */
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
