# Google AdMob Entegrasyonu

Uygulama, Capacitor native Android kabuğunda **Google AdMob** ile reklam gösterir.  
Web tarayıcıda reklam **yok** (native SDK gerekir).

## Ne var?

| Reklam | Ne zaman | Nerede |
|---|---|---|
| **Banner** (üst şerit) | Uygulama açılınca | Tüm ekranlar, üstte |
| **Interstitial** (tam ekran) | Her 3. ürün detayı açılışında | Ürün sayfası |

Paket: `@capacitor-community/admob` (Capacitor 8)

## Kimlikler nereye yazılır?

| ID | Dosya |
|---|---|
| **App ID** `ca-app-pub-…~…` | `android/app/src/main/res/values/strings.xml` → `admob_app_id` |
| **Banner Ad Unit** | `.env` → `VITE_ADMOB_BANNER_ID` |
| **Interstitial Ad Unit** | `.env` → `VITE_ADMOB_INTERSTITIAL_ID` |

`.env` örneği: `.env.example`. Birimler boşsa Google **resmi test** birimleri kullanılır (`src/lib/admob/config.ts`).

**Durum:** Production App ID `strings.xml` içinde tanımlı. Banner / interstitial production birimleri yerel `.env` ile verilir (repoya commit edilmez). Play yayını sonrası AdMob’da uygulamayı store listing’e bağlayın; yeni birimlerde dolum gecikebilir.

## Build

```bash
# .env dolu olsun, sonra:
npm run release:android
```

Reklamları kapatmak: `VITE_ADMOB_ENABLED=false`

## Dosyalar

- `src/lib/admob/config.ts` — birimler, throttle (`INTERSTITIAL_EVERY_N_PRODUCT_VIEWS = 3`)
- `src/lib/admob/index.ts` — init / banner / interstitial
- `src/components/AdMobBootstrap.tsx` — açılışta başlatma
- `android/.../AndroidManifest.xml` — `APPLICATION_ID` meta-data
- `android/.../strings.xml` — `admob_app_id`

## app-ads.txt (uygulama sahipliği)

AdMob dosyayı **domain kökünde** arar (path’i yok sayar).

| URL | AdMob görür mü? |
|---|---|
| `https://mustafaxln.github.io/barcode-app/app-ads.txt` | Hayır (proje alt yolu) |
| `https://mustafaxln.github.io/app-ads.txt` | Evet — bu şart |

Kaynak: [AdMob app-ads.txt](https://support.google.com/admob/answer/9363762?hl=en)

Gerekli repo adı: **`mustafaxln.github.io`** (user Pages). Play **Website**: `https://mustafaxln.github.io`  
Gizlilik URL’si ayrı kalır: `https://mustafaxln.github.io/barcode-app/privacy.html`

İçerik:

```
pub-7672443581181379, DIRECT, f08c47fec0942fa0
```

Crawl birkaç saat–1 gün sürebilir.

## Play / uyumluluk

- Play: **Ads = Yes**, Data safety’de cihaz kimliği + uygulama işlemleri (reklam), reklam kimliği beyanı → **Reklam veya pazarlama**
- Gizlilik politikasında AdMob belirtilmeli (`docs/privacy.html`)
- Test cihazında production birimle denemeden önce AdMob’da cihazı test device yapın
- Banner üstte; `--admob-banner-offset` içeriği iter (alt NavBar ile çakışmaz)
- EEA için UMP / consent mesajları AdMob Console’dan yapılandırılmalı
