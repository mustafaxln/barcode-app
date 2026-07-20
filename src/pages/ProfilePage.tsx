import { Link } from 'react-router-dom';
import { ALLERGEN_OPTIONS } from '../lib/sensitivities';
import { useSensitivities } from '../hooks/useSensitivities';
import { ToggleChip } from '../components/ToggleChip';
import { DisclaimerNote } from '../components/DisclaimerNote';
import { useLanguage } from '../lib/i18n/LanguageContext';

export function ProfilePage() {
  const { sensitivities, toggleAllergen, toggleFlag } = useSensitivities();
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand-700">{t('profile.title')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('profile.subtitle')}</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          {t('profile.allergensTitle')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {ALLERGEN_OPTIONS.map((option) => (
            <ToggleChip
              key={option.id}
              label={t(`allergens.${option.id}`)}
              active={sensitivities.allergens.includes(option.id)}
              onClick={() => toggleAllergen(option.id)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          {t('profile.dietTitle')}
        </h2>
        <div className="flex flex-wrap gap-2">
          <ToggleChip
            label={t('profile.diet.vegan')}
            active={sensitivities.vegan}
            onClick={() => toggleFlag('vegan')}
          />
          <ToggleChip
            label={t('profile.diet.vegetarian')}
            active={sensitivities.vegetarian}
            onClick={() => toggleFlag('vegetarian')}
          />
          <ToggleChip
            label={t('profile.diet.glutenFree')}
            active={sensitivities.glutenFree}
            onClick={() => toggleFlag('glutenFree')}
          />
          <ToggleChip
            label={t('profile.diet.lactoseFree')}
            active={sensitivities.lactoseFree}
            onClick={() => toggleFlag('lactoseFree')}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          {t('profile.trackTitle')}
        </h2>
        <p className="mb-3 text-xs text-neutral-400">{t('profile.trackSubtitle')}</p>
        <div className="flex flex-wrap gap-2">
          <ToggleChip
            label={t('profile.track.sugar')}
            active={sensitivities.trackSugar}
            onClick={() => toggleFlag('trackSugar')}
          />
          <ToggleChip
            label={t('profile.track.salt')}
            active={sensitivities.trackSalt}
            onClick={() => toggleFlag('trackSalt')}
          />
          <ToggleChip
            label={t('profile.track.fat')}
            active={sensitivities.trackFat}
            onClick={() => toggleFlag('trackFat')}
          />
        </div>
      </section>

      <DisclaimerNote />
      <Link to="/hakkinda" className="text-center text-xs font-medium text-neutral-400 hover:underline">
        {t('profile.aboutLink')}
      </Link>
    </div>
  );
}
