# Barkod Kontrol — Android Yayın / Teslimat Rehberi

Bu dosya, mobil uygulamayı Google Play Console'a yüklemek için gereken adımları ve teslim edilen dosyaların ne olduğunu açıklar.

**Güncel sürüm:** `versionCode 5` / `versionName 1.3.1`  
Bu pakette: özel uygulama ikonu, Tara ekranı banner boşluğu, AdMob (test ID), TR/EN, geçmiş skor / besin düzeltmeleri.

## 📦 Teslim Edilen Dosyalar (`teslimat-mobil/` klasörü)

Bu klasör repoya dahil edilmez (`.gitignore`), ayrı ve güvenli bir kanaldan (örn. şifreli zip, güvenli dosya paylaşımı) iletilmelidir çünkü içinde **imzalama anahtarı** var — bu anahtar kaybolursa uygulamanın Play Store'daki güncellemeleri asla yayınlanamaz.

| Dosya | Ne işe yarar |
|---|---|
| `barkodkontrol-release.aab` | **Play Console'a yüklenecek asıl dosya.** Android App Bundle formatı, Google Play'in artık zorunlu tuttuğu format. |
| `barkodkontrol-release.apk` | İmzalı release APK — Play Store'a yüklenmez, ama gerçek bir cihaza `adb install` ile veya dosyayı telefona atıp kurarak **son kullanıcı deneyimini test etmek** için kullanılır. |
| `barkodkontrol-debug-test.apk` | İmza gerektirmeyen debug build — geliştirme sürecinde hızlı test için. Play Store'a **asla** yüklenmez. |
| `barkodkontrol-release.keystore` | Uygulamanın imzalama anahtarı (upload key). **Çok kritik, yedeklenmeli.** |
| `keystore.properties` | Keystore'un şifreleri ve alias bilgisi (düz metin, sadece bu teslimat paketinde). |

## 🔑 Keystore Bilgileri

- **Dosya:** `barkodkontrol-release.keystore`
- **Alias:** `barkodkontrol`
- **Store parolası / Key parolası:** `keystore.properties` içinde (ikisi de aynı — PKCS12 formatı store ve key parolasının aynı olmasını gerektiriyor)
- **Geçerlilik:** 10.000 gün (~27 yıl)
- **Sertifika SHA-256 fingerprint:** `FB:03:BF:FF:B6:E5:FC:6B:DC:17:89:D5:5C:B1:6D:9F:0F:4F:77:7B:20:2E:58:3D:6C:46:1D:4C:54:02:82:72`

⚠️ **Bu keystore'u kaybederseniz ya da şifresini unutursanız, uygulamanın Play Store'daki mevcut sürümüne asla güncelleme yayınlayamazsınız** — yeni bir keystore ile yeni bir uygulama olarak (yeni package adıyla) baştan yayınlamak gerekir. Bu dosyayı ve şifresini bir parola yöneticisine veya güvenli bir yedekleme sistemine kaydedin.

## 🚀 Play Console'a Yükleme Adımları

1. [Google Play Console](https://play.google.com/console) → uygulamanızı seçin (veya "Uygulama oluştur" ile yeni kayıt açın)
   - Uygulama adı: **Barkod Kontrol** (veya istenen isim)
   - Paket adı (`applicationId`): `com.barkodkontrol.app` — **bu alan sonradan değiştirilemez**, dikkatli kontrol edin
2. Sol menüden **Test edin → Kapalı test** (veya doğrudan **Üretim**, hesabınıza bağlı) → **Yeni sürüm oluştur**
3. `barkodkontrol-release.aab` dosyasını yükleyin
4. Sürüm notları yazın, örn: "v1.2 — TR/EN dil seçimi, besin değeri düzeltmeleri, geçmiş skorunun profile göre güncellenmesi"
5. Mağaza ekleri: **Uygulama içeriği** bölümünde zorunlu formları doldurun (aşağıdaki "Eksikler" kısmına bakın)
6. İnceleme için gönderin

### Yeni hesaplarda "12 test kullanıcısı / 14 gün" kuralı
Google Play, yeni geliştirici hesaplarını üretime doğrudan geçirmeden önce kapalı test aşamasında en az 12 test kullanıcısı ve 14 gün beklemenizi isteyebilir. Bu, hesabın yaşına/geçmişine bağlıdır — sizin hesabınızda bu kısıtlama olup olmadığını Play Console ilk girişte size gösterecektir. Bu bizim kontrolümüz dışında, hesap sahibinin karşılaşacağı bir adım.

## ⚠️ Play Console Başvurusu İçin Eksik/Dikkat Edilmesi Gerekenler

- **Gizlilik politikası URL'si (zorunlu):** Play Console, herkese açık bir gizlilik politikası linki ister. Uygulama içinde `/hakkinda` sayfasında metin var ama **canlı, herkese açık bir URL** gerekiyor. Seçenekler:
  - Web sürümünü Vercel'e deploy edip `https://.../hakkinda` linkini kullanmak (kod hazır, `npm run build` sonrası `vercel deploy` yeterli)
  - Ya da gizlilik metnini basit bir statik sayfa (GitHub Pages, Notion public page vb.) olarak yayınlamak
- **Store görselleri (zorunlu):** Uygulama ikonu (512x512), öne çıkan görsel (1024x500), en az 2 ekran görüntüsü. Şu an uygulama Capacitor'ün varsayılan ikonunu kullanıyor — marka ikonu henüz hazırlanmadı.
- **Kısa/uzun açıklama metni:** Play Store listeleme metni henüz yazılmadı.
- **İçerik derecelendirmesi anketi, veri güvenliği formu:** Play Console içinde doldurulması gereken standart formlar (kameraya erişim, veri toplama vb. sorular — bu uygulama sadece localStorage kullanıyor, sunucuya kişisel veri göndermiyor, kamera sadece barkod okumak için kullanılıyor ve görüntü kaydedilmiyor).

## 🛠️ Yerel Ortamda Yeniden Build Alma (İleride Güncelleme Gerekirse)

```bash
# 1. Web build + Android projesine senkronize et
npm run cap:sync

# 2. android/ klasöründe imzalı AAB al
cd android
export JAVA_HOME=/opt/homebrew/opt/openjdk@21   # veya kurulu JDK yolunuz
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools  # veya SDK yolunuz
./gradlew bundleRelease

# Çıktı: android/app/build/outputs/bundle/release/app-release.aab
```

`versionCode` ve `versionName` değerlerini her yeni sürümde `android/app/build.gradle` içinde artırmanız gerekir (Play Console aynı `versionCode` ile ikinci bir yükleme kabul etmez).
