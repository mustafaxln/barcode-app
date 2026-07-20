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

// Görünen etiketler ("Düşük"/"Low" vb.) artık `t('nutrition.levels.<level>')` üzerinden geliyor.
export const NUTRIENT_LEVEL_CLASSES: Record<NutrientLevel, string> = {
  low: 'bg-brand-100 text-brand-700',
  medium: 'bg-warn-100 text-warn-500',
  high: 'bg-danger-100 text-danger-500',
};

/**
 * OFF/cache'ten gelen 116.666666666667 gibi floating-point gürültüsünü ekranda
 * okunabilir hale getirir (enerji 1 ondalık, diğerleri en fazla 2).
 */
export function formatNutrientValue(value: number, unit: string): string {
  const decimals = unit === 'kcal' ? 1 : 2;
  // toFixed + Number: "2.00" → 2 → "2", "2.35" → "2.35", "116.7" → "116.7"
  const text = String(Number(value.toFixed(decimals)));
  return `${text}${unit}`;
}
