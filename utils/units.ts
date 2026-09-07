const KG_PER_LB = 0.45359237;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

/**
 * Canonical storage is always kg (see UserProfile.currentWeightKg /
 * UserGoals.targetWeightKg in types/models.ts) — this only formats a
 * stored kg value for display in the user's preferred unit. Never persist
 * the converted number; always convert back with lbToKg before saving.
 */
export function formatWeightKg(kg: number, unit: 'metric' | 'imperial', fractionDigits = 1): string {
  const value = unit === 'imperial' ? kgToLb(kg) : kg;
  return value.toFixed(fractionDigits);
}
