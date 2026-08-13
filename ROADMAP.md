# 📱 Barkodlu Ürün İçerik Kontrol Uygulaması — Proje Yol Haritası (v2)

> **Durum:** Blok 1-9 kod tarafı tamamlandı, Supabase backend bağlandı ve doğrulandı. Şu an gerçek Open Food Facts verisiyle QA/hata ayıklama turu sürüyor.
> **Strateji (GÜNCEL):** Tek bir **web uygulaması** (React + Vite) yazılacak → **Vercel**'e deploy edilecek → **Supabase** backend olarak kullanılacak → **Capacitor** ile aynı kod tabanı Android'e sarılıp **Google Play**'e çıkılacak.
> **Hedef süre:** 1-2 gün içinde geliştirme + yayına hazır hale getirme.
> Bu dosya canlı yol haritasıdır, ilerledikçe checkbox'lar `[x]` yapılacak.

---

## 🟡 Teslimat Kapsamı ve Geride Kalan Riskler

**Netleşen nokta:** Uygulamayı biz yayınlamıyoruz, **teslim ediyoruz**. Bu yüzden Google Play'in "yeni hesaplarda 12 test kullanıcısı / 14 gün kapalı test" kuralı bizim sprint'imizi bloklamıyor — o adım, teslimatı alan tarafın kendi Play Console hesabında yapacağı bir iş. Bunu **Blok 10**'da "biz Play Console'da yayınlarız" değil, "**teslim edilebilir, imzalı bir Android build + gerekli dosyalar hazırlarız**" şeklinde revize ediyoruz (aşağıda güncellendi).

Geriye, tamamen bizim kontrolümüzde olan ve zamanında çözmemiz gereken teknik riskler kaldı:

1. **Open Food Facts CORS:** Tarayıcıdan direkt istek atılabiliyor mu, yoksa Vercel serverless proxy gerekecek mi? → Blok 3'te ilk saatte test edilip netleşecek.
2. **Capacitor WebView'da kamera izni/erişimi — ✅ Kod seviyesinde doğrulandı:** `@capacitor/android` paketinin kendi `BridgeWebChromeClient.java` kaynağını inceledim — `onPermissionRequest` metodu zaten JS'ten gelen kamera (`VIDEO_CAPTURE`) isteklerini yakalayıp Android'in runtime izin diyaloğunu otomatik açıyor ve onaylanırsa WebView'a izni veriyor. Yani ekstra native kod yazmamıza **gerek yok**, sadece manifest'e `CAMERA` iznini eklemek yeterli (Blok 9'da yapıldı). Yine de gerçek cihazda bir kez denenmesi öneriliyor; sorun çıkarsa native `@capacitor-mlkit/barcode-scanning` plugin'ine geçiş yedek plan olarak duruyor (Faz Sonrası Backlog'da zaten var).
3. **Keystore / imzalama:** Android AAB'yi imzalamak için bir keystore dosyası üretilecek. Bu dosya **ileride uygulama güncellemesi yapılabilmesi için kritik** — teslimat paketine keystore + şifresi + "bu dosyayı kaybetmeyin, kaybederseniz yeni güncelleme farklı bir uygulama olarak görünür" notu eklenecek.
4. **Auth kararı:** Henüz netleşmedi, v1'de localStorage öneriliyor (hız için) — aşağıda hâlâ açık, varsayılan olarak bu şekilde ilerleyeceğiz, itirazınız olursa değiştiririz.

Tek gerçek açık soru şu: **Teslimat tam olarak ne içerecek?** (kaynak kod + imzalı APK/AAB mi, sadece canlı Vercel linki + kod mu, yoksa hepsi mi) — bu, Blok 10'un son halini belirliyor. Şimdilik varsayım: **kaynak kod + Vercel'de canlı web app + imzalı AAB + keystore + kurulum/yayın talimatları** şeklinde tam paket hazırlayacağız.

---

## ⚖️ Yasal / Etik Not (Değişmedi)

Uygulama **tıbbi veya beslenme tavsiyesi vermez**. Uygunluk skoru ve içerik analizleri bilgilendirme amaçlıdır. Bu metin: ürün detay ekranında, ilk açılış onboarding'inde ve "Hakkında" sayfasında yer alacak. Play Store gizlilik politikası sayfasında da bu netlik tekrar edilecek.

---

## 🏗️ Güncel Mimari — Tek Kod Tabanı, Capacitor ile Native Sarma

