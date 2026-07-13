import type { Product } from './types';

const OFF_FIELDS = [
  'code',
  'product_name',
  'brands',
  'image_url',
  'ingredients_text',
  'ingredients_text_tr',
  'ingredients_text_en',
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

interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  ingredients_text?: string;
  ingredients_text_tr?: string;
  ingredients_text_en?: string;
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
 * OFF'ta ürünler çoğunlukla girildiği ülkenin dilinde saklanır (Fransızca, Almanca vb.) ve
 * `ingredients_text` alanı bu orijinal dili döndürür. Türkçe çevirisi (`ingredients_text_tr`)
 * genelde yoktur; bu durumda İngilizce çeviri, orijinal dilden çok daha anlaşılır bir fallback'tir.
 */
function pickIngredientsText(raw: OffProduct): string | undefined {
  return raw.ingredients_text_tr?.trim() || raw.ingredients_text_en?.trim() || raw.ingredients_text?.trim();
}

function mapOffProductToProduct(barcode: string, raw: OffProduct): Product {
  const n = raw.nutriments ?? {};
  return {
    barcode,
    name: raw.product_name?.trim() || 'Bilinmeyen Ürün',
    brand: raw.brands?.split(',')[0]?.trim(),
    imageUrl: raw.image_url,
    ingredientsText: pickIngredientsText(raw),
    nutrition: {
      energyKcal: n['energy-kcal_100g'],
      fat: n.fat_100g,
      saturatedFat: n['saturated-fat_100g'],
      carbohydrates: n.carbohydrates_100g,
      sugars: n.sugars_100g,
      fiber: n.fiber_100g,
      proteins: n.proteins_100g,
      salt: n.salt_100g,
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
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?lc=tr&fields=${OFF_FIELDS}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open Food Facts isteği başarısız: HTTP ${response.status}`);
  }

  const data = (await response.json()) as OffResponse;
  if (data.status !== 1 || !data.product) {
    return null;
  }

  return mapOffProductToProduct(barcode, data.product);
}
