/**
 * AdMob kimlikleri.
 *
 * - `APP_ID` native tarafta (`android/.../strings.xml` → `admob_app_id`) tutulur; JS buradan
 *   okuyamaz. PM gerçek App ID'yi verdiğinde strings.xml güncellenir.
 * - Banner / interstitial birim ID'leri Vite env ile override edilebilir; boşsa Google'ın
 *   resmi TEST birimleri kullanılır (gerçek trafik/para üretmez, hesabı riske atmaz).
 *
 * Google test ID'leri: https://developers.google.com/admob/android/test-ads
 */

/** Google resmi Android test App ID — sadece referans; asıl değer strings.xml'de. */
export const ADMOB_TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712';

function envOr(key: string, fallback: string): string {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

/** Env `VITE_ADMOB_ENABLED=false` ise reklamlar tamamen kapalı. */
export function isAdMobEnabled(): boolean {
  const flag = import.meta.env.VITE_ADMOB_ENABLED;
  if (flag === 'false' || flag === '0') return false;
  return true;
}

export function getBannerAdUnitId(): string {
  return envOr('VITE_ADMOB_BANNER_ID', TEST_BANNER);
}

export function getInterstitialAdUnitId(): string {
  return envOr('VITE_ADMOB_INTERSTITIAL_ID', TEST_INTERSTITIAL);
}

/**
 * SDK test modu: yalnızca banner hâlâ Google test birimindeyse açık.
 * Production banner + Google resmi test interstitial birlikte kullanılabilir —
 * banner canlı doldurulur, interstitial test birimiyle test reklamı kalır.
 * (Önceki "banner VEYA interstitial testse" mantığı production banner'ı da
 * initializeForTesting=true yapıyordu; bu yüzden gevşetildi.)
 */
export function shouldUseAdTestMode(): boolean {
  return getBannerAdUnitId() === TEST_BANNER;
}

/** Kaç ürün detayı açılışında bir interstitial gösterilsin (1 = her seferinde). */
export const INTERSTITIAL_EVERY_N_PRODUCT_VIEWS = 3;
