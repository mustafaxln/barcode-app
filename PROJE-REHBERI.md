# Proje Rehberi — BiteCode

Bu dosya, projenin **şu ana kadar ne olduğunu, hangi kodun ne işe yaradığını, hangi
dosyayı biz yazdık / hangisi otomatik oluşturuldu ve verinin nereden nereye aktığını**
örneklerle anlatır. Amaç: kod tabanına hiç bakmadan bu dosyayı okuyunca projeyi
anlayabilmeniz.

> Ürün adı: **BiteCode** · paket: `com.barkodkontrol.app` · sürüm: **1.5.4**  
> Güncel durum: `ROADMAP.md` · test: `TESTING.md` · Play: `README_YAYIN.md` · AdMob: `ADMOB.md`  
> Çelişen eski cümle olursa `README.md` / `ROADMAP.md` güncel kabul edilir.

---

## 1) Uygulama tek cümleyle ne yapıyor?

Kullanıcı bir ürünün barkodunu (kamerayla veya elle) girer → uygulama **Open Food
Facts** adlı ücretsiz/açık gıda veritabanından o ürünün bilgisini çeker → içindekiler,
besin değerleri ve katkı maddelerini gösterir → kullanıcının seçtiği alerjen/diyet
hassasiyetlerine göre bir **uygunluk skoru** hesaplar → geçmişe kaydeder.

---

## 2) Teknoloji yığını (stack) ve neden seçildi

| Katman | Teknoloji | Neden |
|---|---|---|
| Arayüz (UI) | React 19 + TypeScript | Bileşen bazlı, tip güvenli |
| Derleme/dev-server | Vite | Çok hızlı, anlık yenileme (HMR) |
| Stil | Tailwind CSS v4 | Class bazlı, hızlı UI geliştirme |
| Sayfa geçişleri | React Router v7 | Tek sayfa uygulaması (SPA) içinde `/urun/:barkod` gibi rotalar |
| Sunucu verisi / cache | TanStack React Query | API çağrılarını cache'leyip yönetiyor |
| Barkod (Android) | `@capacitor-mlkit/barcode-scanning` | Native kamera tarama |
| Barkod (web yedek) | `@zxing/library` | Tarayıcı / fallback |
| Ürün verisi | Open Food Facts (dış API) | Ücretsiz, herkese açık, milyonlarca ürün |
| Veritabanı | Supabase (Postgres) | Ürün cache + manuel eklenen ürünler |
| Cihazda veri | `localStorage` | Hassasiyetler, geçmiş, favoriler (hesap yok) |
| Reklam | Google AdMob | Banner + interstitial (yalnızca native) |
| Mobil pakete çevirme | Capacitor 8 | Web → Android APK/AAB |

**Önemli mimari karar:** Ayrı Node/Express backend yok. İstemci doğrudan Open Food Facts
API'sine ve Supabase'e konuşur.

---

## 3) Klasör yapısı — biz mi yazdık, otomatik mi oluştu?

```
barcode-app/
├── src/                      ← BİZİM YAZDIĞIMIZ TÜM UYGULAMA KODU
│   ├── main.tsx              ← Uygulamanın giriş noktası
│   ├── App.tsx               ← Rotalar (hangi URL hangi sayfayı açar)
│   ├── index.css             ← Tailwind + renk teması
│   ├── pages/                ← Her ekran bir dosya (ScanPage, ProductPage, ...)
│   ├── components/           ← Sayfalarda tekrar kullanılan parçalar
│   ├── hooks/                ← React state/veri yönetimi kancaları
│   └── lib/                  ← Saf iş mantığı (API çağrısı, puanlama, localStorage)
│
├── supabase/migrations/      ← BİZİM YAZDIĞIMIZ, Supabase'e atılacak SQL şeması
├── public/icon.svg           ← BİZİM oluşturduğumuz basit uygulama ikonu
├── index.html                ← BİZİM düzenlediğimiz HTML kabuğu (meta etiketler vb.)
│
├── ROADMAP.md, TESTING.md    ← BİZİM yazdığımız plan/test dokümanları
├── .env.example               ← BİZİM yazdığımız örnek ortam değişkeni dosyası
│
├── package.json               ← BİZİM düzenlediğimiz (bağımlılık listesi + script'ler)
├── vite.config.ts              ← BİZİM düzenlediğimiz (Vite ayarları)
├── tsconfig*.json               ← BİZİM düzenlediğimiz (TypeScript ayarları)
├── capacitor.config.json        ← BİZİM oluşturduğumuz (uygulama adı/paket id)
│
├── android/                    ← OTOMATİK OLUŞTU (npx cap add android komutuyla)
│   └── app/src/main/AndroidManifest.xml
│                                ← Otomatik oluştu, İÇİNE kamera izni satırını
│                                  BİZ elle ekledik (aşağıda 8. bölümde anlatılıyor)
│
├── node_modules/                ← OTOMATİK OLUŞTU (npm install), git'e girmiyor
├── dist/                        ← OTOMATİK OLUŞTU (npm run build çıktısı), git'e girmiyor
└── package-lock.json            ← OTOMATİK OLUŞTU (npm'in kilitlediği tam sürüm listesi)
```

