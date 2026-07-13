import { ALLERGEN_OPTIONS, type AllergenId } from '../lib/sensitivities';

export function AllergenWarningBanner({ matchedAllergens }: { matchedAllergens: AllergenId[] }) {
  if (matchedAllergens.length === 0) return null;

  const labels = matchedAllergens.map(
    (id) => ALLERGEN_OPTIONS.find((option) => option.id === id)?.label ?? id
  );

  return (
    <div className="w-full rounded-xl border border-danger-500/30 bg-danger-100 px-4 py-3 text-left">
      <p className="text-sm font-semibold text-danger-500">⚠️ Alerjen Uyarısı</p>
      <p className="mt-1 text-sm text-danger-500/90">
        Bu ürün, hassasiyet profilinizde seçtiğiniz şu alerjen(ler)i içeriyor:{' '}
        <strong>{labels.join(', ')}</strong>
      </p>
    </div>
  );
}
