/**
 * Alerjen id'leri Open Food Facts'in `allergens_tags` taksonomisiyle (dil öneki temizlenmiş hali)
 * aynı tutuluyor — böylece Blok 6'daki eşleştirme mantığı ekstra bir çeviri tablosuna gerek
 * kalmadan doğrudan küme kesişimiyle çalışabilecek.
 */
export type AllergenId =
  | 'gluten'
  | 'milk'
  | 'eggs'
  | 'nuts'
  | 'peanuts'
  | 'soybeans'
  | 'fish'
  | 'crustaceans'
  | 'sesame-seeds'
  | 'mustard'
  | 'celery'
  | 'sulphur-dioxide-and-sulphites';

export const ALLERGEN_OPTIONS: { id: AllergenId; label: string }[] = [
  { id: 'gluten', label: 'Gluten' },
  { id: 'milk', label: 'Süt' },
  { id: 'eggs', label: 'Yumurta' },
  { id: 'nuts', label: 'Kuruyemiş' },
  { id: 'peanuts', label: 'Yer Fıstığı' },
  { id: 'soybeans', label: 'Soya' },
  { id: 'fish', label: 'Balık' },
  { id: 'crustaceans', label: 'Kabuklu Deniz Ürünleri' },
  { id: 'sesame-seeds', label: 'Susam' },
  { id: 'mustard', label: 'Hardal' },
  { id: 'celery', label: 'Kereviz' },
  { id: 'sulphur-dioxide-and-sulphites', label: 'Sülfitler' },
];

export interface UserSensitivities {
  allergens: AllergenId[];
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  lactoseFree: boolean;
  trackSugar: boolean;
  trackSalt: boolean;
  trackFat: boolean;
}

export const DEFAULT_SENSITIVITIES: UserSensitivities = {
  allergens: [],
  vegan: false,
  vegetarian: false,
  glutenFree: false,
  lactoseFree: false,
  trackSugar: false,
  trackSalt: false,
  trackFat: false,
};

const STORAGE_KEY = 'sensitivities.v1';

export function loadSensitivities(): UserSensitivities {
  if (typeof window === 'undefined') return DEFAULT_SENSITIVITIES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SENSITIVITIES;
    return { ...DEFAULT_SENSITIVITIES, ...(JSON.parse(raw) as Partial<UserSensitivities>) };
  } catch (err) {
    console.warn('[sensitivities] localStorage okunamadı:', err);
    return DEFAULT_SENSITIVITIES;
  }
}

export function saveSensitivities(sensitivities: UserSensitivities): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sensitivities));
  } catch (err) {
    console.warn('[sensitivities] localStorage yazılamadı:', err);
  }
}
