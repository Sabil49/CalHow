/**
 * Domain models shared across the app. These mirror the Firestore schema:
 *
 *   users/{uid}
 *   users/{uid}/meals/{mealId}
 *   users/{uid}/weightLogs/{weightLogId}
 *   users/{uid}/corrections/{correctionId}
 *
 * Firestore Timestamps are converted to `Date` at the service boundary
 * (see services/firestore.ts) so the rest of the app never deals with
 * the Firestore SDK's Timestamp type directly.
 */

export type Gender = 'female' | 'male' | 'other' | 'prefer_not_to_say';

export type UnitSystem = 'metric' | 'imperial';

export type GoalType = 'lose_weight' | 'maintain_weight' | 'build_muscle' | 'live_healthier';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type SubscriptionTier = 'free' | 'pro';

export type SubscriptionPeriod = 'monthly' | 'yearly';

export interface UserGoals {
  goalType: GoalType;
  activityLevel: ActivityLevel;
  targetWeightKg?: number;
  weeklyPaceKg?: number;
  dailyCalorieTarget?: number;
  macroTargets?: {
    proteinG: number;
    carbsG: number;
    fatsG: number;
    fiberG?: number;
  };
}

export type DietType =
  | 'none'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'keto'
  | 'paleo'
  | 'halal'
  | 'kosher';

export interface DietaryPreferences {
  dietType?: DietType;
  /** Free-form allergy/intolerance tags, e.g. "peanuts", "shellfish", "dairy". */
  allergies?: string[];
  /** Ingredients the user wants flagged/avoided, e.g. "cilantro". */
  dislikedIngredients?: string[];
}

/**
 * Reminder preferences only — these are persisted settings, NOT a
 * guarantee that a notification will actually fire. See
 * services/notifications.ts (currently absent — expo-notifications isn't
 * installed in this project) before assuming reminders are functional.
 * Times are stored as "HH:mm" 24-hour strings for unambiguous canonical
 * storage regardless of the device's locale/unit preferences.
 */
export interface ReminderPreferences {
  mealRemindersEnabled: boolean;
  breakfastTime?: string;
  lunchTime?: string;
  dinnerTime?: string;
  weightReminderEnabled: boolean;
  /** 0 (Sunday) - 6 (Saturday). */
  weightReminderDay?: number;
  weightReminderTime?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  fullName: string;
  photoUrl?: string | null;
  gender?: Gender;
  dateOfBirth?: string; // ISO date (YYYY-MM-DD)
  heightCm?: number;
  currentWeightKg?: number;
  bodyFatPercent?: number;
  waistCircumferenceCm?: number;
  preferredUnit: UnitSystem;
  goals?: UserGoals;
  dietaryPreferences?: DietaryPreferences;
  reminders?: ReminderPreferences;
  onboardingComplete: boolean;
  subscription: {
    tier: SubscriptionTier;
    period?: SubscriptionPeriod;
    trialEndsAt?: Date;
    renewsAt?: Date;
  };
  streakDays: number;
  memberSince: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodItem {
  id: string;
  name: string;
  portionLabel: string; // e.g. "1/2 cup (90 g)"
  portionGrams?: number;
  calories: number;
  confidence?: number; // 0-1
  imageUrl?: string;
}

export type OilAmount = 'none' | 'light' | 'regular' | 'heavy';

export interface ClarificationQuestion {
  id: string;
  question: string;
  helperText?: string;
  options: { id: string; label: string; description?: string }[];
}

export interface ClarificationAnswer {
  questionId: string;
  optionId: string;
}

/**
 * Raw AI output from the Next.js backend. This is preserved as-is on the
 * Meal document even after the user edits/corrects the result, so future
 * "Smart Meal Memory" features can learn from the diff between prediction
 * and correction.
 */
export interface AiMealPrediction {
  foods: FoodItem[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  confidence: number;
  clarificationQuestions?: ClarificationQuestion[];
  modelVersion?: string;
  analyzedAt: string; // ISO timestamp from backend
}

export interface UserMealCorrections {
  foods?: FoodItem[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  fiber?: number;
}

export interface Meal {
  id: string;
  userId: string;
  mealType: MealType;
  imageUrl?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  foods: FoodItem[];
  /** Original, untouched AI response — never overwritten. */
  aiPrediction: AiMealPrediction;
  clarificationAnswers?: ClarificationAnswer[];
  /** Diff applied by the user on top of the AI prediction, if any. */
  userCorrections?: UserMealCorrections;
  confidence?: number;
  isSaved: boolean;
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeightLog {
  id: string;
  userId: string;
  weightKg: number;
  note?: string;
  loggedAt: Date;
  createdAt: Date;
}

/**
 * Free-form record of a user editing an AI-detected food item. Used to
 * seed the future "Smart Meal Memory" feature (Pro).
 */
export interface Correction {
  id: string;
  userId: string;
  mealId: string;
  foodName: string;
  field: 'portion' | 'calories' | 'protein' | 'carbs' | 'fats' | 'fiber' | 'removed' | 'added';
  aiValue?: string | number;
  correctedValue?: string | number;
  createdAt: Date;
}

export interface DailyNutritionSummary {
  date: string; // YYYY-MM-DD
  calories: number;
  calorieGoal: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
}
