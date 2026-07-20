import { useState } from 'react';
import type { ScoreReason, ScoreResult } from '../lib/scoring';
import { SCORE_LABEL_META } from '../lib/scoring';
import { getAdditiveInfo } from '../lib/additives';
import { useLanguage, type TranslateFn } from '../lib/i18n/LanguageContext';

const SEVERITY_DOT: Record<ScoreReason['severity'], string> = {
  critical: 'bg-danger-500',
  warning: 'bg-warn-500',
  info: 'bg-neutral-300',
};

function reasonText(reason: ScoreReason, t: TranslateFn): string {
  switch (reason.type) {
    case 'allergenMatch':
      return t('score.reason.allergenMatch', { allergen: t(`allergens.${reason.allergenId}`) });
    case 'veganConflict':
      return t('score.reason.veganConflict');
    case 'vegetarianConflict':
      return t('score.reason.vegetarianConflict');
    case 'glutenConflict':
      return t('score.reason.glutenConflict');
    case 'lactoseConflict':
      return t('score.reason.lactoseConflict');
    case 'nutrientLevel': {
      const nutrient = t(`score.nutrientName.${reason.nutrient}`);
      const level = t(`score.levelWord.${reason.level}`);
      const trackedSuffix = reason.tracked ? t('score.reason.trackedSuffix') : '';
      return t('score.reason.nutrientLevel', { nutrient, level, trackedSuffix });
    }
    case 'additiveNote': {
      const info = getAdditiveInfo(reason.tag, t);
      return t('score.reason.additiveNote', {
        code: reason.tag.toUpperCase(),
        name: info?.name ?? reason.tag.toUpperCase(),
        description: info?.description ?? '',
      });
    }
    case 'noConflict':
      return t('score.reason.noConflict');
  }
}

export function ScoreBadge({ result }: { result: ScoreResult }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const meta = SCORE_LABEL_META[result.label];

  return (
    <div className="w-full rounded-2xl border border-neutral-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${meta.badgeClassName}`}>
            {result.score}
          </div>
          <div>
            <p className={`text-sm font-semibold ${meta.textClassName}`}>{t(`score.label.${result.label}`)}</p>
            <p className="text-xs text-neutral-400">{t('score.subtitle')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          {expanded ? t('score.hideReasons') : t('score.showReasons')}
        </button>
      </div>

      {expanded && (
        <ul className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-3 text-left">
          {result.reasons.map((reason, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-neutral-600">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT[reason.severity]}`} />
              {reasonText(reason, t)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
