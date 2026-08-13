# BiteCode — Android Yayın / Teslimat Rehberi

Play Console’a yükleme, imzalama ve mağaza checklist’i.

**Güncel sürüm:** `versionCode 12` / `versionName 1.5.4` (**BiteCode**)  
Paket: `com.barkodkontrol.app` (değişmez)  
Bu pakette: native ML Kit kamera, AdMob production (banner + interstitial), TR/EN, BiteCode marka varlıkları.

**Gizlilik politikası (canlı):**  
https://mustafaxln.github.io/barcode-app/privacy.html  
Kaynak: `docs/privacy.html` (GitHub Pages → branch `main` / folder `/docs`)

## Teslim dosyaları (`teslimat-mobil/` veya `BiteCode-teslimat-*`)

Bu klasörler **repoya dahil edilmez** (`.gitignore`). Ayrı / güvenli kanaldan iletilir — içinde **imzalama anahtarı** vardır; kaybolursa Play güncellemesi yapılamaz.

| Dosya | Ne işe yarar |
|---|---|
| `*-release.aab` / `app-release.aab` | **Play’e yüklenecek asıl dosya** |
| `*-release.apk` | Sideload / cihaz testi (Play’e AAB gider) |
| `*.keystore` | Upload key — kritik yedek |
| `keystore.properties` | Alias + parolalar (düz metin; sadece güvenli paket) |

## Keystore

- **Alias (tipik):** `barkodkontrol`
- **Parolalar:** `keystore.properties` (repoda yok)
- **Sertifika SHA-256:** `FB:03:BF:FF:B6:E5:FC:6B:DC:17:89:D5:5C:B1:6D:9F:0F:4F:77:7B:20:2E:58:3D:6C:46:1D:4C:54:02:82:72`

Keystore + şifreyi parola yöneticisine koy. Kaybedilirse aynı paket adına güncelleme imzalanamaz.

## Yeniden build

```bash
npm run release:android
# Çıktı:
#   android/app/build/outputs/bundle/release/app-release.aab
#   android/app/build/outputs/apk/release/app-release.apk
```

`android/keystore.properties` + keystore dosyası lokalde olmalı. Her Play yüklemesinde `versionCode` artır.

## Play Console özeti

1. Uygulama oluştur / seç — paket `com.barkodkontrol.app`
2. **Test edin → Dahili test** veya **Kapalı test** → AAB yükle
3. Yeni hesaplarda genelde **kapalı test ~12 kişi / ~14 gün** gerekir, sonra **Üretim**
4. Zorunlu formlar: gizlilik URL, Ads=Yes, içerik derecelendirme, hedef kitle 13+, Data safety, reklam kimliği (AdMob), mağaza girişi

### Mağaza varlıkları (repoda)

| Öğe | Konum |
|---|---|
| 512 ikon | `assets/play-store-icon-512.png` |
| Feature graphic 1024×500 | `assets/bitecode-brand/bitecode-feature-graphic-1024x500.png` |
| Telefon ekran görüntüleri | `ekran-goruntuleri/play-store-upload/` |
| Önerilen başlık | `BiteCode: Food Scanner` |

### Örnek kısa açıklama (EN, ≤80)

```
Scan food barcodes for ingredients, nutrition & personal fit score.
```

### Data safety (özet)

- **Cihaz / diğer kimlikler** + **Uygulama işlemleri** → AdMob (toplanır + paylaşılır, reklam)
- **Kullanıcı içeriği** → manuel ürün ekleme (toplanır, paylaşılmaz; isteğe bağlı; uygulama işlevi)
- Aktarım şifreleme: Evet (HTTPS)
- Hesap oluşturma: yok

Detay: `ADMOB.md`, `docs/privacy.html`.

## Durum notu (2026-08)

- Production AdMob App ID + birimler bağlandı (birimler `.env`; App ID `strings.xml`)
- Gizlilik sayfası yayınlandı
- Mağaza metinleri / görseller hazır
- Yayına çıkış: kapalı test → üretim incelemesi (hesap politikasına bağlı)
