# Barkodlu Ürün İçerik Kontrol App

Barkod taratarak ürün içeriğini, besin değerlerini, alerjenleri ve kişisel uygunluk skorunu gösteren web uygulaması (Capacitor ile Android'e paketlenecek). Yol haritası için `ROADMAP.md` dosyasına bakın.

## Kurulum

```bash
npm install
cp .env.example .env   # Supabase URL/anon key'i doldurun
npm run dev
```

## Ortam Değişkenleri

| Değişken | Açıklama |
|---|---|
| `VITE_SUPABASE_URL` | Supabase projesinin URL'i (Settings > API) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (Settings > API) |

## Supabase Kurulumu

1. [supabase.com](https://supabase.com) üzerinde yeni bir proje oluşturun.
2. SQL Editor'e girip `supabase/migrations/0001_init.sql` içeriğini çalıştırın.
3. Settings > API'den URL ve anon key'i alıp `.env` dosyasına yazın.

## Komutlar

- `npm run dev` — geliştirme sunucusu
- `npm run build` — production build (`dist/`)
- `npm run preview` — build'i lokal önizleme
- `npm run lint` — TypeScript tip kontrolü

## Proje Yapısı

```
src/
├── pages/       Ekranlar (Tara, ÜrünDetay, Geçmiş, Favoriler, Profil, ManuelEkle)
├── components/  Paylaşılan UI bileşenleri
├── lib/         Supabase client, tipler, iş mantığı (skorlama, OFF entegrasyonu)
└── hooks/       Paylaşılan React hook'ları
supabase/
└── migrations/  SQL migration dosyaları
```

Detaylı faz planı ve mimari kararlar için `ROADMAP.md`.
