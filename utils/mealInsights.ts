interface MealMacros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
}

/**
 * Simple, rule-based insight sentence derived directly from the meal's own
 * macros (e.g. "high in protein and good in fiber") — not an AI-generated
 * or fabricated claim. Deeper, model-generated insights are a Pro feature
 * ("AI Meal Insights") for later; this is a reasonable free-tier baseline.
 */
export function generateMealInsight(macros: MealMacros): string {
  if (macros.calories <= 0) return 'Log more meals to start seeing insights here.';

  const proteinShare = (macros.protein * 4) / macros.calories;
  const carbShare = (macros.carbs * 4) / macros.calories;
  const fatShare = (macros.fats * 9) / macros.calories;
  const isHighProtein = proteinShare >= 0.25;
  const isGoodFiber = (macros.fiber ?? 0) >= 5;
  const isHighCarb = carbShare >= 0.55;
  const isHighFat = fatShare >= 0.4;

  const highlights: string[] = [];
  if (isHighProtein) highlights.push('high in protein');
  if (isGoodFiber) highlights.push('good in fiber');

  if (highlights.length > 0) {
    return `Great balance! This meal is ${highlights.join(' and ')}.`;
  }
  if (isHighCarb) return 'This meal leans carb-heavy — pairing it with a protein source next time can help balance things out.';
  if (isHighFat) return 'This meal is on the richer side in fat — worth keeping in mind for the rest of your day.';
  return 'A well-rounded meal — nice work logging it!';
}
