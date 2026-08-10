# Barkod Kontrol — Android Yayın / Teslimat Rehberi

Bu dosya, mobil uygulamayı Google Play Console'a yüklemek için gereken adımları ve teslim edilen dosyaların ne olduğunu açıklar.

**Güncel sürüm:** `versionCode 7` / `versionName 1.4.1`  
Bu pakette: native ML Kit kamera, özel uygulama ikonu, Tara ekranı banner boşluğu, AdMob (banner production / interstitial test), TR/EN, geçmiş skor / besin düzeltmeleri.

## Teslim Edilen Dosyalar (`teslimat-mobil/` klasörü)

Bu klasör repoya dahil edilmez (`.gitignore`), ayrı ve güvenli bir kanaldan (örn. şifreli zip, güvenli dosya paylaşımı) iletilmelidir çünkü içinde **imzalama anahtarı** var — bu anahtar kaybolursa uygulamanın Play Store'daki güncellemeleri asla yayınlanamaz.

| Dosya | Ne işe yarar |
|---|---|
| `barkodkontrol-release.aab` | **Play Console'a yüklenecek asıl dosya.** Android App Bundle formatı. |
| `barkodkontrol-release.apk` | **İmzalı release APK** — telefona kurup test için (PM'in istediği dosya). Play'e AAB yüklenir; APK cihazda denemek içindir. |
| `barkodkontrol-release.keystore` | Uygulamanın imzalama anahtarı (upload key). **Çok kritik, yedeklenmeli.** |
| `keystore.properties` | Keystore şifreleri ve alias (düz metin; sadece güvenli teslimat paketinde). |
| `imza-yedek/` | Keystore + properties ikinci kopyası. |
| `OKU-Beni-TESLIMAT.md` | Kısa teslimat özeti (PM / teslim için). |

## Keystore Bilgileri

- **Dosya:** `barkodkontrol-release.keystore`
- **Alias:** `barkodkontrol`
- **Store / Key parolası:** `keystore.properties` içinde
- **Geçerlilik:** ~2053'e kadar
- **Sertifika SHA-256:** `FB:03:BF:FF:B6:E5:FC:6B:DC:17:89:D5:5C:B1:6D:9F:0F:4F:77:7B:20:2E:58:3D:6C:46:1D:4C:54:02:82:72`

Bu keystore kaybolursa veya şifresi unutulursa, Play'deki mevcut uygulamaya güncelleme yayınlanamaz. Keystore + şifreyi parola yöneticisine ve güvenli yedeğe kaydedin.

## Play Console'a Yükleme

1. [Google Play Console](https://play.google.com/console) → uygulama seç / oluştur  
   - Paket adı: `com.barkodkontrol.app` (sonradan değişmez)
2. **Test edin → Kapalı test** (veya üretim) → **Yeni sürüm**
3. `barkodkontrol-release.aab` yükle
4. Sürüm notu örn: `v1.4.0 — native kamera tarama, ikon, AdMob test, TR/EN`
5. Mağaza ekleri / zorunlu formları doldur (aşağıdaki eksikler)

Yeni hesaplarda Google bazen 12 test kullanıcısı / 14 gün kapalı test isteyebilir.

## Play Başvurusu İçin Eksikler (PM)

- Gizlilik politikası URL'si (herkese açık)
- Store görselleri (512 ikon, feature graphic, ekran görüntüleri) — ikon kaynağı: `assets/play-store-icon-512.png`
- Kısa / uzun mağaza açıklaması
- İçerik derecelendirmesi + veri güvenliği formu
- Gerçek AdMob ID'leri (`ADMOB.md`) — şu an test ID

## Yeniden Build

```bash
npm run release:android
# Çıktı:
#   android/app/build/outputs/bundle/release/app-release.aab
#   android/app/build/outputs/apk/release/app-release.apk
```

Her yeni Play yüklemesinde `android/app/build.gradle` içinde `versionCode` artırılmalı.
