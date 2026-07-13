import { Link } from 'react-router-dom';
import { useHistory } from '../hooks/useHistory';
import { SCORE_LABEL_META } from '../lib/scoring';

export function HistoryPage() {
  const { history, clear } = useHistory();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">Tarama Geçmişi</h1>
        {history.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="text-xs font-medium text-neutral-400 hover:text-danger-500"
          >
            Temizle
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="mt-8 text-center text-sm text-neutral-400">
          Henüz bir ürün taramadınız. Bu cihazda yaptığınız taramalar burada, internet olmadan da
          görünür.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {history.map((entry, index) => {
            const meta = SCORE_LABEL_META[entry.label];
            return (
              <li key={`${entry.barcode}-${entry.scannedAt}-${index}`}>
                <Link
                  to={`/urun/${entry.barcode}`}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3 hover:border-brand-300"
                >
                  {entry.imageUrl ? (
                    <img src={entry.imageUrl} alt={entry.name} className="h-12 w-12 rounded-lg object-contain" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-neutral-100" />
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-neutral-800">{entry.name}</p>
                    <p className="text-xs text-neutral-400">
                      {new Date(entry.scannedAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${meta.badgeClassName}`}>
                    {entry.score}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
