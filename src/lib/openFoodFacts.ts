import type { Product } from './types';
import { extractIngredientsSection } from './ingredients';

const OFF_FIELDS = [
  'code',
  'product_name',
  'brands',
  'image_url',
  'ingredients_text',
  'ingredients_text_en',
  'ingredients',
  'nutriments',
  'additives_tags',
  'allergens_tags',
  'categories',
].join(',');

interface OffNutriments {
  'energy-kcal_100g'?: number;
  fat_100g?: number;
  'saturated-fat_100g'?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  fiber_100g?: number;
  proteins_100g?: number;
  salt_100g?: number;
}

interface OffIngredientNode {
  text?: string;
  id?: string;
}

interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
  ingredients?: OffIngredientNode[];
  nutriments?: OffNutriments;
  additives_tags?: string[];
  allergens_tags?: string[];
  categories?: string;
}

interface OffResponse {
  status: number;
  status_verbose?: string;
  product?: OffProduct;
}

/** OFF etiketleri "en:milk", "tr:sut" gibi dil önekiyle gelir; gösterim/eşleştirme için öneki temizliyoruz. */
function stripLocalePrefix(tag: string): string {
  const colonIndex = tag.indexOf(':');
  return colonIndex === -1 ? tag : tag.slice(colonIndex + 1);
}

/**
 * PM kararı: arayüz TR/EN arasında değişebilir ama ÜRÜN İÇERİĞİ (isim, içindekiler) her zaman
 * İngilizce olmalı — kullanıcının seçtiği arayüz diline bakılmaksızın. Bu yüzden OFF'tan İngilizce
 * çeviriyi (`ingredients_text_en`) önceliklendiriyoruz; sadece o da yoksa OFF'un orijinal dildeki
 * metnine (`ingredients_text`) düşüyoruz (bazı ürünlerde İngilizce çeviri hiç girilmemiş olabilir).
 */
/**
 * Bazı ürünlerde (örn. bazı Heinz Ketçap girişleri) hiçbir dilde düz `ingredients_text` girilmemiş
 * olabilir, ama OFF katkıda bulunanların ayrıştırdığı yapılandırılmış `ingredients` listesi (her
 * maddenin adı) mevcut olabilir. Düz metin hiç yoksa bu listeden son çare bir liste oluşturuyoruz.
 */
function buildIngredientsTextFromStructured(nodes: OffIngredientNode[] | undefined): string | undefined {
  if (!nodes || nodes.length === 0) return undefined;
  const names = nodes.map((node) => node.text?.trim()).filter((text): text is string => Boolean(text));
  return names.length > 0 ? names.join(', ') : undefined;
}

function pickIngredientsText(raw: OffProduct): string | undefined {
  const candidate = raw.ingredients_text_en?.trim() || raw.ingredients_text?.trim();

  if (candidate) {
    // Bazı OFF girişlerinde bu alana ambalajdaki TÜM metin (üretici, SKT, enerji tablosu vb.)
    // kopyalanmış oluyor; alakasız kısımları temizleyip sadece içindekiler bölümünü bırakıyoruz.
    const cleaned = extractIngredientsSection(candidate);
    return cleaned || candidate;
  }

  return buildIngredientsTextFromStructured(raw.ingredients);
}

/**
 * OFF bazen birim dönüşümünden kalan uzun ondalıklar döner (örn. 116.666666666667).
 * Bunları okunabilir hale getiriyoruz: enerji 1 ondalık, diğerleri 2 ondalık.
 */
function roundNutrient(value: number | undefined, decimals: number): number | undefined {
  if (value === undefined || value === null || Number.isNaN(value)) return undefined;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function mapOffProductToProduct(barcode: string, raw: OffProduct): Product {
  const n = raw.nutriments ?? {};
  return {
    barcode,
    name: raw.product_name?.trim() || 'Unknown Product',
    brand: raw.brands?.split(',')[0]?.trim(),
    imageUrl: raw.image_url,
    ingredientsText: pickIngredientsText(raw),
    nutrition: {
      energyKcal: roundNutrient(n['energy-kcal_100g'], 1),
      fat: roundNutrient(n.fat_100g, 2),
      saturatedFat: roundNutrient(n['saturated-fat_100g'], 2),
      carbohydrates: roundNutrient(n.carbohydrates_100g, 2),
      sugars: roundNutrient(n.sugars_100g, 2),
      fiber: roundNutrient(n.fiber_100g, 2),
      proteins: roundNutrient(n.proteins_100g, 2),
      salt: roundNutrient(n.salt_100g, 2),
    },
    additivesTags: (raw.additives_tags ?? []).map(stripLocalePrefix),
    allergensTags: (raw.allergens_tags ?? []).map(stripLocalePrefix),
    category: raw.categories?.split(',')[0]?.trim(),
    source: 'off',
    verified: true,
  };
}

/**
 * Open Food Facts'ten barkod ile ürün çeker.
 * Ürün bulunamazsa (status 0) `null` döner; ağ/format hatalarında Error fırlatır.
 */
export async function fetchProductFromOpenFoodFacts(barcode: string): Promise<Product | null> {
  // `lc=en`: OFF'un yerelleştirme/gösterim dili İngilizce olsun — ürün içeriği (isim, içindekiler)
  // her zaman İngilizce çekilsin diye. Arayüz dili (TR/EN) bundan bağımsız, sadece uygulamanın
  // kendi metinlerini (lib/i18n) etkiler.
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?lc=en&fields=${OFF_FIELDS}`;

  const response = await fetch(url);

  // OFF, bulunamayan bazı barkodlarda HTTP 200 değil 404 dönebiliyor, ama gövdesi yine de
  // geçerli `{ status: 0, status_verbose: "product not found" }` JSON'u içeriyor. Bu yüzden
  // sadece HTTP durum koduna bakıp direkt hata fırlatmıyoruz; önce gövdeyi okumayı deneyip
  // asıl "bulundu mu" kararını `status` alanına göre veriyoruz. Gövde hiç JSON değilse
  // (örn. 500/502 hata sayfası) bu gerçek bir hata sayılır.
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
