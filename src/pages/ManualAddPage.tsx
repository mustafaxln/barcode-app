import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { submitManualProduct } from '../lib/manualSubmissions';
import { useProduct } from '../hooks/useProduct';
import { DisclaimerNote } from '../components/DisclaimerNote';
import { useLanguage } from '../lib/i18n/LanguageContext';

interface NutritionFieldConfig {
  key: 'energyKcal' | 'fat' | 'saturatedFat' | 'carbohydrates' | 'sugars' | 'fiber' | 'proteins' | 'salt';
  labelKey: string;
  unit: string;
}

const NUTRITION_FIELDS: NutritionFieldConfig[] = [
  { key: 'energyKcal', labelKey: 'nutrition.labels.energy', unit: 'kcal' },
  { key: 'fat', labelKey: 'nutrition.labels.fat', unit: 'g' },
  { key: 'saturatedFat', labelKey: 'nutrition.labels.saturatedFat', unit: 'g' },
  { key: 'carbohydrates', labelKey: 'nutrition.labels.carbohydrates', unit: 'g' },
  { key: 'sugars', labelKey: 'nutrition.labels.sugars', unit: 'g' },
  { key: 'fiber', labelKey: 'nutrition.labels.fiber', unit: 'g' },
  { key: 'proteins', labelKey: 'nutrition.labels.proteins', unit: 'g' },
  { key: 'salt', labelKey: 'nutrition.labels.salt', unit: 'g' },
];

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export function ManualAddPage() {
  const { barcode } = useParams<{ barcode: string }>();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { data: existingData } = useProduct(barcode);
  const existingProduct = existingData?.status === 'found' ? existingData.product : null;

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [nutrition, setNutrition] = useState<Record<string, string>>({});
  const [state, setState] = useState<SubmitState>('idle');
  const [errorKey, setErrorKey] = useState('submissionFailed');
  const [prefilled, setPrefilled] = useState(false);

  // Open Food Facts'te ürün bulunmuş ama bazı alanlar (içindekiler/besin değeri) eksikse,
  // kullanıcıyı bildiği bilgileri (ad, marka, görsel) yeniden yazmaya zorlamıyoruz — formu
  // mevcut veriyle önceden dolduruyoruz, o sadece eksik kısmı tamamlıyor.
  useEffect(() => {
    if (!existingProduct || prefilled) return;
    setName(existingProduct.name ?? '');
    setBrand(existingProduct.brand ?? '');
    setIngredientsText(existingProduct.ingredientsText ?? '');
    setImageUrl(existingProduct.imageUrl ?? '');
    if (existingProduct.nutrition) {
      setNutrition(
        Object.fromEntries(
          Object.entries(existingProduct.nutrition)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)])
        )
      );
    }
    setPrefilled(true);
  }, [existingProduct, prefilled]);

  const isCompleting = Boolean(existingProduct);

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
      // Ürün artık `products`'ta var; aynı barkod için önceden cache'lenmiş "bulunamadı"
      // sonucunu (React Query staleTime penceresi içindeyse) geçersiz kılıp bir sonraki
      // ziyarette taze veri çekilmesini garantiliyoruz.
      void queryClient.invalidateQueries({ queryKey: ['product', barcode] });
    } else {
      setState('error');
      setErrorKey(result.errorKey);
    }
  };

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-brand-700">{t('manualAdd.successTitle')}</h1>
        <p className="max-w-sm text-sm text-neutral-500">{t('manualAdd.successBody')}</p>
        <Link to="/" className="text-sm font-medium text-brand-600 hover:underline">
          {t('product.backToScan')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-5 px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand-700">
          {isCompleting ? t('manualAdd.completingTitle') : t('manualAdd.addTitle')}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {t('manualAdd.barcodeLabel')} <span className="font-mono text-neutral-700">{barcode}</span>
        </p>
        {isCompleting && (
          <p className="mt-2 text-xs text-neutral-400">{t('manualAdd.completingHint')}</p>
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">{t('manualAdd.nameLabel')}</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">{t('manualAdd.brandLabel')}</span>
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">{t('manualAdd.ingredientsLabel')}</span>
        <textarea
          value={ingredientsText}
          onChange={(e) => setIngredientsText(e.target.value)}
          rows={3}
          placeholder={t('manualAdd.ingredientsPlaceholder')}
          className="rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">{t('manualAdd.imageLabel')}</span>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
          className="rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
      </label>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700">{t('manualAdd.nutritionSectionTitle')}</p>
        <div className="grid grid-cols-2 gap-3">
          {NUTRITION_FIELDS.map((field) => (
            <label key={field.key} className="flex flex-col gap-1 text-xs text-neutral-500">
              {t(field.labelKey)} ({field.unit})
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

      {state === 'error' && (
        <p className="text-sm text-danger-500">{t(`manualAdd.errors.${errorKey}`)}</p>
      )}

      <button
        type="submit"
        disabled={state === 'submitting' || !name.trim()}
        className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {state === 'submitting' ? t('manualAdd.submittingButton') : t('manualAdd.submitButton')}
      </button>

      <DisclaimerNote />
    </form>
  );
}
