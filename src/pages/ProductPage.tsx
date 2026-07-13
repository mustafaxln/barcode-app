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

export function ProductPage() {
  const { barcode } = useParams<{ barcode: string }>();
  const location = useLocation();
  const fromScan = Boolean((location.state as { fromScan?: boolean } | null)?.fromScan);

  const { data, isLoading, isError } = useProduct(barcode);
  const { sensitivities } = useSensitivities();
  const { addEntry } = useHistory();
  const { toggle: toggleFavorite, isFavorite } = useFavorites();
  const recordedRef = useRef<string | null>(null);

  const product = data?.status === 'found' ? data.product : null;
  const scoreResult = product ? calculateSuitabilityScore(product, sensitivities) : null;

  // Sadece Blok 7'de eklenen fromScan işareti geldiğinde (yani gerçek bir tarama/manuel arama
  // sonucuysa) geçmişe kaydediyoruz — Geçmiş/Favoriler listesinden tekrar açmak yeni kayıt oluşturmaz.
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
    });
  }, [fromScan, product, scoreResult, addEntry]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="text-sm text-neutral-500">Ürün aranıyor…</p>
        <p className="font-mono text-xs text-neutral-400">{barcode}</p>
      </div>
    );
  }

  if (isError || data?.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-danger-500">Bir şeyler ters gitti</h1>
        <p className="max-w-sm text-sm text-neutral-500">
          {data?.status === 'error' ? data.message : 'Ürün verisi alınırken bir hata oluştu.'}
        </p>
        <Link to="/" className="text-sm font-medium text-brand-600 hover:underline">
          ← Tarama ekranına dön
        </Link>
      </div>
    );
  }

  if (data?.status === 'not_found') {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-neutral-700">Ürün bulunamadı</h1>
        <p className="max-w-sm text-sm text-neutral-500">
          <span className="font-mono">{barcode}</span> barkodlu ürün veritabanımızda ve Open Food
          Facts'te bulunamadı.
        </p>
        <Link
          to={`/urun-ekle/${barcode}`}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Bu Ürünü Sen Ekle
        </Link>
        <Link to="/" className="text-sm text-neutral-400 hover:underline">
          ← Tarama ekranına dön
        </Link>
      </div>
    );
  }

  if (!product || !scoreResult || !data || data.status !== 'found') return null;

  const isFav = isFavorite(product.barcode);

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
          Kaynak: {data.source === 'cache' ? 'Önbellek' : 'Open Food Facts'} · Barkod: {product.barcode}
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
          {isFav ? '♥ Favorilerde' : '♡ Favorilere Ekle'}
        </button>
      </div>

      <AllergenWarningBanner matchedAllergens={scoreResult.matchedAllergens} />
      <ScoreBadge result={scoreResult} />

      <section className="w-full">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          İçindekiler
        </h2>
        <IngredientsList ingredientsText={product.ingredientsText} />
      </section>

      <section className="w-full">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Besin Değerleri
        </h2>
        <NutritionTable nutrition={product.nutrition} />
      </section>

      <section className="w-full">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Katkı Maddeleri
        </h2>
        <AdditivesList additivesTags={product.additivesTags} />
      </section>

      <DisclaimerNote />
    </div>
  );
}