Önceki plandaki ayrı `apps/web` + `apps/mobile` monorepo yapısından **vazgeçiyoruz**. Capacitor zaten var olan web app'i native bir kabuğa sardığı için buna gerek yok — hız için en doğrusu **tek proje**:

```
barcode-app/
├── src/
│   ├── pages/            → Tarama, ÜrünDetay, Geçmiş, Favoriler, Profil, ManuelEkle
│   ├── components/        → Paylaşılan UI parçaları
│   ├── lib/
│   │   ├── supabaseClient.ts
│   │   ├── openFoodFacts.ts
│   │   ├── scoring.ts      → uygunluk skoru mantığı
│   │   └── sensitivities.ts→ alerjen/hassasiyet eşleştirme
│   ├── hooks/
│   └── App.tsx
├── android/               → Capacitor tarafından üretilecek (Faz sonunda)
├── capacitor.config.ts
├── supabase/              → SQL migration'ları
└── vercel.json
```

**Teknoloji seçimleri (güncel):**

| Katman | Seçim |
|---|---|
| UI Framework | React + Vite + TypeScript |
| Stil | Tailwind CSS |
| Routing | React Router |
| Barkod okuma | `@zxing/library` (`getUserMedia` ile) — hem tarayıcıda hem Capacitor WebView'ında **aynı kod** çalışır, ekstra native plugin'e gerek yok (hız için) |
| State/Data | React Query (TanStack Query) |
| Backend | Supabase (Postgres + Storage; **Auth v1'de YOK**, aşağıda açıklandı) |
| Kullanıcı verisi (hassasiyet, geçmiş, favori) | v1: **localStorage** (hızlı, auth'suz) → sonra istenirse Supabase Auth'a taşınır |
| Web → Mobile | **Capacitor** (`@capacitor/core`, `@capacitor/android`) — kod değişmeden Android'e sarılır |
| Hosting | Vercel (web) |
| Dağıtım | Google Play Console (Capacitor ile üretilen AAB) |

**Neden Auth'suz v1?** Supabase Auth (kayıt, giriş, session, RLS per-user) tek başına yarım gün sürebilecek bir iş. 1-2 günlük hedefte hassasiyet tercihi/geçmiş/favori gibi kişisel veriyi **cihaz bazlı localStorage**'da tutmak, çekirdek değeri (barkod okut → içerik/skor gör) çok daha hızlı canlıya almamızı sağlar. Auth, "Faz Sonrası Backlog"a alındı — kullanıcı isterse Faz olarak hızlıca eklenebilir.

---

## 🗄️ Supabase Veritabanı Şeması — Sadeleştirilmiş (v1)

Sadece gerçekten gerekli olanlar:

- **products** — `barcode` (unique, PK gibi kullanılacak), `name`, `brand`, `image_url`, `ingredients_text`, `nutrition_json`, `additives_tags` (text[]), `allergens_tags` (text[]), `category`, `source` (`off` | `manual`), `verified` (bool), `created_at`
  - Amaç: Open Food Facts'ten çekilen veriyi **cache'lemek** (aynı barkodu tekrar tekrar OFF'a sormamak) + manuel eklenen ürünleri tutmak.
- **manual_submissions** — `barcode`, `name`, `brand`, `ingredients_text`, `nutrition_json`, `image_url`, `status` (`pending`/`approved`/`rejected`), `created_at`
  - Amaç: Ürün bulunamadığında kullanıcının girdiği veriyi tutmak; onaylanınca `products`'a taşınır.

RLS: `products` herkese açık okunur; yazma sadece kendi backend mantığımız (anon key ile insert, `manual_submissions` üzerinden kontrollü) üzerinden. `manual_submissions`'a herkes insert edebilir, okuma/onay Supabase dashboard üzerinden manuel yapılır (v1'de admin panel yok).

**Faz Sonrası eklenecek tablolar** (v1'de YOK): `user_profiles`, `user_sensitivities`, `scan_history`, `favorites`, `allergens`, `additives` referans tabloları — bunlar v1'de kod içinde sabit (hardcoded) listeler ve localStorage ile çözülecek, DB'ye taşınmaları auth geldiğinde yapılacak.

---

## 🧮 Uygunluk Skoru — v1 Basitleştirilmiş Mantık

1. **Alerjen çakışması (en kritik):** Kullanıcının localStorage'daki seçili alerjenlerinden biri `allergens_tags` içinde varsa → net kırmızı uyarı + skor otomatik "Uygun Değil".
2. **Diyet uyumu:** vegan/vejetaryen/glutensiz/laktozsuz seçiliyse, OFF'un kendi etiketleri (`labels_tags`) ve anahtar kelime taraması (örn. "süt", "jelatin", "buğday") ile basit kontrol.
3. **Besin değeri puanı:** Şeker/tuz/yağ/doymuş yağ için basit eşik tablosu (100g'da yüksek/orta/düşük) → 100 üzerinden puan.
4. **Katkı maddesi uyarısı:** `additives_tags` sayısı ve bilinen "dikkat edilmesi gereken" E-kodları (hardcoded küçük bir liste, örn. E250, E621, E951...) için puan düşürme + açıklama metni.
5. Sonuç: **0-100 skor + renkli rozet (Uygun / Dikkatli Ol / Uygun Değil)** + "Neden bu skor?" açılır liste.

Bu mantık `src/lib/scoring.ts` içinde, framework'ten bağımsız düz TypeScript fonksiyon olarak yazılacak — ileride mobile'a (Capacitor zaten aynı kodu kullanacağı için) veya native RN'e taşınması gerekirse sorunsuz taşınır.

---

# 🚀 SPRINT PLANI — GÜN 1 ve GÜN 2

## GÜN 1 — Çekirdek Akış: Tara → Ürünü Gör

### Blok 1 — Kurulum (≈1 saat) — ✅ Tamamlandı
- [x] Vite + React + TypeScript scaffold
- [x] Tailwind CSS (v4) kurulumu, temel renk paleti (brand/warn/danger renkleri `src/index.css` içinde)
- [x] `supabase/migrations/0001_init.sql` yazıldı (`products`, `manual_submissions` tabloları + RLS)
- [x] **Supabase projesi oluşturuldu, `.env` dolduruldu, RLS politikaları doğrulandı.** Yol boyunca çıkan `manual_submissions` insert hatası ("RLS violation") teşhis edildi: politika baştan doğruydu, hata aslında SELECT politikası olmayan bir tabloda `RETURNING`/`return=representation` ile satırı geri okumaya çalışmaktan kaynaklanıyordu. Uygulama kodu satırı geri istemediği için (`return=minimal`) gerçek akış hep sorunsuzdu.
- [ ] ⏳ **Kullanıcı aksiyonu (opsiyonel):** Vercel projesi bağlama, ilk deploy — PM'in "uygulama mobil-öncelikli deneyim, web'e gerek olmayabilir" notuna göre bu adım artık zorunlu değil, istenirse yapılacak
- [x] Git init + ilk commit (2 commit: kurulum + gitignore düzeltmesi)

### Blok 2 — Barkod Tarama Ekranı (≈2 saat) — ✅ Tamamlandı
- [x] Kamera izni akışı + `@zxing/library` (`BrowserMultiFormatReader`) ile canlı barkod okuma (EAN-13/EAN-8/UPC-A/UPC-E/CODE-128 formatlarına odaklanıldı)
- [x] Manuel barkod girişi (kamera çalışmazsa fallback + hızlı test için pratik)
- [x] Tarama UI: kamera görüntüsü + hedef overlay + yükleniyor/hata durumları (izin reddi, kamera bulunamadı, genel hata mesajları ayrıştırıldı)
- [x] Barkod okunduğunda `/urun/:barcode` rotasına yönlendirme çalışıyor (veri çekme Blok 3'te)
- [ ] ⏳ **Kullanıcı doğrulaması gerekiyor:** Gerçek bir tarayıcı/telefonda kamera izninin ve taramanın gerçekten çalıştığının test edilmesi (sandbox ortamında kamera erişimi test edilemiyor)

### Blok 3 — Ürün Verisi Çekme (≈2 saat) — ✅ Tamamlandı
- [x] `openFoodFacts.ts`: OFF v2 API client + kendi `Product` tipimize mapper (besin değerleri, katkı maddesi/alerjen etiketleri dahil)
- [x] **CORS testi yapıldı ve OLUMLU çıktı** — OFF API `access-control-allow-origin: *` döndürüyor, tarayıcıdan direkt istek atılabiliyor. Vercel proxy'ye **gerek yok**, bir risk daha kapandı.
- [x] Akış (`productRepository.ts`): önce Supabase `products`'ta ara → yoksa OFF'tan çek → bulunursa Supabase'e cache yaz (Supabase henüz kurulmadıysa hata fırlatmadan, sadece uyarı loglayıp OFF ile devam ediyor)
- [x] Ürün bulunamadı durumunda `ProductPage`'de "Bu Ürünü Sen Ekle" linki ile `/urun-ekle/:barcode`'a yönlendirme (form Blok 7'de)
- [ ] ⏳ **Kullanıcı doğrulaması gerekiyor:** Gerçek tarayıcıda birkaç barkod denenip OFF'tan verinin doğru geldiğinin teyit edilmesi (sandbox'ta headless tarayıcı yok, sadece API/kod seviyesinde doğrulandı)

### Blok 4 — Ürün Detay Ekranı (≈2 saat) — ✅ Tamamlandı
- [x] Ürün adı, marka, görsel
- [x] İçindekiler listesi (`parseIngredients` — parantez/köşeli parantez derinliğini takip ederek üst seviye virgüllerden bölen ayrıştırıcı, numaralı liste olarak gösteriliyor)
- [x] Besin değerleri tablosu (100g bazında; yağ/doymuş yağ/şeker/tuz için UK FSA trafik ışığı eşiklerine göre Düşük/Orta/Yüksek renkli rozet)
- [x] Sorumluluk reddi metni (`DisclaimerNote` bileşeni — tekrar kullanılabilir, onboarding/Hakkında'da da kullanılacak) her ürün ekranında görünür

**Gün 1 sonu çıktı — ✅ ULAŞILDI (Vercel deploy'u hariç, kullanıcı aksiyonu bekliyor):** Barkod tara (kamera veya elle) → OFF/Supabase'ten veri çek → ürün adı, marka, görsel, içindekiler listesi, renkli besin değeri tablosu ve sorumluluk reddi ile tam bir ürün detay ekranı gösteriliyor. Yerel ortamda (`npm run dev`) uçtan uca çalışıyor; Vercel'e taşınması Supabase/Vercel hesap bilgileri geldiğinde birkaç dakika sürecek.

---

## GÜN 2 — Kişiselleştirme, Skor, Capacitor, Play Console

### Blok 5 — Hassasiyet Profili (≈1 saat) — ✅ Tamamlandı
- [x] Basit seçim ekranı: 12 alerjen (çoklu seçim, chip'ler), vegan/vejetaryen, glutensiz/laktozsuz diyet, şeker/tuz/yağ takibi
- [x] `src/lib/sensitivities.ts` — localStorage'a kayıt/okuma + `useSensitivities` hook'u
- [x] Profil ekranından (`/profil`) sonradan düzenlenebiliyor, değişiklik anında localStorage'a yazılıyor
- [x] **Önemli tasarım kararı:** Alerjen id'leri Open Food Facts'in `allergens_tags` taksonomisiyle bire bir aynı tutuldu (`gluten`, `milk`, `nuts`...) — Blok 6'daki eşleştirme mantığı ekstra çeviri tablosuna gerek kalmadan doğrudan küme kesişimiyle çalışacak

### Blok 6 — Alerjen Uyarısı + Uygunluk Skoru (≈2 saat) — ✅ Tamamlandı
- [x] `src/lib/scoring.ts`: skor mantığının implementasyonu (alerjen sert engelleme → diyet uyumu → besin değeri puanı → katkı maddesi puanı)
- [x] Ürün detayında büyük, kırmızı alerjen uyarı banner'ı (`AllergenWarningBanner`)
- [x] Skor rozeti + "Neden bu skor?" açılır detay listesi (`ScoreBadge`)
- [x] Katkı maddesi kartları (`AdditivesList` + `src/lib/additives.ts` — ~20 E-kodluk referans liste, dikkat gerektirenler sarı vurgulu)
- [x] **Gerçek veriyle doğrulandı:** Nutella örneğiyle 3 senaryo test edildi (hassasiyet yok → 74 puan "Uygun"; fındık alerjisi seçili → 0 puan "Uygun Değil" sert engelleme; vegan+şeker takibi → 17 puan "Uygun Değil") — matematik ve mantık beklendiği gibi çalışıyor

### Blok 7 — Geçmiş, Favoriler, Manuel Ekleme (≈1.5 saat) — ✅ Tamamlandı
- [x] Tarama geçmişi: `ScanPage`'den gelen taramalar (`fromScan` işareti) otomatik localStorage'a kaydediliyor; Geçmiş/Favoriler listesinden tekrar açmak yeni kayıt oluşturmuyor. Geçmiş ekranı tarih sıralı, skor rozetli, tamamen offline çalışıyor
- [x] Favoriler: ürün detayında kalp butonu ile toggle + `/favoriler` liste ekranı (kaldır butonu dahil)
- [x] Manuel ürün ekleme formu: ad, marka, içindekiler, görsel URL, 8 besin değeri alanı → `manual_submissions` tablosuna insert (Supabase henüz kurulmadıysa hata mesajı gösteriyor, uygulamayı kırmıyor)

### Blok 8 — Web Cilalama ve Prod Deploy (≈1 saat) — 🟡 Kod tarafı tamamlandı, deploy kullanıcı aksiyonu bekliyor
- [x] Responsive kontrol: NavBar küçük ekranda alt, büyük ekranda üst navigasyon olacak şekilde zaten tasarlanmıştı, teyit edildi
- [x] Boş/hata durumları taraması: tüm sayfalarda (Tara, Ürün, Geçmiş, Favoriler) yükleniyor/boş/hata durumları zaten mevcuttu, gözden geçirildi
- [x] **Performans:** Route bazlı code-splitting eklendi (`React.lazy` + `Suspense`) — "500kB üzeri chunk" uyarısı kayboldu, `@zxing/library` ve `@supabase/supabase-js` artık ayrı chunk'larda, sadece ihtiyaç olan sayfa yüklendiğinde iniyor
- [x] **İlk açılış onayı:** `DisclaimerGate` bileşeni — uygulamayı ilk açtığınızda "Başlamadan Önce" sorumluluk reddi ekranı çıkıyor, bir kez onaylanınca tekrar çıkmıyor (localStorage)
- [x] **Hakkında sayfası** (`/hakkinda`) — veri kaynağı, sorumluluk reddi tam metni, gizlilik notu (kamera/localStorage)
- [x] Küçük a11y iyileştirmesi: video elementine `aria-label` eklendi
- [x] `TESTING.md` — gerçek cihazda geçilmesi gereken manuel test checklist'i yazıldı (kamera/tarama gibi sandbox'ta test edilemeyen akışlar için)
- [x] Supabase RLS son kontrol yapıldı, `manual_submissions` ve `products` üzerinde insert/upsert/select uçtan uca doğrulandı
- [ ] ⏳ **Kullanıcı aksiyonu (opsiyonel):** Vercel production deploy — web versiyonuna gerek görülürse yapılacak

### Blok 9 — Capacitor ile Android'e Sarma (≈1.5-2 saat) — ✅ Tamamlandı
- [x] `@capacitor/core` + `@capacitor/android` + `@capacitor/cli` kurulumu
- [x] `npx cap init` — **Not:** `capacitor.config.ts` yerine `capacitor.config.json` kullanıldı çünkü kurulan TypeScript 7 (henüz çok yeni bir sürüm) ile `@capacitor/cli`'nin TS config parser'ı arasında bir uyumsuzluk çıktı (`ts.ModuleKind` undefined hatası); JSON format bu sorunu tamamen ortadan kaldırıyor ve işlevsel olarak birebir aynı
- [x] `npx cap add android` — native Android projesi `android/` klasöründe oluşturuldu
- [x] Kamera izni manifest'e eklendi (`android.permission.CAMERA` + `uses-feature` `required="false"`, kamerasız cihazlarda da elle giriş fallback'i çalışabilsin diye)
- [x] **Önemli mimari doğrulama:** `@capacitor/android` paketinin kaynak kodunu inceleyip, WebView'daki `getUserMedia` kamera isteklerinin Capacitor tarafından otomatik native izin akışına bağlandığını doğruladım (bkz. yukarıdaki risk notu) — ekstra native kod gerekmiyor
- [x] **Önemli düzeltme:** `android/` klasörü başta `.gitignore`'daydı (manifest'teki kamera izni özelleştirmesi kaybolurdu) — bunu düzelttim, artık `android/` commit ediliyor, sadece Gradle'ın ürettiği geçici build dosyaları (`build/`, `.gradle/`, kopyalanan web assets) hariç tutuluyor
- [x] `npm run cap:sync` script'i eklendi (`vite build && npx cap sync android`)
- [x] **Android SDK/JDK ortamı kuruldu:** Homebrew ile `openjdk@21` (zaten kuruluydu, sadece PATH'e eklendi) + `android-commandlinetools` (platform-tools, `platforms;android-34`, `build-tools;34.0.0`) kuruldu, `android/local.properties` ile Gradle'a SDK yolu tanıtıldı
- [x] `npm run cap:sync` + `./gradlew assembleDebug` çalıştırıldı → **debug APK başarıyla üretildi** (`android/app/build/outputs/apk/debug/app-debug.apk`, imza gerektirmez, gerçek cihaza kurup test edilebilir)
- [ ] App ikonu/splash screen: şu an Capacitor'ün varsayılan ikonu duruyor, marka özelleştirmesi ileride yapılabilir (fonksiyonel test için engel değil)
- [ ] Gerçek cihazda barkod tarama testi: APK bir Android telefona kurulup kamera/tarama akışı fiilen test edilmedi (sandbox'ta emülatör/cihaz yok) — **kullanıcı aksiyonu**

### Blok 10 — Teslimat Paketinin Hazırlanması (Play Console'a biz girmiyoruz) — ✅ Tamamlandı (store görselleri/metinleri hariç)
- [x] Keystore oluşturma (`android/barkodkontrol-release.keystore`, alias `barkodkontrol`, 10.000 gün geçerli), `android/keystore.properties` ile `build.gradle`'a release signing config bağlandı (repoya girmiyor, `.gitignore`'da)
- [x] İmzalı **AAB** build alındı: `android/app/build/outputs/bundle/release/app-release.aab` — Play Console'a yüklenecek dosya
- [x] İmzalı **release APK** build alındı: `android/app/build/outputs/apk/release/app-release.apk` — cihazda son kullanıcı testi için
- [x] Tüm çıktılar + keystore + şifreler `teslimat-mobil/` klasöründe toplandı (bu klasör de repoya girmiyor, ayrı/güvenli kanaldan iletilecek)
- [x] Kısa bir "nasıl yayınlanır" talimatı: **`README_YAYIN.md`** — Play Console'a AAB yükleme adımları, keystore bilgileri, yeniden build alma komutları, eksik kalan store materyalleri listesi
- [ ] Gizlilik politikası sayfası için **herkese açık URL** — kod/metin `/hakkinda` sayfasında hazır ama Play Console formu için canlı bir link gerekiyor (Vercel deploy edilirse otomatik çözülür)
- [ ] Store görselleri: ikon, öne çıkan görsel, ekran görüntüleri, kısa/uzun açıklama metni — **henüz hazırlanmadı**, `README_YAYIN.md`'de eksik olarak not edildi
- [ ] Son teslimat: kaynak kod (repo) + (opsiyonel) canlı Vercel linki + imzalı AAB/APK + keystore + yayın talimatı → **AAB/APK/keystore/talimat hazır, Vercel linki ve store görselleri kullanıcı kararına bağlı**

**Not:** Native proje (`android/`) artık sadece kod seviyesinde değil, gerçek imzalı build seviyesinde tamamlandı. Kalan işler (store görselleri, açıklama metni, gizlilik politikası URL'si) kod değil, pazarlama/hesap materyali — istenirse ayrıca hazırlanabilir.

**Gün 2 sonu çıktı — kısmen ulaşıldı:** Web app tüm özellikleriyle kodlanmış ve yerel ortamda uçtan uca çalışıyor (Vercel deploy'u Blok 1/8'deki hesap bilgileri geldiğinde tamamlanacak). Android tarafı native proje seviyesinde hazır; imzalı build ve Play Console teslimat paketi Blok 10 devam ettiğinde tamamlanacak.

### Blok 11 — Dil Desteği: TR/EN Arayüz Çevirisi — ✅ Tamamlandı
- [x] `src/lib/i18n/translations.ts` — TR/EN çeviri sözlüğü (nav, sayfalar, bileşenler, skor sebepleri, alerjenler, katkı maddeleri açıklamaları vb.)
- [x] `src/lib/i18n/LanguageContext.tsx` — `LanguageProvider` + `useLanguage()` hook'u: dil tercihini `localStorage` (`language.v1`) içinde saklıyor, ilk açılışta tarayıcı diline göre varsayılan seçiyor (`en*` → İngilizce, aksi halde Türkçe)
- [x] `NavBar`'a küçük bir **TR/EN** dil seçici eklendi (her sayfada erişilebilir)
- [x] Tüm sayfalar (Tara, Ürün, Geçmiş, Favoriler, Profil, Ürün Ekle, Hakkında) ve bileşenler (ScoreBadge, Allergen/Additives/Nutrition/Ingredients listeleri, Disclaimer'lar, ErrorBoundary) çeviriye bağlandı
- [x] Skor hesaplama mantığı (`scoring.ts`) artık hazır metin değil **yapısal sebep** (`type` + parametreler) döndürüyor; metne çevirme işini arayüz katmanı (`ScoreBadge.tsx`) `t()` ile yapıyor — böylece `scoring.ts` dil bilmeden saf mantık olarak kalıyor
- [x] Alerjen etiketleri (`sensitivities.ts`) ve katkı maddesi adı/açıklamaları (`additives.ts`) TR/EN çeviri sözlüğünden geliyor
- [x] **Ürün İÇERİĞİ (isim, içindekiler) kasıtlı olarak çeviriye dahil EDİLMEDİ** — PM kararı: içerik dili sabit **İngilizce** kalacak, sadece arayüz TR/EN arasında değişecek. `openFoodFacts.ts` artık OFF'tan `lc=en` ile ve `ingredients_text_en` önceliğiyle çekiyor (önceki `ingredients_text_tr` önceliği kaldırıldı)
- [x] `tsc --noEmit` temiz, linter hatası yok, web build + `npx cap sync android` + imzalı AAB/APK yeniden üretildi (`versionCode 2`, `versionName "1.1"`)

**Bilinen sınırlama:** Supabase `products` tablosunda **daha önce** (bu değişiklikten önce) cache'lenmiş bazı ürünlerin `ingredients_text`'i eski mantıkla (Türkçe öncelikli) çekilmiş olabilir — bu satırlar geriye dönük otomatik İngilizce'ye çevrilmiyor. Etkilenen barkod tekrar taranıp cache tazelenirse (`isStaleOffCache` mantığı besin değeri eksikse zaten tetikleniyor) veya satır Supabase'den silinirse, bir sonraki çekimde yeni İngilizce-öncelikli mantıkla güncellenir.

---

## 🐞 Bilinen Sorunlar (Çözülemedi, Sonraki Oturuma Bırakıldı)

- **Tarama sayfasından ayrılınca kamera ışığı sönmüyor:** `ScanPage`'den başka bir sayfaya (Favoriler, Profil, Geçmiş) geçildiğinde kamera ışığı (macOS'ta yeşil ışık) sönmemesi gerekiyor ama sönmüyor. Denenenler ve elenen teoriler:
  - `@zxing/library`'nin `decodeFromVideoDevice`'ının asenkron `getUserMedia` yarış durumu → düzeltildi ama sorunu çözmedi
  - Stream'i kütüphaneye bırakmak yerine kendimiz `getUserMedia` ile alıp `activeStream` ref'inde tutup cleanup'ta doğrudan `track.stop()` çağırma → düzeltildi (kod artık böyle) ama sorunu çözmedi
  - Tarayıcıda unutulmuş/arka planda açık eski sekmeler (bu oturumda çok kez port değiştirdik) → kullanıcı tüm sekmeleri kapatıp tek taze sekmeyle tekrar denedi, sorun hâlâ var, bu teori de elendi
  - Sonuç: Kod mantığı doğru görünüyor (`tsc` temiz, React Query/route unmount akışı standart) ama gerçek tarayıcıda hâlâ ışık sönmüyor — kod okuyarak teşhis sınırına gelindi
  - **Sonraki oturumda yapılacak:** `ScanPage.tsx`'e şimdi eklenen `console.log('[scan] ...')` satırlarıyla (`getUserMedia çözüldü`, `activeStream atandı`, `cleanup çalıştı`, `track durduruldu, readyState: ...`) tarayıcı konsolundan gerçek sırayı görüp tahmin yerine kesin teşhis koymak. Özellikle `track.readyState`'in `stop()` çağrısından sonra `'ended'` olup olmadığına bakılmalı — `'live'` kalıyorsa `stop()` çağrısı hiç çalışmıyor demektir (başka bir referans/kopya stream tutuluyor olabilir); `'ended'` oluyorsa tarayıcı/OS'un ışığı geç güncellemesi ayrı bir konu.
  - Not: Bu, Capacitor ile Android'e sarıldığında muhtemelen yaşanmayacak bir sorun (tek WebView/pencere, "unutulmuş sekme" ihtimali yok) ama kod seviyesinde asıl kök neden netleşmeden bunu garanti edemeyiz.

---

## 📦 FAZ SONRASI BACKLOG (v1'de Bilerek Ertelenenler)

Süre kısıtı nedeniyle v1 kapsamı dışına alınanlar — MVP oturduktan sonra sırayla eklenecek:

- [ ] Supabase Auth (email/şifre, opsiyonel Google girişi) + veriyi localStorage'dan DB'ye taşıma
- [ ] Kozmetik içerik modu (INCI bazlı ayrı eşleştirme mantığı)
- [ ] Alternatif ürün önerisi (kategori bazlı, daha yüksek skorlu ürünler)
- [ ] Manuel submission için basit admin onay ekranı (şu an Supabase dashboard'dan manuel)
- [ ] Ürün karşılaştırma ekranı
- [ ] Supabase Storage ile kullanıcı tarafından yüklenen ürün görselleri
- [ ] iOS (Capacitor ile App Store) — şu an sadece Android hedefleniyor
- [x] Native barkod plugin (`@capacitor-mlkit/barcode-scanning`) — Android'de aktif; web'de ZXing yedek

---

## 📌 Takip Notları
- Bu plan PM'in "1-2 gün, web app + Vercel + Supabase + Capacitor" talimatı üzerine v1'den güncellendi (önceki React Native/Expo + monorepo yaklaşımı terk edildi).
- Açık/varsayılan karar: v1'de Supabase Auth **yok**, hassasiyet/geçmiş/favori localStorage'da.
- Ürün adı **BiteCode**; paket id `com.barkodkontrol.app` değişmez.

### 🟢 Şu Anki Durum (v1.5.4 — BiteCode, Play hazırlığı)
Blok 1-11 + AdMob + ML Kit + BiteCode markası tamam.  
Mobil: **`versionCode 12` / `versionName 1.5.4`**. Production AdMob App ID `strings.xml`'de; birimler `.env`.  
Gizlilik: `docs/privacy.html` → https://mustafaxln.github.io/barcode-app/privacy.html  
Mağaza varlıkları: `assets/bitecode-brand/`, `ekran-goruntuleri/play-store-upload/`.

**Kalan (yayın süreci):**
1. Kapalı test (gerekirse ~12 testçi / ~14 gün) → Üretim incelemesi
2. AdMob’da store listing bağlama + reklam dolumu
3. Şirket GitHub’ına taşıma: Actions secret’larını yeniden tanımla; keystore’u Git’e koyma

**Geçmiş QA düzeltmeleri:** Supabase bağlandıktan sonra gerçek ürünlerle test ederken şu sorunlar bulunup düzeltildi:
- İçindekiler metninde ondalık virgül hatası (Fransızca "7,4%" gibi ifadeler yanlış bölünüyordu) → düzeltildi
- İçindekiler dil önceliği (tr → en → orijinal dil) + OFF'un bazı girişlerinde etikette ilgisiz metin (üretici bilgisi, SKT vb.) kopyalanmış olması → `extractIngredientsSection` ile temizlendi
- Bazı ürünlerde düz `ingredients_text` boş ama yapılandırılmış `ingredients` listesi mevcut → fallback eklendi
- **Önemli mimari düzeltme:** Supabase cache'e daha önce (kod düzeltilmeden önce) eksik/hatalı yazılmış satırlar (örn. Nutella'da besin değeri/resim boş kalmıştı) sonsuza kadar gösteriliyordu, çünkü cache her zaman OFF'a tercih ediliyordu. `productRepository.ts`'e, OFF kaynaklı ama besin değeri tamamen boş olan satırları "bozuk/eski" sayıp otomatik tazeleyen bir kontrol eklendi
- `@zxing/library`'nin normal tarama akışında (barkod her karede hemen bulunamayınca) konsolu spam'leyen zararsız iç uyarısı (`MultiFormatReader: non-ReaderException`) tarama ekranında susturuldu
- `PROJE-REHBERI.md` oluşturuldu — projenin tüm mimarisini, dosya/klasör yapısını, veri akışını örneklerle anlatan kapsamlı bir rehber

Uygulama fonksiyonel olarak tamamlanmış durumda: barkod tarama, ürün verisi (OFF + Supabase cache), hassasiyet profili, uygunluk skoru, alerjen uyarısı, katkı maddesi açıklamaları, geçmiş, favoriler, manuel ürün ekleme, AdMob, BiteCode markası, gizlilik sayfası.
