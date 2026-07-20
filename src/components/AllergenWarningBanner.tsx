import { type AllergenId } from '../lib/sensitivities';
import { useLanguage } from '../lib/i18n/LanguageContext';

export function AllergenWarningBanner({ matchedAllergens }: { matchedAllergens: AllergenId[] }) {
  const { t } = useLanguage();
  if (matchedAllergens.length === 0) return null;

  const labels = matchedAllergens.map((id) => t(`allergens.${id}`));

  return (
    <div className="w-full rounded-xl border border-danger-500/30 bg-danger-100 px-4 py-3 text-left">
      <p className="text-sm font-semibold text-danger-500">{t('allergenBanner.title')}</p>
      <p className="mt-1 text-sm text-danger-500/90">
        {t('allergenBanner.body')} <strong>{labels.join(', ')}</strong>
      </p>
    </div>
  );
}
