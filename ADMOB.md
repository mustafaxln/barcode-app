# Google AdMob Entegrasyonu

Uygulama, Capacitor native Android kabuğunda **Google AdMob** ile reklam gösterir.
Web tarayıcıda reklam **yok** (native SDK gerekir).

## Ne eklendi?

| Reklam | Ne zaman | Nerede |
|---|---|---|
| **Banner** (üst şerit) | Uygulama açılınca | Tüm ekranlar, üstte |
| **Interstitial** (tam ekran) | Her 3. ürün detayı açılışında | Ürün sayfası |

Paket: `@capacitor-community/admob` (Capacitor 8 uyumlu)

## PM'den alınması gereken ID'ler

AdMob Console'da (https://admob.google.com) Android uygulaması oluşturup şunları verin:

1. **App ID** — `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`  
   → `android/app/src/main/res/values/strings.xml` içindeki `admob_app_id`
2. **Banner Ad Unit ID** — `ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ`  
   → `.env` → `VITE_ADMOB_BANNER_ID=...`
3. **Interstitial Ad Unit ID**  
   → `.env` → `VITE_ADMOB_INTERSTITIAL_ID=...`

Şu an hepsi **Google resmi TEST ID** ile çalışıyor — gerçek para/trafik üretmez, hesabı ban riskinden korur.

## Gerçek ID'leri bağlama adımları

1. `android/app/src/main/res/values/strings.xml` → `admob_app_id` değerini gerçek App ID ile değiştir
2. Proje kökünde `.env` dosyasına ekle:
   ```
   VITE_ADMOB_BANNER_ID=ca-app-pub-.../...
   VITE_ADMOB_INTERSTITIAL_ID=ca-app-pub-.../...
   ```
3. Yeniden build:
   ```bash
   npm run release:android
   ```
4. `teslimat-mobil/` içindeki AAB/APK'yı güncelle

Reklamları tamamen kapatmak için: `VITE_ADMOB_ENABLED=false`

## Dosyalar

- `src/lib/admob/config.ts` — ID'ler, throttle ayarı
- `src/lib/admob/index.ts` — init / banner / interstitial
- `src/components/AdMobBootstrap.tsx` — uygulama açılışında başlatma
- `android/.../AndroidManifest.xml` — `APPLICATION_ID` meta-data
- `android/.../strings.xml` — `admob_app_id`

## Notlar

- Play Console'da reklamlı uygulama için gizlilik politikası ve AdMob/UMP (GDPR) mesajlarının yapılandırılması gerekir.
- Test cihazında gerçek birim ID ile deneme yaparken AdMob'da cihazı "test device" olarak ekleyin; aksi halde politika ihlali riski olur.
- Banner üstte; alt NavBar ile çakışmaz. Banner yüksekliği `--admob-banner-offset` CSS değişkeniyle içeriği iter.
