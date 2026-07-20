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

/**
 * Görünen etiketler (Gluten, Süt, Milk, ...) artık `lib/i18n/translations.ts` içindeki
 * `allergens.<id>` anahtarlarından geliyor — burada sadece kimlik listesi tutuluyor.
 * Arayüzde göstermek için `t(\`allergens.${id}\`)` kullanın.
 */
export const ALLERGEN_OPTIONS: { id: AllergenId }[] = [
  { id: 'gluten' },
  { id: 'milk' },
  { id: 'eggs' },
  { id: 'nuts' },
  { id: 'peanuts' },
  { id: 'soybeans' },
  { id: 'fish' },
  { id: 'crustaceans' },
  { id: 'sesame-seeds' },
  { id: 'mustard' },
  { id: 'celery' },
  { id: 'sulphur-dioxide-and-sulphites' },
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
