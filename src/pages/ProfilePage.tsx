import { ALLERGEN_OPTIONS } from '../lib/sensitivities';
import { useSensitivities } from '../hooks/useSensitivities';
import { ToggleChip } from '../components/ToggleChip';
import { DisclaimerNote } from '../components/DisclaimerNote';

export function ProfilePage() {
  const { sensitivities, toggleAllergen, toggleFlag } = useSensitivities();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand-700">Hassasiyet Profilim</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Seçimleriniz bu cihazda saklanır ve taradığınız ürünlerin uygunluk değerlendirmesinde
          kullanılır.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Alerjenler
        </h2>
        <div className="flex flex-wrap gap-2">
          {ALLERGEN_OPTIONS.map((option) => (
            <ToggleChip
              key={option.id}
              label={option.label}
              active={sensitivities.allergens.includes(option.id)}
              onClick={() => toggleAllergen(option.id)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Diyet Tercihleri
        </h2>
        <div className="flex flex-wrap gap-2">
          <ToggleChip label="Vegan" active={sensitivities.vegan} onClick={() => toggleFlag('vegan')} />
          <ToggleChip
            label="Vejetaryen"
            active={sensitivities.vegetarian}
            onClick={() => toggleFlag('vegetarian')}
          />
          <ToggleChip
            label="Glutensiz Diyet"
            active={sensitivities.glutenFree}
            onClick={() => toggleFlag('glutenFree')}
          />
          <ToggleChip
            label="Laktozsuz Diyet"
            active={sensitivities.lactoseFree}
            onClick={() => toggleFlag('lactoseFree')}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Takip Etmek İstediklerim
        </h2>
        <p className="mb-3 text-xs text-neutral-400">
          Seçtiğiniz değerler yüksek çıkan ürünlerde skor daha sert düşer.
        </p>
        <div className="flex flex-wrap gap-2">
          <ToggleChip
            label="Şekeri Düşük Tutmak İstiyorum"
            active={sensitivities.trackSugar}
            onClick={() => toggleFlag('trackSugar')}
          />
          <ToggleChip
            label="Tuzu Düşük Tutmak İstiyorum"
            active={sensitivities.trackSalt}
            onClick={() => toggleFlag('trackSalt')}
          />
          <ToggleChip
            label="Yağı Düşük Tutmak İstiyorum"
            active={sensitivities.trackFat}
            onClick={() => toggleFlag('trackFat')}
          />
        </div>
      </section>

      <DisclaimerNote />
    </div>
  );
}