**Kısaca:** `src/`, `supabase/`, kök dizindeki `.md`/config dosyaları → biz elle
yazdık. `android/`, `node_modules/`, `dist/`, `package-lock.json` → araçlar
(Capacitor CLI, npm, Vite) tarafından otomatik üretildi.

---

## 4) Uçtan uca veri akışı (bir barkod okutulduğunda ne oluyor?)

```
1. Kullanıcı kamerayı barkoda tutar
        │  (src/pages/ScanPage.tsx)
        ▼
2. @zxing/library barkodu okur → sayıya çevirir (örn. "8696362804718")
        │
        ▼
3. React Router ile /urun/8696362804718 adresine yönlendirilir
        │  (navigate() çağrısı, ScanPage.tsx içinde)
        ▼
4. ProductPage açılır, useProduct(barcode) hook'u devreye girer
        │  (src/hooks/useProduct.ts → src/lib/productRepository.ts)
        ▼
5. Önce Supabase cache'e bakılır (henüz bağlı değil, bu adım şu an hep boş dönüyor)
        │
        ▼
6. Supabase'de yoksa Open Food Facts API'sine HTTP isteği atılır
        │  (src/lib/openFoodFacts.ts → fetchProductFromOpenFoodFacts())
        ▼
7. Gelen ham JSON, bizim Product tipimize çevrilir + içindekiler metni temizlenir
        │  (openFoodFacts.ts içindeki mapOffProductToProduct + pickIngredientsText)
        ▼
8. Ürün bulunduysa arka planda Supabase'e cache olarak yazılır (bağlıysa)
        │
        ▼
9. calculateSuitabilityScore() kullanıcının hassasiyetlerine göre puan hesaplar
        │  (src/lib/scoring.ts)
        ▼
10. Ekranda gösterilir: isim, resim, içindekiler, besin değerleri, katkı maddeleri,
    alerjen uyarısı, uygunluk skoru
        │
        ▼
11. Tarama otomatik olarak "Geçmiş"e kaydedilir (localStorage)
```

---

## 5) Sayfalar (`src/pages/`) — her ekran ne gösteriyor, hangi dosyada

| Rota | Dosya | Ne yapıyor |
|---|---|---|
| `/` | `ScanPage.tsx` | Kamera açar, barkod okur; elle barkod girişi de var |
| `/urun/:barcode` | `ProductPage.tsx` | Ürün detayını (içindekiler, besin, skor) gösterir |
| `/gecmis` | `HistoryPage.tsx` | Daha önce taranan ürünlerin listesi (localStorage) |
| `/favoriler` | `FavoritesPage.tsx` | Favoriye eklenen ürünler (localStorage) |
| `/profil` | `ProfilePage.tsx` | Alerjen/diyet hassasiyetlerini seçme ekranı |
| `/urun-ekle/:barcode` | `ManualAddPage.tsx` | OFF'ta bulunamayan ürünü elle ekleme formu |
| `/hakkinda` | `AboutPage.tsx` | Veri kaynağı, gizlilik, sorumluluk reddi metni |

