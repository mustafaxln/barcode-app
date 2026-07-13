export type NutrientLevel = 'low' | 'medium' | 'high';

/**
 * UK FSA "trafik ışığı" besin profili eşikleri (100g başına, katı gıdalar için).
 * Kaynak: gov.uk nutrient profiling technical guidance — yaygın kabul görmüş, basit ve şeffaf bir referans.
 */
const THRESHOLDS: Record<'fat' | 'saturatedFat' | 'sugars' | 'salt', { low: number; high: number }> = {
  fat: { low: 3, high: 17.5 },
  saturatedFat: { low: 1.5, high: 5 },
  sugars: { low: 5, high: 22.5 },
  salt: { low: 0.3, high: 1.5 },
};

export function getNutrientLevel(
  nutrient: keyof typeof THRESHOLDS,
  valuePer100g: number | undefined
): NutrientLevel | null {
  if (valuePer100g === undefined) return null;
  const { low, high } = THRESHOLDS[nutrient];
  if (valuePer100g <= low) return 'low';
  if (valuePer100g >= high) return 'high';
  return 'medium';
}

export const NUTRIENT_LEVEL_LABEL: Record<NutrientLevel, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
};

export const NUTRIENT_LEVEL_CLASSES: Record<NutrientLevel, string> = {
  low: 'bg-brand-100 text-brand-700',
  medium: 'bg-warn-100 text-warn-500',
  high: 'bg-danger-100 text-danger-500',
};
