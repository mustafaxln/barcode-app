# 📱 Barkodlu Ürün İçerik Kontrol Uygulaması — Proje Yol Haritası (v2)

> **Durum:** Plan PM talimatına göre güncellendi. Geliştirme başlamadı.
> **Strateji (GÜNCEL):** Tek bir **web uygulaması** (React + Vite) yazılacak → **Vercel**'e deploy edilecek → **Supabase** backend olarak kullanılacak → **Capacitor** ile aynı kod tabanı Android'e sarılıp **Google Play**'e çıkılacak.
> **Hedef süre:** 1-2 gün içinde geliştirme + yayına hazır hale getirme.
> Bu dosya canlı yol haritasıdır, ilerledikçe checkbox'lar `[x]` yapılacak.

---

## 🟡 Teslimat Kapsamı ve Geride Kalan Riskler

**Netleşen nokta:** Uygulamayı biz yayınlamıyoruz, **teslim ediyoruz**. Bu yüzden Google Play'in "yeni hesaplarda 12 test kullanıcısı / 14 gün kapalı test" kuralı bizim sprint'imizi bloklamıyor — o adım, teslimatı alan tarafın kendi Play Console hesabında yapacağı bir iş. Bunu **Blok 10**'da "biz Play Console'da yayınlarız" değil, "**teslim edilebilir, imzalı bir Android build + gerekli dosyalar hazırlarız**" şeklinde revize ediyoruz (aşağıda güncellendi).

Geriye, tamamen bizim kontrolümüzde olan ve zamanında çözmemiz gereken teknik riskler kaldı:

1. **Open Food Facts CORS:** Tarayıcıdan direkt istek atılabiliyor mu, yoksa Vercel serverless proxy gerekecek mi? → Blok 3'te ilk saatte test edilip netleşecek.
2. **Capacitor WebView'da kamera izni/erişimi:** Web'de `getUserMedia` ile çalışan barkod okuma, Android WebView içinde de sorunsuz çalışmalı; gerçek cihazda test edilecek (Blok 9). Sorun çıkarsa native `@capacitor-mlkit/barcode-scanning` plugin'ine geçiş yedek plan olarak duruyor (Faz Sonrası Backlog'da zaten var).
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

### Blok 1 — Kurulum (≈1 saat) — ✅ Kod tarafı tamamlandı, 2 adım kullanıcı aksiyonu bekliyor
- [x] Vite + React + TypeScript scaffold
- [x] Tailwind CSS (v4) kurulumu, temel renk paleti (brand/warn/danger renkleri `src/index.css` içinde)
- [x] `supabase/migrations/0001_init.sql` yazıldı (`products`, `manual_submissions` tabloları + RLS)
- [ ] ⏳ **Kullanıcı aksiyonu:** Supabase projesi oluşturma + migration'ı çalıştırma + `.env` doldurma
- [ ] ⏳ **Kullanıcı aksiyonu:** Vercel projesi bağlama, ilk deploy
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

### Blok 4 — Ürün Detay Ekranı (≈2 saat)
- [ ] Ürün adı, marka, görsel
- [ ] İçindekiler listesi (ham metni virgülle ayrıştırıp madde madde gösterme)
- [ ] Besin değerleri tablosu (100g bazında, renkli yüksek/orta/düşük etiketleriyle)
- [ ] Sorumluluk reddi metni bu ekranda görünür

**Gün 1 sonu çıktı:** Gerçek bir barkodu okutup ürün bilgisini gösteren, Vercel'de canlı bir demo.

---

## GÜN 2 — Kişiselleştirme, Skor, Capacitor, Play Console

### Blok 5 — Hassasiyet Profili (≈1 saat)
- [ ] Basit seçim ekranı: alerjenler (çoklu seçim), vegan/vejetaryen, glutensiz/laktozsuz, şeker/tuz/yağ takibi
- [ ] localStorage'a kayıt (`sensitivities.ts` helper)
- [ ] Profil/ayarlar ekranından sonradan düzenleme