### Örnek: `ScanPage.tsx` — kamera/barkod okuma tam olarak burada

```15:16:src/pages/ScanPage.tsx
export function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
```

Kamera akışı `@zxing/library`'nin `BrowserMultiFormatReader.decodeFromVideoDevice()`
fonksiyonuyla `<video>` etiketine bağlanıyor. Barkod her okunduğunda:

```35:38:src/pages/ScanPage.tsx
        if (result) {
          reader.reset();
          navigate(`/urun/${result.getText()}`, { state: { fromScan: true } });
          return;
        }
```

Manuel giriş formu da aynı dosyanın altında; sadece `navigate()` çağrısı aynı, kamera
yerine input kutusundan geliyor.

---

## 6) API çağrısı **tam olarak** nerede yapılıyor

Tüm Open Food Facts iletişimi **tek bir dosyada**: `src/lib/openFoodFacts.ts`.
Kodun hiçbir başka yerinde `fetch(...)` ile OFF'a gidilmiyor — bu bilinçli bir tercih,
API adresi/parametreleri değişirse tek yerden düzeltilsin diye.

```122:144:src/lib/openFoodFacts.ts
export async function fetchProductFromOpenFoodFacts(barcode: string): Promise<Product | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?lc=tr&fields=${OFF_FIELDS}`;

  const response = await fetch(url);

  // OFF, bulunamayan bazı barkodlarda HTTP 200 değil 404 dönebiliyor, ama gövdesi yine de
  // geçerli JSON içeriyor; bu yüzden önce gövdeyi okuyup asıl kararı `status` alanına göre veriyoruz.
  let data: OffResponse;
  try {
    data = (await response.json()) as OffResponse;
  } catch {
    throw new Error(`Open Food Facts isteği başarısız: HTTP ${response.status}`);
  }

  if (data.status !== 1 || !data.product) {
    return null;
  }

  return mapOffProductToProduct(barcode, data.product);
}
```

Bu fonksiyonu çağıran tek yer: `src/lib/productRepository.ts` içindeki
`resolveProduct()`. O da şunu yapıyor: *"önce cache'e bak, yoksa OFF'a git, bulduysan
cache'e yaz"*.

```92:111:src/lib/productRepository.ts
export async function resolveProduct(barcode: string): Promise<ProductResolution> {
  const cached = await getCachedProduct(barcode);
  if (cached) {
    return { status: 'found', product: cached, source: 'cache' };
  }

  try {
    const offProduct = await fetchProductFromOpenFoodFacts(barcode);
    if (!offProduct) {
      return { status: 'not_found' };
    }
    void cacheProduct(offProduct);
    return { status: 'found', product: offProduct, source: 'off' };
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Ürün verisi alınamadı.',
    };
  }
}
```

Bu fonksiyon, React tarafında `src/hooks/useProduct.ts` içinde React Query'ye
sarılıyor (otomatik cache/loading/error yönetimi için):

```1:11:src/hooks/useProduct.ts
import { useQuery } from '@tanstack/react-query';
import { resolveProduct } from '../lib/productRepository';

