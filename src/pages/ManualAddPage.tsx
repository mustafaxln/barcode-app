import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { submitManualProduct } from '../lib/manualSubmissions';
import { DisclaimerNote } from '../components/DisclaimerNote';

interface NutritionFieldConfig {
  key: 'energyKcal' | 'fat' | 'saturatedFat' | 'carbohydrates' | 'sugars' | 'fiber' | 'proteins' | 'salt';
  label: string;
  unit: string;
}

const NUTRITION_FIELDS: NutritionFieldConfig[] = [
  { key: 'energyKcal', label: 'Enerji', unit: 'kcal' },
  { key: 'fat', label: 'Yağ', unit: 'g' },
  { key: 'saturatedFat', label: 'Doymuş Yağ', unit: 'g' },
  { key: 'carbohydrates', label: 'Karbonhidrat', unit: 'g' },
  { key: 'sugars', label: 'Şeker', unit: 'g' },
  { key: 'fiber', label: 'Lif', unit: 'g' },
  { key: 'proteins', label: 'Protein', unit: 'g' },
  { key: 'salt', label: 'Tuz', unit: 'g' },
];

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export function ManualAddPage() {
  const { barcode } = useParams<{ barcode: string }>();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [nutrition, setNutrition] = useState<Record<string, string>>({});
  const [state, setState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!barcode || !name.trim()) return;

    setState('submitting');
    const nutritionPayload = Object.fromEntries(
      NUTRITION_FIELDS.map((field) => [field.key, nutrition[field.key] ? Number(nutrition[field.key]) : undefined]).filter(
        ([, value]) => value !== undefined
      )
    );

    const result = await submitManualProduct({
      barcode,
      name: name.trim(),
      brand: brand.trim() || undefined,
      ingredientsText: ingredientsText.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      nutrition: Object.keys(nutritionPayload).length > 0 ? nutritionPayload : undefined,
    });

    if (result.success) {
      setState('success');
    } else {
      setState('error');
      setErrorMessage(result.error ?? 'Kaydedilemedi, lütfen tekrar deneyin.');
    }
  };

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-brand-700">Teşekkürler!</h1>
        <p className="max-w-sm text-sm text-neutral-500">
          Ürün bilgisi kaydedildi. İncelendikten sonra veritabanımıza eklenecek.
        </p>
        <Link to="/" className="text-sm font-medium text-brand-600 hover:underline">
          ← Tarama ekranına dön
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-5 px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand-700">Ürünü Sen Ekle</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Barkod: <span className="font-mono text-neutral-700">{barcode}</span>
        </p>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">Ürün Adı *</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">Marka</span>
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">İçindekiler</span>
        <textarea
          value={ingredientsText}
          onChange={(e) => setIngredientsText(e.target.value)}
          rows={3}
          placeholder="Ambalajdaki içindekiler listesini virgülle ayırarak yazın"
          className="rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">Ürün Görseli URL (opsiyonel)</span>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
          className="rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
      </label>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700">Besin Değerleri (100g, opsiyonel)</p>
        <div className="grid grid-cols-2 gap-3">
          {NUTRITION_FIELDS.map((field) => (
            <label key={field.key} className="flex flex-col gap-1 text-xs text-neutral-500">
              {field.label} ({field.unit})
              <input
                type="number"
                inputMode="decimal"
                value={nutrition[field.key] ?? ''}
                onChange={(e) => setNutrition((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>
          ))}
        </div>
      </div>

      {state === 'error' && <p className="text-sm text-danger-500">{errorMessage}</p>}

      <button
        type="submit"
        disabled={state === 'submitting' || !name.trim()}
        className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {state === 'submitting' ? 'Gönderiliyor…' : 'Gönder'}
      </button>

      <DisclaimerNote />
    </form>
  );
}
