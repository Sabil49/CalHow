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

/** Suggested macro split (grams) for a given calorie target — simple 30/40/30 protein/carb/fat baseline. */
export function estimateMacroTargets(calorieTarget: number) {
  return {
    proteinG: Math.round((calorieTarget * 0.3) / 4),
    carbsG: Math.round((calorieTarget * 0.4) / 4),
    fatsG: Math.round((calorieTarget * 0.3) / 9),
    fiberG: 25,
  };
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