### Blok 6 — Alerjen Uyarısı + Uygunluk Skoru (≈2 saat)
- [ ] `scoring.ts`: yukarıdaki skor mantığının implementasyonu
- [ ] Ürün detayında büyük alerjen uyarı banner'ı
- [ ] Skor rozeti + "Neden bu skor?" açılır detay
- [ ] Katkı maddesi kartları (kısa açıklama, hardcoded küçük referans liste)

### Blok 7 — Geçmiş, Favoriler, Manuel Ekleme (≈1.5 saat)
- [ ] Tarama geçmişi: her taramada localStorage'a ekleme, geçmiş ekranı (offline çalışır, ekstra iş yok)
- [ ] Favoriler: toggle + liste ekranı (localStorage)
- [ ] Manuel ürün ekleme formu → `manual_submissions` tablosuna insert

### Blok 8 — Web Cilalama ve Prod Deploy (≈1 saat)
- [ ] Mobil tarayıcı / responsive kontrolü (gerçek kullanım senaryosu telefon tarayıcısı + sonra Capacitor)
- [ ] Boş/hata durumları taraması
- [ ] Vercel production deploy, env secrets kontrolü

### Blok 9 — Capacitor ile Android'e Sarma (≈1.5-2 saat)
- [ ] `@capacitor/core` + `@capacitor/android` kurulumu, `npx cap init`, `npx cap add android`
- [ ] Kamera izni Android manifest'e ekleme (`android.permission.CAMERA`)
- [ ] App ikonu + splash screen
- [ ] `npx cap sync` + Android Studio/Gradle ile lokal build, emülatör veya gerçek cihazda barkod tarama testi (WebView'da kamera erişimi kritik test noktası)

### Blok 10 — Teslimat Paketinin Hazırlanması (Play Console'a biz girmiyoruz)
- [ ] Keystore oluşturma, imzalı **AAB** (ve ayrıca test için kolay kurulan bir **APK**) build alma
- [ ] Gizlilik politikası sayfası (Vercel'de statik `/privacy` route — kamera izni ve veri kullanımı açıklaması; Play Console başvurusunda zorunlu, teslim alan taraf kullanacak)
- [ ] Store görselleri: ikon, öne çıkan görsel, ekran görüntüleri, kısa/uzun açıklama metni taslağı (teslim alan taraf direkt yapıştırıp kullanabilsin diye)
- [ ] Keystore dosyası + şifresi + paket adı (applicationId) bilgilerinin güvenli şekilde teslimat paketine eklenmesi
- [ ] Kısa bir "nasıl yayınlanır" talimatı (README_YAYIN.md): AAB'yi Play Console'a yükleme adımları, closed testing/12 tester-14 gün kuralının kendi hesaplarında geçerli olabileceği notu
- [ ] Son teslimat: kaynak kod (repo) + canlı Vercel linki + imzalı AAB/APK + keystore + yayın talimatı

**Gün 2 sonu çıktı:** Teslim edilmeye hazır tam paket — web app canlı, Android build imzalı ve test edilmiş, yayınlama Play Console adımı teslim alan tarafa bırakılmış.

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
- [ ] Native barkod plugin'ine geçiş (`@capacitor-mlkit/barcode-scanning`) — eğer WebView kamera performansı/izinleri sorun çıkarırsa

---

## 📌 Takip Notları
- Bu plan PM'in "1-2 gün, web app + Vercel + Supabase + Capacitor" talimatı üzerine v1'den güncellendi (önceki React Native/Expo + monorepo yaklaşımı terk edildi).
- Uygulama biz tarafımızdan yayınlanmayacak, **teslim edilecek** — Play Console / 12 tester-14 gün konusu teslim alan tarafın sorumluluğu, bizim sprint'imizi bloklamıyor.
- Bir yerde tıkanırsak (CORS, Capacitor kamera izni, keystore vb.) hemen burada işaretleyip soracağız, sprint'i durdurmayacağız.
- Şu an sıradaki adım: **Gün 1 / Blok 1 — Kurulum**.
- Açık/varsayılan karar: v1'de Supabase Auth **yok**, hassasiyet/geçmiş/favori localStorage'da tutulacak (hız için varsayılan, itiraz olursa değişir).
