import { useParams } from 'react-router-dom';

export function ProductPage() {
  const { barcode } = useParams<{ barcode: string }>();

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
      <h1 className="text-2xl font-bold text-brand-700">Ürün Detayı</h1>
      <p className="text-sm text-neutral-400">
        Okunan barkod: <span className="font-mono text-neutral-700">{barcode}</span>
      </p>
      <p className="max-w-sm text-neutral-500">
        İçindekiler, besin değerleri ve skor gösterimi Blok 3-4-6'da eklenecek.
      </p>
    </div>
  );
}