export function useProduct(barcode: string | undefined) {
  return useQuery({
    queryKey: ['product', barcode],
    queryFn: () => resolveProduct(barcode!),
    enabled: Boolean(barcode),
    retry: false,
  });
}
```

`ProductPage.tsx` bu hook'u çağırıp `data.status` değerine göre (`found` /
`not_found` / `error`) farklı ekran gösteriyor.

---

## 7) OFF verisinin "temizlenmesi" — neden gerekli, nerede yapılıyor

Open Food Facts kolektif/gönüllü bir veritabanı. Ham veri çoğu zaman düzensiz:
yanlış dilde, ondalık virgülüyle bölünmüş, ya da ambalajın tüm metni tek alana
yapıştırılmış olabiliyor. Bunları düzelten mantık **`src/lib/ingredients.ts`**
dosyasında, iki fonksiyon halinde:

- **`extractIngredientsSection()`** — "İçindekiler:" / "Ingredients:" gibi
  işaretlerden sonrasını alır, üretici bilgisi / SKT / enerji tablosu gibi ilgisiz
  kısımları keser, birden fazla dil art arda eklenmişse sadece ilkini bırakır.
- **`parseIngredients()`** — temizlenmiş metni virgüllerden madde listesine böler;
  ondalık virgülleri ("7,4%") madde ayracıyla karıştırmaz, parantez içindeki
  virgülleri bölmez, parantez-öncesi fazladan virgülleri önceki maddeyle birleştirir.

Hangi dilin kullanılacağına `src/lib/openFoodFacts.ts` içindeki `pickIngredientsText()`
karar veriyor: önce Türkçe çevirisi varsa o, yoksa İngilizce, o da yoksa OFF'un
orijinal (genelde ürünün satıldığı ülkenin dili) metni, o da yoksa OFF'un
yapılandırılmış madde listesi (`ingredients` alanı) son çare olarak kullanılıyor.

```78:90:src/lib/openFoodFacts.ts
function pickIngredientsText(raw: OffProduct): string | undefined {
  const candidate =
    raw.ingredients_text_tr?.trim() || raw.ingredients_text_en?.trim() || raw.ingredients_text?.trim();

  if (candidate) {
    const cleaned = extractIngredientsSection(candidate);
    return cleaned || candidate;
  }

  return buildIngredientsTextFromStructured(raw.ingredients);
}
```

---

## 8) Puanlama (uygunluk skoru) algoritması nerede, nasıl çalışıyor

Tamamı `src/lib/scoring.ts` içinde, `calculateSuitabilityScore(product, sensitivities)`
fonksiyonu. Mantık sırayla:

1. **Sert engel:** Kullanıcının seçtiği bir alerjen üründe varsa → skor direkt **0**,
   "Uygun Değil".
2. **Diyet uyumu:** Vegan/vejetaryen/glutensiz/laktozsuz seçiliyse, OFF'un
   `allergens_tags` etiketleri + içindekiler metninde anahtar kelime taraması
   (bal, jelatin, jambon vb.) ile puan kırılıyor.
3. **Besin değerleri:** Yağ/doymuş yağ/şeker/tuz için İngiliz Gıda Standartları
   Ajansı'nın (FSA) "trafik ışığı" eşikleri kullanılıyor (`src/lib/nutritionThresholds.ts`).
   Kullanıcı bir besin öğesini özellikle takip ediyorsa ("şekeri takip ediyorum")
   ceza daha büyük.
4. **Katkı maddeleri:** `src/lib/additives.ts`'teki referans tablo E-kodlarını
   isim+açıklamaya çeviriyor; "dikkat" işaretli katkılar (örn. bazı boyalar) ekstra
   puan kırıyor.
5. Sonuç 0-100 arası skora, o da üç etikete indiriliyor: `uygun` (≥70) /
   `dikkatli-ol` (40-69) / `uygun-degil` (<40).

Bu sonucu ekranda gösteren bileşen: `src/components/ScoreBadge.tsx` (renkli
rozet + "Neden bu skor?" açılır açıklama).

---

## 9) Arayüz (UI) bileşenleri — nerede hangi parça oluşturuluyor

| Bileşen | Dosya | Nerede kullanılıyor |
|---|---|---|
| Alt navigasyon çubuğu | `components/NavBar.tsx` | `App.tsx`, her sayfada sabit |
| İçindekiler listesi | `components/IngredientsList.tsx` | `ProductPage.tsx` |
| Besin değerleri tablosu | `components/NutritionTable.tsx` | `ProductPage.tsx` |
| Uygunluk skoru rozeti | `components/ScoreBadge.tsx` | `ProductPage.tsx` |
| Alerjen uyarı banner'ı | `components/AllergenWarningBanner.tsx` | `ProductPage.tsx` |
| Katkı maddesi listesi | `components/AdditivesList.tsx` | `ProductPage.tsx` |
| Hassasiyet seçim çipi | `components/ToggleChip.tsx` | `ProfilePage.tsx` |
| İlk açılış sorumluluk reddi | `components/DisclaimerGate.tsx` | `App.tsx` (her şeyi sarıyor) |
| Hata yakalayıcı | `components/ErrorBoundary.tsx` | `main.tsx` (en dışta) |

`App.tsx` içinde tüm sayfalar `React.lazy()` ile **route bazlı code-splitting**
yapılarak yükleniyor — yani kullanıcı sadece o an açtığı sayfanın kodunu indiriyor,
tüm uygulamayı tek seferde değil (performans için).

```1:12:src/App.tsx
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { DisclaimerGate } from './components/DisclaimerGate';

