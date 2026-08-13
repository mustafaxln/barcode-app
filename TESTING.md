# Manuel Test Checklist — BiteCode

Yayın / teslim öncesi gerçek telefonda (veya emülatör + Play dahili test) bir kez geç.

## Kurulum

- [ ] `npm install` sonrası `npm run dev` hatasız
- [ ] `.env` dolu (Supabase); konsolda kritik uyarı yok
- [ ] Android: `npm run cap:sync` veya Play dahili/kapalı test APK’sı kurulu
- [ ] Uygulama adı cihaz menüsünde **BiteCode**

## Tarama

- [ ] Native Android’de ML Kit kamera tarama çalışıyor
- [ ] İzin reddinde anlamlı mesaj + manuel barkod alanı kullanılabiliyor
- [ ] Elle barkod (min. 6 karakter) ile arama çalışıyor
- [ ] Bilinen barkod (örn. `3017620422003` Nutella) ürün sayfasına gidiyor

## Ürün detayı

- [ ] Ad, marka, görsel, içindekiler, besin değerleri geliyor
- [ ] Bilinmeyen barkod → “bulunamadı” + manuel ekle
- [ ] Favori ekle/kaldır; `/favoriler` ve uygulama yeniden açılışında kalıcı
- [ ] Kaynak satırı (Open Food Facts / önbellek) görünüyor

## Hassasiyet / skor

- [ ] Profilde alerjen seç → ilgili üründe uyarı + düşük skor
- [ ] Alerjeni kaldır → skor normale dönüyor
- [ ] “Neden bu skor?” açılıyor

## Geçmiş

- [ ] Tarama sonrası `/gecmis`’te görünüyor
- [ ] Geçmişten tekrar açmak yeni kayıt üretmiyor
- [ ] Temizle çalışıyor

## Manuel ekleme

- [ ] Form gönderimi (Supabase kuruluysa) `manual_submissions` (+ gerekirse `products`) satırı oluşturuyor
- [ ] Aynı barkodu başka oturumda arayınca (verified=false manual) görülebiliyor

## Reklam (yalnızca native Android)

- [ ] Üstte banner alanı (dolum gecikmeli olabilir)
- [ ] 3. ürün detayında interstitial denemesi (test device veya test ID ile doğrula)
- [ ] `VITE_ADMOB_ENABLED=false` iken reklam yok

## Genel

- [ ] İlk açılış disclaimer → Anladım sonrası tekrar çıkmıyor
- [ ] `/hakkinda` açılıyor; tıbbi tavsiye değil uyarısı var
- [ ] TR / EN dil değişimi
- [ ] Alt navigasyon telefon boyutunda düzgün
