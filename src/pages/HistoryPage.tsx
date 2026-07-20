import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { useHistory } from '../hooks/useHistory';
import { useSensitivities } from '../hooks/useSensitivities';
import { calculateSuitabilityScore, SCORE_LABEL_META, type ScoreLabel } from '../lib/scoring';
import { resolveProduct } from '../lib/productRepository';
import type { HistoryEntry, HistoryScoringSnapshot } from '../lib/history';
import type { Product } from '../lib/types';
import { useLanguage } from '../lib/i18n/LanguageContext';

function productFromScoring(entry: HistoryEntry, scoring: HistoryScoringSnapshot): Product {
  return {
    barcode: entry.barcode,
    name: entry.name,
    brand: entry.brand,
    imageUrl: entry.imageUrl,
    ingredientsText: scoring.ingredientsText,
    nutrition: scoring.nutrition,
    additivesTags: scoring.additivesTags,
    allergensTags: scoring.allergensTags,
    source: 'off',
    verified: true,
  };
}

export function HistoryPage() {
  const { history, clear, updateScores, recalculateAll } = useHistory();
  const { sensitivities } = useSensitivities();
  const { t, language } = useLanguage();
  const locale = language === 'en' ? 'en-US' : 'tr-TR';

  // Eski kayıtlarda scoring snapshot yoksa ürünü çekip skor girdi verisini tamamlıyoruz.
  const barcodesNeedingFetch = useMemo(
    () => [...new Set(history.filter((entry) => !entry.scoring).map((entry) => entry.barcode))],
    [history]
  );

  const fetchQueries = useQueries({
    queries: barcodesNeedingFetch.map((barcode) => ({
      queryKey: ['product', barcode] as const,
      queryFn: () => resolveProduct(barcode),
      staleTime: 60 * 1000,
    })),
  });

  const fetchedByBarcode = useMemo(() => {
    const map = new Map<string, Product>();
    barcodesNeedingFetch.forEach((barcode, index) => {
      const result = fetchQueries[index]?.data;
      if (result?.status === 'found') map.set(barcode, result.product);
    });
    return map;
  }, [barcodesNeedingFetch, fetchQueries]);

  // Snapshot'sız kayıtlar için ürün geldiğinde scoring'i bir kerelik yaz.
  useEffect(() => {
    history.forEach((entry) => {
      if (entry.scoring) return;
      const product = fetchedByBarcode.get(entry.barcode);
      if (!product) return;
      const result = calculateSuitabilityScore(product, sensitivities);
      updateScores(entry.barcode, {
        score: result.score,
        label: result.label,
        scoring: {
          allergensTags: product.allergensTags,
          additivesTags: product.additivesTags,
          ingredientsText: product.ingredientsText,
          nutrition: product.nutrition,
        },
      });
    });
  }, [history, fetchedByBarcode, sensitivities, updateScores]);

  // Profil değişince snapshot'lı kayıtları tek seferde localStorage'a yaz.
  useEffect(() => {
    recalculateAll(sensitivities);
  }, [sensitivities, recalculateAll]);

  // Ekranda her zaman güncel hassasiyetlere göre skor göster (localStorage yazılmasını beklemeden).
  const displayRows = useMemo(() => {
    return history.map((entry) => {
      let score = entry.score;
      let label: ScoreLabel = entry.label;

      if (entry.scoring) {
        const result = calculateSuitabilityScore(productFromScoring(entry, entry.scoring), sensitivities);
        score = result.score;
        label = result.label;
      } else {
        const product = fetchedByBarcode.get(entry.barcode);
        if (product) {
          const result = calculateSuitabilityScore(product, sensitivities);
          score = result.score;
          label = result.label;
        }
      }

      return { entry, score, label };
    });
  }, [history, sensitivities, fetchedByBarcode]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">{t('history.title')}</h1>
        {history.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="text-xs font-medium text-neutral-400 hover:text-danger-500"
          >
            {t('history.clear')}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="mt-8 text-center text-sm text-neutral-400">{t('history.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {displayRows.map(({ entry, score, label }, index) => {
            const meta = SCORE_LABEL_META[label];
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
                      {new Date(entry.scannedAt).toLocaleString(locale)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${meta.badgeClassName}`}>
                    {score}
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
