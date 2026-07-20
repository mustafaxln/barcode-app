import type { NutritionInfo } from '../lib/types';
import { formatNutrientValue, getNutrientLevel, NUTRIENT_LEVEL_CLASSES } from '../lib/nutritionThresholds';
import { useLanguage } from '../lib/i18n/LanguageContext';

interface Row {
  labelKey: string;
  value: number | undefined;
  unit: string;
  nutrientKey?: 'fat' | 'saturatedFat' | 'sugars' | 'salt';
}

export function NutritionTable({ nutrition }: { nutrition?: NutritionInfo }) {
  const { t } = useLanguage();

  if (!nutrition) {
    return <p className="text-sm text-neutral-400">{t('nutrition.notFound')}</p>;
  }

  const allRows = [
    { labelKey: 'nutrition.labels.energy', value: nutrition.energyKcal, unit: 'kcal' },
    { labelKey: 'nutrition.labels.fat', value: nutrition.fat, unit: 'g', nutrientKey: 'fat' },
    {
      labelKey: 'nutrition.labels.saturatedFat',
      value: nutrition.saturatedFat,
      unit: 'g',
      nutrientKey: 'saturatedFat',
    },
    { labelKey: 'nutrition.labels.carbohydrates', value: nutrition.carbohydrates, unit: 'g' },
    { labelKey: 'nutrition.labels.sugars', value: nutrition.sugars, unit: 'g', nutrientKey: 'sugars' },
    { labelKey: 'nutrition.labels.fiber', value: nutrition.fiber, unit: 'g' },
    { labelKey: 'nutrition.labels.proteins', value: nutrition.proteins, unit: 'g' },
    { labelKey: 'nutrition.labels.salt', value: nutrition.salt, unit: 'g', nutrientKey: 'salt' },
  ] satisfies Row[];
  const rows = allRows.filter((row) => row.value !== undefined);

  if (rows.length === 0) {
    return <p className="text-sm text-neutral-400">{t('nutrition.notFound')}</p>;
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-neutral-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-400">
            <th className="px-3 py-2 font-medium">{t('nutrition.tableHeader')}</th>
            <th className="px-3 py-2 font-medium">{t('nutrition.amount')}</th>
            <th className="px-3 py-2 font-medium">{t('nutrition.level')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const level = row.nutrientKey ? getNutrientLevel(row.nutrientKey, row.value) : null;
            return (
              <tr key={row.labelKey} className="border-b border-neutral-100 last:border-0">
                <td className="px-3 py-2 text-neutral-700">{t(row.labelKey)}</td>
                <td className="px-3 py-2 font-mono text-neutral-900">
                  {formatNutrientValue(row.value!, row.unit)}
                </td>
                <td className="px-3 py-2">
                  {level && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${NUTRIENT_LEVEL_CLASSES[level]}`}>
                      {t(`nutrition.levels.${level}`)}
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
