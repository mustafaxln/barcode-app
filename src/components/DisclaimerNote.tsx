import { useLanguage } from '../lib/i18n/LanguageContext';

export function DisclaimerNote() {
  const { t } = useLanguage();
  return (
    <p className="mx-auto max-w-sm text-center text-xs leading-relaxed text-neutral-400">
      {t('disclaimerNote.text')}
    </p>
  );
}
