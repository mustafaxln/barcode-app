import { useEffect, useRef } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useProduct } from '../hooks/useProduct';
import { useSensitivities } from '../hooks/useSensitivities';
import { useHistory } from '../hooks/useHistory';
import { useFavorites } from '../hooks/useFavorites';
import { calculateSuitabilityScore } from '../lib/scoring';
import { IngredientsList } from '../components/IngredientsList';
import { NutritionTable } from '../components/NutritionTable';
import { DisclaimerNote } from '../components/DisclaimerNote';
import { ScoreBadge } from '../components/ScoreBadge';
import { AllergenWarningBanner } from '../components/AllergenWarningBanner';
import { AdditivesList } from '../components/AdditivesList';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { maybeShowInterstitialOnProductView } from '../lib/admob';

export function ProductPage() {
  const { barcode } = useParams<{ barcode: string }>();
  const location = useLocation();
  const fromScan = Boolean((location.state as { fromScan?: boolean } | null)?.fromScan);
  const { t } = useLanguage();

  const { data, isLoading, isError } = useProduct(barcode);
  const { sensitivities } = useSensitivities();
  const { addEntry, updateScores } = useHistory();
  const { toggle: toggleFavorite, isFavorite } = useFavorites();
  const recordedRef = useRef<string | null>(null);
  const interstitialShownForRef = useRef<string | null>(null);

  const product = data?.status === 'found' ? data.product : null;
  const scoreResult = product ? calculateSuitabilityScore(product, sensitivities) : null;

  // Ürün başarıyla yüklendiğinde (throttled) interstitial reklam dene — sadece native Android.
  useEffect(() => {
    if (!product) return;
    if (interstitialShownForRef.current === product.barcode) return;
    interstitialShownForRef.current = product.barcode;
    void maybeShowInterstitialOnProductView();
  }, [product]);

  // Sadece Blok 7'de eklenen fromScan işareti geldiğinde (yani gerçek bir tarama/manuel arama
  // sonucuysa) geçmişe kaydediyoruz — Geçmiş/Favoriler listesinden tekrar açmak yeni kayıt oluşturmaz.
  // Skor hesabı girdilerini de saklıyoruz ki profil değişince History listesi ağ isteği olmadan
  // puanı yeniden hesaplayabilsin.
  useEffect(() => {
    if (!fromScan || !product || !scoreResult) return;
    if (recordedRef.current === product.barcode) return;
    recordedRef.current = product.barcode;
    addEntry({
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      imageUrl: product.imageUrl,
      score: scoreResult.score,
      label: scoreResult.label,
      scannedAt: new Date().toISOString(),
      scoring: {
        allergensTags: product.allergensTags,
        additivesTags: product.additivesTags,
        ingredientsText: product.ingredientsText,
        nutrition: product.nutrition,
      },
    });
  }, [fromScan, product, scoreResult, addEntry]);

  // Geçmişte zaten olan bir ürünü (profil değiştikten sonra) açınca o barkodun kayıtlı
  // skorunu güncel hassasiyetlere göre tazeliyoruz.
  useEffect(() => {
    if (!product || !scoreResult || fromScan) return;
    updateScores(product.barcode, {
      score: scoreResult.score,
      label: scoreResult.label,
      scoring: {
        allergensTags: product.allergensTags,
        additivesTags: product.additivesTags,
        ingredientsText: product.ingredientsText,
        nutrition: product.nutrition,
      },
    });
    // scoreResult her render'da yeni obje; primitive alanlara bağlanıyoruz.
  }, [
    fromScan,
    product?.barcode,
    product?.allergensTags,
    product?.additivesTags,
    product?.ingredientsText,
    product?.nutrition,
    scoreResult?.score,
    scoreResult?.label,
    updateScores,
  ]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="text-sm text-neutral-500">{t('product.searching')}</p>
        <p className="font-mono text-xs text-neutral-400">{barcode}</p>
      </div>
    );
  }

  if (isError || data?.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-danger-500">{t('product.errorTitle')}</h1>
        <p className="max-w-sm text-sm text-neutral-500">{t('product.errorGeneric')}</p>
        <Link to="/" className="text-sm font-medium text-brand-600 hover:underline">
          {t('product.backToScan')}
        </Link>
      </div>
    );
  }

  if (data?.status === 'not_found') {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-neutral-700">{t('product.notFoundTitle')}</h1>
        <p className="max-w-sm text-sm text-neutral-500">
          {t('product.notFoundBefore')}
          <span className="font-mono">{barcode}</span>
          {t('product.notFoundAfter')}
        </p>
        <Link
          to={`/urun-ekle/${barcode}`}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t('product.addProductButton')}
        </Link>
        <Link to="/" className="text-sm text-neutral-400 hover:underline">
          {t('product.backToScan')}
        </Link>
      </div>
    );
  }

  if (!product || !scoreResult || !data || data.status !== 'found') return null;

  const isFav = isFavorite(product.barcode);
  const hasIngredients = Boolean(product.ingredientsText && product.ingredientsText.trim().length > 0);
  const hasNutrition = Object.values(product.nutrition ?? {}).some(
    (value) => value !== undefined && value !== null
  );
  const isDataIncomplete = !hasIngredients || !hasNutrition;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-32 w-32 rounded-xl object-contain"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{product.name}</h1>
          {product.brand && <p className="text-sm text-neutral-500">{product.brand}</p>}
        </div>
        <p className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-400">
          {t('product.sourceLabel', {
            source: data.source === 'cache' ? t('product.sourceCache') : t('product.sourceOff'),
            barcode: product.barcode,
          })}
        </p>
        <button
          type="button"
          onClick={() =>
            toggleFavorite({
              barcode: product.barcode,
              name: product.name,
              brand: product.brand,
              imageUrl: product.imageUrl,
            })
          }
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            isFav
              ? 'border-danger-500 bg-danger-100 text-danger-500'
              : 'border-neutral-200 text-neutral-500 hover:border-danger-300'
          }`}
        >
          {isFav ? t('product.inFavorites') : t('product.addToFavorites')}
        </button>
      </div>

      {isDataIncomplete && (
        <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          <p>
            {t('product.incompleteNotice', {
              missing: !hasIngredients && !hasNutrition
                ? t('product.incompleteBoth')
                : !hasIngredients
                  ? t('product.incompleteIngredients')
                  : t('product.incompleteNutrition'),
            })}
          </p>
          <Link
            to={`/urun-ekle/${product.barcode}`}
            className="mt-2 inline-block rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            {t('product.completeButton')}
          </Link>
        </div>
      )}

      <AllergenWarningBanner matchedAllergens={scoreResult.matchedAllergens} />
      <ScoreBadge result={scoreResult} />

      <section className="w-full">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          {t('product.ingredientsTitle')}
        </h2>
        <IngredientsList ingredientsText={product.ingredientsText} />
      </section>

      <section className="w-full">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          {t('product.nutritionTitle')}
        </h2>
        <NutritionTable nutrition={product.nutrition} />
      </section>

      <section className="w-full">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          {t('product.additivesTitle')}
        </h2>
        <AdditivesList additivesTags={product.additivesTags} />
      </section>

      <DisclaimerNote />
    </div>
  );
}
