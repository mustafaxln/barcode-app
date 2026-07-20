import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
  AdmobConsentStatus,
  type BannerAdOptions,
  type AdOptions,
} from '@capacitor-community/admob';
import {
  getBannerAdUnitId,
  getInterstitialAdUnitId,
  INTERSTITIAL_EVERY_N_PRODUCT_VIEWS,
  isAdMobEnabled,
  shouldUseAdTestMode,
} from './config';

const PRODUCT_VIEW_COUNT_KEY = 'admob.productViews.v1';

let initialized = false;
let bannerVisible = false;
let interstitialPrepared = false;

function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/** Web tarayıcıda ve iOS'ta (henüz yok) reklam çalıştırma. */
export function canShowAds(): boolean {
  return isAdMobEnabled() && isNativeAndroid();
}

/**
 * Uygulama açılışında bir kez çağrılır. GDPR/UMP formu varsa gösterir.
 * Hata olursa sessizce geçer — reklam yokluğu uygulamayı kırmamalı.
 */
export async function initializeAdMob(): Promise<void> {
  if (!canShowAds() || initialized) return;

  try {
    await AdMob.initialize({
      initializeForTesting: shouldUseAdTestMode(),
    });

    // UMP (izin / GDPR): form varsa göster. canRequestAds false kalırsa reklam yüklemeyi atlarız.
    try {
      let consent = await AdMob.requestConsentInfo();
      if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
        consent = await AdMob.showConsentForm();
      }
      if (consent.canRequestAds === false) {
        console.info('[admob] Kullanıcı reklam izni vermedi (UMP); reklamlar gösterilmeyecek.');
        initialized = true;
        return;
      }
    } catch (consentErr) {
      // UMP yapılandırılmamış hesaplarda hata normal olabilir; test reklamlarıyla devam.
      console.warn('[admob] Consent bilgisi alınamadı, devam ediliyor:', consentErr);
    }

    initialized = true;
  } catch (err) {
    console.warn('[admob] initialize başarısız:', err);
  }
}

/** Üstte sabit banner. NavBar altta olduğu için TOP_CENTER çakışmayı önler. */
export async function showAppBanner(): Promise<void> {
  if (!canShowAds() || !initialized || bannerVisible) return;

  try {
    AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (info) => {
      console.warn('[admob] Banner yüklenemedi:', info);
    });

    AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
      // Banner içeriğin üstüne binmesin diye body'ye padding.
      const height = size?.height ?? 0;
      document.documentElement.style.setProperty('--admob-banner-offset', `${height}px`);
    });

    const options: BannerAdOptions = {
      adId: getBannerAdUnitId(),
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.TOP_CENTER,
      margin: 0,
      isTesting: shouldUseAdTestMode(),
    };

    await AdMob.showBanner(options);
    bannerVisible = true;
  } catch (err) {
    console.warn('[admob] showBanner başarısız:', err);
  }
}

export async function hideAppBanner(): Promise<void> {
  if (!bannerVisible) return;
  try {
    await AdMob.hideBanner();
    bannerVisible = false;
    document.documentElement.style.setProperty('--admob-banner-offset', '0px');
  } catch (err) {
    console.warn('[admob] hideBanner başarısız:', err);
  }
}

async function prepareInterstitial(): Promise<boolean> {
  if (!canShowAds() || !initialized) return false;

  try {
    const options: AdOptions = {
      adId: getInterstitialAdUnitId(),
      isTesting: shouldUseAdTestMode(),
    };
    await AdMob.prepareInterstitial(options);
    interstitialPrepared = true;
    return true;
  } catch (err) {
    console.warn('[admob] Interstitial hazırlanamadı:', err);
    interstitialPrepared = false;
    return false;
  }
}

function readProductViewCount(): number {
  try {
    return Number(window.sessionStorage.getItem(PRODUCT_VIEW_COUNT_KEY) ?? '0') || 0;
  } catch {
    return 0;
  }
}

function writeProductViewCount(count: number): void {
  try {
    window.sessionStorage.setItem(PRODUCT_VIEW_COUNT_KEY, String(count));
  } catch {
    // sessionStorage kapalıysa throttling çalışmaz; interstitial her seferinde denenebilir.
  }
}

/**
 * Ürün detay açıldığında çağrılır. Her N. açılışta tam ekran reklam gösterir
 * (çok sık olmasın diye throttled). Gösterimden sonra bir sonraki için yeniden prepare eder.
 */
export async function maybeShowInterstitialOnProductView(): Promise<void> {
  if (!canShowAds() || !initialized) return;

  const nextCount = readProductViewCount() + 1;
  writeProductViewCount(nextCount);

  if (nextCount % INTERSTITIAL_EVERY_N_PRODUCT_VIEWS !== 0) {
    // Erken prepare: sıradaki gösterim için reklamı arka planda hazırla.
    if (!interstitialPrepared) void prepareInterstitial();
    return;
  }

  try {
    if (!interstitialPrepared) {
      const ok = await prepareInterstitial();
      if (!ok) return;
    }
    await AdMob.showInterstitial();
    interstitialPrepared = false;
    // Bir sonrakini şimdiden hazırla.
    void prepareInterstitial();
  } catch (err) {
    console.warn('[admob] Interstitial gösterilemedi:', err);
    interstitialPrepared = false;
  }
}
