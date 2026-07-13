# Manuel Test Checklist

Bu proje sandbox ortamında geliştirildiği için kamera erişimi gibi bazı akışlar gerçek bir
tarayıcıda/cihazda test edilmedi. Yayına almadan önce (veya devraldığınızda) şu adımları
gerçek bir telefon/laptop tarayıcısında bir kez geçin.

## Kurulum
- [ ] `npm install` sonrası `npm run dev` hatasız açılıyor
- [ ] `.env` dosyası dolduruldu, konsolda Supabase uyarısı görünmüyor (veya Supabase olmadan da
      OFF üzerinden ürün akışı çalışıyor)

## Tarama Akışı
- [ ] `/` sayfasında kamera izni isteniyor, izin verince canlı görüntü geliyor
- [ ] Gerçek bir ürün barkodu kameraya gösterildiğinde otomatik yakalanıp `/urun/:barkod`'a
      yönlendiriyor
- [ ] Kamera izni reddedilirse anlamlı bir hata mesajı görünüyor
- [ ] Barkodu elle yazıp "Ara" ile de arama çalışıyor

## Ürün Detayı
- [ ] Bilinen bir barkod (örn. `3017620422003` — Nutella) için ürün adı, marka, görsel,
      içindekiler listesi, besin değerleri tablosu doğru geliyor
- [ ] Bilinmeyen/rastgele bir barkod için "Ürün bulunamadı" ekranı ve "Sen Ekle" linki çalışıyor
- [ ] Favorilere ekle/kaldır butonu çalışıyor ve `/favoriler`'da görünüyor
- [ ] Sayfa yenilendiğinde favoriler kayboluyor mu diye kontrol edin (kaybolmamalı —
      localStorage'da tutuluyor)

## Hassasiyet Profili ve Skor
- [ ] `/profil`'de bir alerjen seçip (örn. Kuruyemiş) Nutella'yı tekrar açtığınızda kırmızı
      "Alerjen Uyarısı" banner'ı ve 0 puan "Uygun Değil" görünüyor
- [ ] Alerjeni kaldırıp tekrar açtığınızda skorun normale döndüğü görülüyor
- [ ] "Neden bu skor?" linkine basınca sebep listesi açılıyor/kapanıyor

## Geçmiş
- [ ] Bir ürün taradıktan sonra `/gecmis`'te göründüğü doğrulanıyor
- [ ] Geçmişten bir ürüne tıklayıp tekrar açmak **yeni bir geçmiş kaydı oluşturmuyor**
- [ ] "Temizle" butonu geçmişi boşaltıyor

## Manuel Ürün Ekleme
- [ ] Bulunamayan bir ürün için formu doldurup gönderince (Supabase kuruluysa) Supabase
      `manual_submissions` tablosunda satır oluştuğu doğrulanıyor

## Genel
- [ ] İlk açılışta "Başlamadan Önce" sorumluluk reddi ekranı çıkıyor, "Anladım" sonrası tekrar
      çıkmıyor
- [ ] `/hakkinda` sayfası açılıyor
- [ ] Küçük ekranda (telefon) alt navigasyon, büyük ekranda (masaüstü) üst navigasyon şeklinde
      düzgün görünüyor