const ScanPage = lazy(() => import('./pages/ScanPage').then((m) => ({ default: m.ScanPage })));
const ProductPage = lazy(() => import('./pages/ProductPage').then((m) => ({ default: m.ProductPage })));
```

---

## 10) Kullanıcı verisi nerede saklanıyor?

v1'de **hesap/giriş sistemi yok**. Her cihaz kendi verisini saklıyor:

| Veri | Nerede | Dosya |
|---|---|---|
| Alerjen/diyet hassasiyetleri | `localStorage` (cihazda) | `lib/sensitivities.ts` |
| Tarama geçmişi | `localStorage` (cihazda) | `lib/history.ts` |
| Favori ürünler | `localStorage` (cihazda) | `lib/favorites.ts` |
| İlk açılış onayı | `localStorage` (cihazda) | `components/DisclaimerGate.tsx` |
| Ürün cache'i (OFF'tan gelen) | Supabase `products` tablosu (henüz bağlı değil) | `lib/productRepository.ts` |
| Manuel eklenen ürünler | Supabase `manual_submissions` tablosu (henüz bağlı değil) | `lib/manualSubmissions.ts` |

Yani **"okutulan her ürünü biz bir merkezi veritabanında toplamıyoruz"** — sadece
performans için cache'liyoruz (Supabase bağlanınca) ve kullanıcıların OFF'ta
bulamadığı ürünleri manuel girdiğinde saklıyoruz.

---

## 11) Mobil (Android) tarafı nasıl çalışıyor

**Capacitor**, mevcut web uygulamasını (React/Vite ile derlenmiş `dist/` klasörü)
bir Android WebView içine sarıyor. Yani Android uygulaması, ayrı bir kod tabanı
değil — aynı `src/` klasöründeki kod, sadece bir native kabuk içinde çalışıyor.

- `capacitor.config.json` → uygulama adı (**BiteCode**), paket id (`com.barkodkontrol.app`),
  hangi klasörün paketleneceği (`dist`).
- AdMob App ID: `android/app/src/main/res/values/strings.xml` → `admob_app_id`
- Native barkod: `@capacitor-mlkit/barcode-scanning` (`src/lib/nativeBarcodeScanner.ts`)
- `android/` klasörü → `npx cap add android` ile oluşturuldu; Manifest’e kamera/internet + AdMob meta eklendi.

```40:41:android/app/src/main/AndroidManifest.xml
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
```

`npm run cap:sync` komutu şunu yapar: önce `npm run build` (React kodunu `dist/`e
derler), sonra `npx cap sync android` (o `dist/` içeriğini Android projesine kopyalar).

---

## 12) Ortam değişkenleri (`.env`) ve Supabase bağlantısı

`src/lib/supabaseClient.ts`, `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY`
tanımlıysa Supabase client'ı oluşturur, tanımlı değilse `supabase` değişkeni `null`
olur ve uygulama Supabase'siz (sadece OFF ile) çalışmaya devam eder:

```typescript
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
```

Şu an `.env` dosyası doldurulmadı, yani Supabase henüz **bağlı değil** — bu yüzden
"ürün bulunamadı → sen ekle" formu şu an veriyi kaydedemiyor (kaydedecek bir yer yok).

---

## 13) Şu ana kadar sırasıyla ne yaptık (Blok bazlı özet)

Detaylı checklist `ROADMAP.md`'de; kısa özet:

1. **Blok 1-2:** Proje iskeleti (Vite+React+TS+Tailwind), Supabase şeması taslağı.
2. **Blok 3:** Barkod tarama ekranı (kamera + manuel giriş).
3. **Blok 4:** Ürün detay ekranı + Open Food Facts entegrasyonu.
4. **Blok 5:** İçindekiler listesi + besin değerleri tablosu (renk kodlu).
5. **Blok 6:** Kullanıcı hassasiyet seçimi (Profil ekranı) + localStorage.
6. **Blok 7:** Uygunluk skoru algoritması + alerjen uyarı banner'ı + katkı maddesi
   açıklamaları.
7. **Blok 8:** Tarama geçmişi, favoriler, code-splitting, ilk açılış sorumluluk reddi,
   Hakkında sayfası, manuel test checklist'i.
8. **Blok 9:** Capacitor kurulumu, Android projesi, kamera izinleri.
9. **Blok 10:** (Şimdilik beklemede — imzalı APK/AAB, mağaza görselleri, gizlilik
   politikası; siz karar verince devam edecek.)
10. **Sonrasında (bu doküman yazılmadan önce):** Gerçek ürünlerle test → OFF veri
    kalitesi sorunları bulundu ve düzeltildi (bkz. 14. bölüm).

---

## 14) Test sürecinde bulup düzelttiğimiz gerçek hatalar

| Sorun | Neden oluyordu | Nerede düzeltildi |
|---|---|---|
| Boş beyaz ekran | Supabase yapılandırılmadan `createClient()` senkron hata fırlatıyordu | `supabaseClient.ts` + `ErrorBoundary.tsx` |
| "7,4%" gibi sayılar ikiye bölünüyordu | Fransızca/Almanca ondalık ayracı virgül, bizim kod her virgülü madde ayracı sayıyordu | `ingredients.ts` → `parseIngredients()` |
| İçindekiler yabancı dilde (Fransızca vb.) | OFF orijinal dili döndürüyor, Türkçe çevirisi genelde yok | `openFoodFacts.ts` → `pickIngredientsText()` (tr→en→orijinal önceliği) |
| İçindekiler "saçma" görünüyordu (Heinz) | OFF'a ambalajın TÜM metni (üretici, SKT, enerji tablosu) tek alanda girilmiş | `ingredients.ts` → `extractIngredientsSection()` |
| Çok dilli ürünlerde 4 dil art arda görünüyordu (Ülker Biskrem) | OFF'ta tek alanda birden fazla dilin içindekiler bölümü art arda | `extractIngredientsSection()` — ikinci dil işaretinden önce kesiyor |
| Bazı ürünlerde barkod okununca "404" hatası | OFF bazı "bulunamadı" barkodlarında HTTP 404 dönüyor ama gövdesi geçerli JSON | `openFoodFacts.ts` — önce gövdeyi okuyup `status` alanına bakıyor |
| "bitkisel yağlar" ve "(palm, ayçiçek, kanola)" ayrı madde gibi görünüyordu | Kaynak metinde parantezden önce fazladan virgül var | `parseIngredients()` — parantez-only öğeleri öncekiyle birleştiriyor |

**Düzeltilemeyen (bizim kod hatası değil, OFF'un veri boşluğu):** Bazı ürünlerde
(örn. Pınar Süt) OFF'ta hiç gerçek içindekiler girilmemiş, sadece pazarlama sloganı
var. Bu durumda gösterecek veri yok — uygulama doğru şekilde "bilgi bulunamadı"
davranışını uyguluyor.

---

## 15) Şu an eksik / sırada ne var

- **Supabase henüz bağlı değil** → cache yok, manuel ürün ekleme kaydedilemiyor.
  Adımlar için önceki sohbette verilen kurulum talimatına bakılabilir (özet: Supabase
  projesi oluştur → `supabase/migrations/0001_init.sql`'i çalıştır → `.env`'e
  URL/anon key'i yapıştır).
- **Blok 10 beklemede:** imzalı Android paketi (keystore + AAB), Play Store
  görselleri, gizlilik politikası metni — siz karar verince başlanacak.
- **Gerçek cihazda kamera testi henüz yapılmadı** (şu ana kadar masaüstü tarayıcıda
  test edildi); Android build alınınca gerçek telefonda da doğrulanmalı.
