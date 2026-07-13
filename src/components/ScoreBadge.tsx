import { useState } from 'react';
import type { ScoreResult } from '../lib/scoring';
import { SCORE_LABEL_META } from '../lib/scoring';

const SEVERITY_DOT: Record<ScoreResult['reasons'][number]['severity'], string> = {
  critical: 'bg-danger-500',
  warning: 'bg-warn-500',
  info: 'bg-neutral-300',
};

export function ScoreBadge({ result }: { result: ScoreResult }) {
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
            <p className={`text-sm font-semibold ${meta.textClassName}`}>{meta.text}</p>
            <p className="text-xs text-neutral-400">Kişisel uygunluk skoru (0-100)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          {expanded ? 'Gizle' : 'Neden bu skor?'}
        </button>
      </div>

      {expanded && (
        <ul className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-3 text-left">
          {result.reasons.map((reason, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-neutral-600">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT[reason.severity]}`} />
              {reason.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
