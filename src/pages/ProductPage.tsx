import { Link, useParams } from 'react-router-dom';
import { useProduct } from '../hooks/useProduct';

export function ProductPage() {
  const { barcode } = useParams<{ barcode: string }>();
  const { data, isLoading, isError } = useProduct(barcode);

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

  if (data?.status !== 'found') return null;
  const product = data.product;

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
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
      <p className="max-w-sm text-sm text-neutral-500">
        İçindekiler listesi, besin değerleri tablosu ve uygunluk skoru Blok 4-6'da eklenecek.
      </p>
    </div>
  );
}
