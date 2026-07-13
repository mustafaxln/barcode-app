import type { NutritionInfo } from '../lib/types';
import { getNutrientLevel, NUTRIENT_LEVEL_CLASSES, NUTRIENT_LEVEL_LABEL } from '../lib/nutritionThresholds';

interface Row {
  label: string;
  value: number | undefined;
  unit: string;
  nutrientKey?: 'fat' | 'saturatedFat' | 'sugars' | 'salt';
}

export function NutritionTable({ nutrition }: { nutrition?: NutritionInfo }) {
  if (!nutrition) {
    return <p className="text-sm text-neutral-400">Bu ürün için besin değeri bilgisi bulunamadı.</p>;
  }

  const allRows = [
    { label: 'Enerji', value: nutrition.energyKcal, unit: 'kcal' },
    { label: 'Yağ', value: nutrition.fat, unit: 'g', nutrientKey: 'fat' },
    { label: 'Doymuş Yağ', value: nutrition.saturatedFat, unit: 'g', nutrientKey: 'saturatedFat' },
    { label: 'Karbonhidrat', value: nutrition.carbohydrates, unit: 'g' },
    { label: 'Şeker', value: nutrition.sugars, unit: 'g', nutrientKey: 'sugars' },
    { label: 'Lif', value: nutrition.fiber, unit: 'g' },
    { label: 'Protein', value: nutrition.proteins, unit: 'g' },
    { label: 'Tuz', value: nutrition.salt, unit: 'g', nutrientKey: 'salt' },
  ] satisfies Row[];
  const rows = allRows.filter((row) => row.value !== undefined);

  if (rows.length === 0) {
    return <p className="text-sm text-neutral-400">Bu ürün için besin değeri bilgisi bulunamadı.</p>;
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-neutral-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-400">
            <th className="px-3 py-2 font-medium">Besin Değeri (100g)</th>
            <th className="px-3 py-2 font-medium">Miktar</th>
            <th className="px-3 py-2 font-medium">Seviye</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const level = row.nutrientKey ? getNutrientLevel(row.nutrientKey, row.value) : null;
            return (
              <tr key={row.label} className="border-b border-neutral-100 last:border-0">
                <td className="px-3 py-2 text-neutral-700">{row.label}</td>
                <td className="px-3 py-2 font-mono text-neutral-900">
                  {row.value}
                  {row.unit}
                </td>
                <td className="px-3 py-2">
                  {level && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${NUTRIENT_LEVEL_CLASSES[level]}`}
                    >
                      {NUTRIENT_LEVEL_LABEL[level]}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
