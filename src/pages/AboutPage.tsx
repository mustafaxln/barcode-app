import { useLanguage } from '../lib/i18n/LanguageContext';

export function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-8 text-sm leading-relaxed text-neutral-600">
      <h1 className="text-2xl font-bold text-brand-700">{t('about.title')}</h1>

      <p>{t('about.intro')}</p>

      <h2 className="font-semibold text-neutral-800">{t('about.dataSourceTitle')}</h2>
      <p>
        {t('about.dataSourceBefore')}{' '}
        <a
          href="https://world.openfoodfacts.org"
          target="_blank"
          rel="noreferrer"
          className="text-brand-600 underline"
        >
          {t('about.dataSourceLinkText')}
        </a>{' '}
        {t('about.dataSourceAfter')}
      </p>

      <h2 className="font-semibold text-neutral-800">{t('about.warningTitle')}</h2>
      <p>
        {t('about.warningBefore')} <strong>{t('about.warningStrong')}</strong>
        {t('about.warningAfter')}
      </p>

      <h2 className="font-semibold text-neutral-800">{t('about.dataTitle')}</h2>
      <p>{t('about.dataBody')}</p>
    </div>
  );
}
