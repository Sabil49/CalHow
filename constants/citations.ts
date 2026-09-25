export interface Citation {
  id: CitationId;
  title: string;
  body: string;
  sourceLabel: string;
  url: string;
}

export type CitationId =
  | 'bmr'
  | 'activity'
  | 'pace'
  | 'calorieFloor'
  | 'defaultGoal'
  | 'macros'
  | 'fiber'
  | 'foodData';

/**
 * Every formula/threshold behind CalHow's calorie, macro and pace
 * recommendations (utils/nutrition.ts, utils/mealInsights.ts), each paired
 * with the public source it's drawn from — required by App Store guideline
 * 1.4.1 (health info needs a findable citation). Rendered in full by
 * app/settings/sources.tsx, and linked inline (by id) from every screen that
 * shows a number derived from them — Home's "Today's intake" card via
 * IntakeSources, and TargetsSection — so the citation sits next to the claim.
 */
export const CITATIONS: Citation[] = [
  {
    id: 'bmr',
    title: 'Daily calorie target (BMR)',
    body: "Your \"Recommended\" daily calorie target starts from your Basal Metabolic Rate, estimated with the Mifflin-St Jeor equation — a formula derived from measured resting energy expenditure in 498 adults.",
    sourceLabel: 'Mifflin MD, St Jeor ST, et al. — Am J Clin Nutr, 1990',
    url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/',
  },
  {
    id: 'activity',
    title: 'Activity level adjustment',
    body: 'Your BMR is scaled by an activity multiplier (sedentary through very active) to estimate total daily energy expenditure — the same Physical Activity Level concept used in the national Dietary Reference Intakes for Energy.',
    sourceLabel: 'National Academies — Dietary Reference Intakes for Energy',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK591034/',
  },
  {
    id: 'pace',
    title: 'Weekly weight loss / gain pace',
    body: 'The weekly pace options CalHow suggests fall within the range public health guidance associates with sustainable, more easily maintained weight loss, rather than faster, harder-to-sustain rates.',
    sourceLabel: 'CDC — Losing Weight',
    url: 'https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html',
  },
  {
    id: 'calorieFloor',
    title: 'Minimum calorie floor',
    body: "CalHow never suggests a target below 1,200 kcal/day. That floor matches the lower bound used in clinical weight-management guidance, below which a diet is unlikely to meet basic nutrient needs without supervision.",
    sourceLabel: 'Mayo Clinic — Calorie Calculator',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/weight-loss/in-depth/calorie-calculator/itt-20402304',
  },
  {
    id: 'defaultGoal',
    title: 'Default 2,000 kcal goal',
    body: "Until you set up your personal target, Today's intake is measured against 2,000 kcal/day — the reference intake the FDA uses for the % Daily Values on every Nutrition Facts label. It's a general reference, not a personal recommendation.",
    sourceLabel: 'FDA — Nutrition Facts Label',
    url: 'https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label',
  },
  {
    id: 'macros',
    title: 'Macro split (protein / carbs / fat)',
    body: "CalHow's default macro targets fall inside the Acceptable Macronutrient Distribution Ranges for adults — roughly 10-35% protein, 45-65% carbohydrate and 20-35% fat of total calories.",
    sourceLabel: 'National Academies — Dietary Reference Intakes for Macronutrients',
    url: 'https://nap.nationalacademies.org/catalog/10490/dietary-reference-intakes-for-energy-carbohydrate-fiber-fat-fatty-acids-cholesterol-protein-and-amino-acids',
  },
  {
    id: 'fiber',
    title: 'Fiber guidance',
    body: 'Meal insights that flag a meal as "good in fiber" use a threshold well within a day\'s worth of the FDA Daily Value for fiber, which is 28 grams per day on a 2,000-calorie diet.',
    sourceLabel: 'FDA — Nutrition Facts Label',
    url: 'https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label',
  },
  {
    id: 'foodData',
    title: 'Calories & macros for scanned foods',
    body: "When CalHow's AI identifies food in a photo, the calorie and macro values for each food come from a public nutrition database, not from the AI itself.",
    sourceLabel: 'USDA FoodData Central',
    url: 'https://fdc.nal.usda.gov/',
  },
];

export function getCitation(id: CitationId): Citation {
  const citation = CITATIONS.find((c) => c.id === id);
  if (!citation) throw new Error(`Unknown citation: ${id}`);
  return citation;
}
