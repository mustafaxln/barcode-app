# BiteCode

Barkod tarayarak gıda ürünlerinin içindekilerini, besin değerlerini ve kişisel uygunluk skorunu gösteren Android uygulaması (React + Vite + Capacitor).

| | |
|---|---|
| **Mağaza adı** | BiteCode: Food Scanner |
| **Paket** | `com.barkodkontrol.app` *(değiştirilmez)* |
| **Sürüm** | `versionCode 12` / `versionName 1.5.4` |
| **Gizlilik** | https://mustafaxln.github.io/barcode-app/privacy.html |

> Paket adı tarihsel nedenlerle `barkodkontrol` kalır; kullanıcıya görünen isim **BiteCode**.

## Özellikler

- Native kamera ile barkod tarama (ML Kit) + web’de ZXing yedek
- Manuel barkod girişi
- Open Food Facts + Supabase ürün önbelleği
- Cihazda hassasiyet profili → uygunluk skoru / alerjen uyarısı
- Geçmiş ve favoriler (`localStorage`, hesap yok)
- Manuel ürün ekleme (Supabase)
- TR / EN
- AdMob (banner üstte, interstitial her 3. ürün detayında)

## Kurulum

```bash
npm install
cp .env.example .env   # Supabase + (opsiyonel) AdMob birim ID'leri
npm run dev
```

### Ortam değişkenleri

| Değişken | Açıklama |
|---|---|
| `VITE_SUPABASE_URL` | Supabase proje URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_ADMOB_BANNER_ID` | Production banner birimi (boşsa Google test ID) |
| `VITE_ADMOB_INTERSTITIAL_ID` | Production interstitial birimi (boşsa Google test ID) |
| `VITE_ADMOB_ENABLED` | `false` ise reklamlar kapalı |

AdMob **App ID** native’de: `android/app/src/main/res/values/strings.xml` → `admob_app_id`.

**Asla commit etme:** `.env`, `*.keystore`, `keystore.properties`, `teslimat-mobil/`, AAB/APK teslim paketleri.

## Supabase

1. [supabase.com](https://supabase.com) üzerinde proje oluştur.
2. SQL Editor’de `supabase/migrations/0001_init.sql` çalıştır.
3. URL + anon key’i `.env`’e yaz.

Free tier pause’u önlemek için: `.github/workflows/supabase-keep-alive.yml`  
Repo **Settings → Secrets → Actions** içine `SUPABASE_URL` ve `SUPABASE_ANON_KEY` ekle.

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Web geliştirme sunucusu |
| `npm run build` | Production web build (`dist/`) |
| `npm run lint` | TypeScript kontrolü |
| `npm run cap:sync` | Build + Android sync |
| `npm run release:android` | İmzalı AAB + APK (keystore gerekir) |
| `npm run smoke` | Basit smoke script |

Release çıktıları:

- `android/app/build/outputs/bundle/release/app-release.aab` → Play’e bu yüklenir
- `android/app/build/outputs/apk/release/app-release.apk` → sideload / cihaz testi

Her Play yüklemesinde `android/app/build.gradle` içinde `versionCode` artırılmalı.

## Dokümantasyon

| Dosya | İçerik |
|---|---|
| `README_YAYIN.md` | Play / AAB / keystore / mağaza checklist |
| `ADMOB.md` | Reklam entegrasyonu |
| `TESTING.md` | Manuel test checklist |
| `PROJE-SUNUMU.md` | Mimari ve ürün özeti |
| `PROJE-REHBERI.md` | Kod haritası |
| `ROADMAP.md` | Sprint geçmişi / durum |
| `docs/privacy.html` | Gizlilik politikası (GitHub Pages `/docs`) |

## Play Store varlıkları

- İkon / feature graphic: `assets/bitecode-brand/`
- Play ikon kaynağı: `assets/play-store-icon-512.png`
- Ekran görüntüleri (yükleme): `ekran-goruntuleri/play-store-upload/`

## Proje yapısı

```
src/
├── pages/        Tara, Ürün, Geçmiş, Favoriler, Profil, ManuelEkle, Hakkında
├── components/   UI + AdMobBootstrap
├── lib/          OFF, Supabase, skor, AdMob, native barkod
└── hooks/
android/          Capacitor native proje
supabase/         SQL migration
docs/             privacy.html (Pages)
```

## Şirket reposuna taşırken

1. Bu repoyu push et (**`.env` ve keystore hariç** — zaten `.gitignore`’da).
2. Actions secret’larını yeni repoda yeniden tanımla.
3. Keystore + `keystore.properties`’i güvenli kanaldan (1Password / şifreli arşiv) ilet; Git’e koyma.
4. Gizlilik URL’si kişisel Pages’teyse şirket domain’ine taşıyıp Play + `docs/privacy.html` referanslarını güncelle.
