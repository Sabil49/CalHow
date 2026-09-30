import type { Meal } from '@/types/models';
import { localDayKey } from './advancedAnalytics';

/**
 * CalHow Pro "What Should I Eat Next?" — suggests meals the user has
 * actually logged before that fit what's left of today's calorie budget,
 * favoring protein when they're behind on it. Suggestions are always
 * real past meals with their real, already-calculated nutrition — nothing
 * here invents a food or a calorie number.
 */

export interface EatNextInput {
  history: Meal[];
  today: { calories: number; protein: number };
  calorieGoal: number;
  proteinGoal?: number;
  now?: Date;
}

export interface EatNextSuggestion {
  meal: Meal;
  /** How many times a meal with the same foods has been logged. */
  timesLogged: number;
}

export interface EatNextResult {
  remainingCalories: number;
  /** null when the user has no protein goal. */
  remainingProtein: number | null;
  status: 'suggestions' | 'goal_reached' | 'no_match';
  suggestions: EatNextSuggestion[];
}

/** Below this many kcal left, there's nothing sensible to suggest. */
const MIN_REMAINING_KCAL = 100;

function mealSignature(meal: Meal): string {
  return meal.foods
    .map((f) => f.name.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join('|');
}

export function suggestNextMeals({ history, today, calorieGoal, proteinGoal, now = new Date() }: EatNextInput): EatNextResult {
  const remainingCalories = Math.round(calorieGoal - today.calories);
  const remainingProtein = proteinGoal != null ? Math.max(0, Math.round(proteinGoal - today.protein)) : null;

  if (remainingCalories < MIN_REMAINING_KCAL) {
    return { remainingCalories, remainingProtein, status: 'goal_reached', suggestions: [] };
  }

  // One entry per distinct meal (same set of foods). The same foods can be
  // logged at very different sizes, so the suggested copy is the most
  // recent one that fits the budget, while timesLogged counts them all.
  const todayKey = localDayKey(now);
  const fits = (meal: Meal) => meal.calories >= 50 && meal.calories <= remainingCalories * 1.05;
  const bySignature = new Map<string, { timesLogged: number; best: Meal | null }>();
  for (const meal of history) {
    if (localDayKey(meal.loggedAt) === todayKey) continue;
    const signature = mealSignature(meal);
    if (!signature) continue;
    const entry = bySignature.get(signature) ?? { timesLogged: 0, best: null };
    entry.timesLogged++;
    if (fits(meal) && (!entry.best || meal.loggedAt > entry.best.loggedAt)) entry.best = meal;
    bySignature.set(signature, entry);
  }

  const needsProtein = remainingProtein != null && remainingProtein >= 15;
  const scored = [...bySignature.values()]
    .filter((entry): entry is { timesLogged: number; best: Meal } => entry.best != null)
    .map(({ best: meal, timesLogged }) => {
      const proteinShare = meal.calories > 0 ? (meal.protein * 4) / meal.calories : 0; // 0-1
      const budgetUse = Math.min(1, meal.calories / remainingCalories); // a mild preference for meals that use a good part of what's left
      const familiarity = Math.min(1, Math.log2(timesLogged + 1) / 3);
      const score = (needsProtein ? 2 : 0.5) * proteinShare + 0.5 * budgetUse + 0.5 * familiarity;
      return { candidate: { meal, timesLogged }, score };
    })
    .sort((a, b) => b.score - a.score);

  const suggestions = scored.slice(0, 3).map((s) => s.candidate);
  return { remainingCalories, remainingProtein, status: suggestions.length > 0 ? 'suggestions' : 'no_match', suggestions };
}
