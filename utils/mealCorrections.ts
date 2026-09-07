import type { Correction, FoodItem } from '@/types/models';

type DraftCorrection = Omit<Correction, 'id' | 'createdAt' | 'userId' | 'mealId'>;

/**
 * Compares the AI's original detected foods against what the user ended up
 * confirming, and produces one Correction record per meaningful change.
 * These feed the future "Smart Meal Memory" Pro feature — see the Meal
 * type's doc comment in types/models.ts for why the original prediction is
 * never mutated in place.
 */
export function diffFoodCorrections(original: FoodItem[], final: FoodItem[]): DraftCorrection[] {
  const corrections: DraftCorrection[] = [];
  const originalById = new Map(original.map((f) => [f.id, f]));
  const finalById = new Map(final.map((f) => [f.id, f]));

  for (const food of original) {
    if (!finalById.has(food.id)) {
      corrections.push({ foodName: food.name, field: 'removed', aiValue: food.portionLabel });
    }
  }

  for (const food of final) {
    const originalFood = originalById.get(food.id);
    if (!originalFood) {
      corrections.push({ foodName: food.name, field: 'added', correctedValue: food.portionLabel });
      continue;
    }
    if (originalFood.portionLabel !== food.portionLabel) {
      corrections.push({
        foodName: food.name,
        field: 'portion',
        aiValue: originalFood.portionLabel,
        correctedValue: food.portionLabel,
      });
    }
    if (originalFood.calories !== food.calories) {
      corrections.push({
        foodName: food.name,
        field: 'calories',
        aiValue: originalFood.calories,
        correctedValue: food.calories,
      });
    }
  }

  return corrections;
}
