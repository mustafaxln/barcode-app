import { supabase } from './supabaseClient';
import { fetchProductFromOpenFoodFacts } from './openFoodFacts';
import type { NutritionInfo, Product, ProductSource } from './types';

interface ProductRow {
  barcode: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  ingredients_text: string | null;
  nutrition_json: NutritionInfo | null;
  additives_tags: string[] | null;
  allergens_tags: string[] | null;
  category: string | null;
  source: ProductSource;
  verified: boolean;
}

function rowToProduct(row: ProductRow): Product {
  return {
    barcode: row.barcode,
    name: row.name,
    brand: row.brand ?? undefined,
    imageUrl: row.image_url ?? undefined,
    ingredientsText: row.ingredients_text ?? undefined,
    nutrition: row.nutrition_json ?? undefined,
    additivesTags: row.additives_tags ?? [],
    allergensTags: row.allergens_tags ?? [],
    category: row.category ?? undefined,
    source: row.source,
    verified: row.verified,
  };
}

function productToRow(product: Product): ProductRow {
  return {
    barcode: product.barcode,
    name: product.name,
    brand: product.brand ?? null,
    image_url: product.imageUrl ?? null,
    ingredients_text: product.ingredientsText ?? null,
    nutrition_json: product.nutrition ?? null,
    additives_tags: product.additivesTags,
    allergens_tags: product.allergensTags,
    category: product.category ?? null,
    source: product.source,
    verified: product.verified,
  };
}

async function getCachedProduct(barcode: string): Promise<Product | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle();

    if (error) {
      console.warn('[products] Supabase cache okunamadı, OFF ile devam ediliyor:', error.message);
      return null;
    }
    return data ? rowToProduct(data as ProductRow) : null;
  } catch (err) {
    console.warn('[products] Supabase erişilemiyor (env ayarlı mı?), OFF ile devam ediliyor:', err);
    return null;
  }
}

async function cacheProduct(product: Product): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('products').upsert(productToRow(product));
    if (error) {
      console.warn('[products] Ürün Supabase cache yazımı başarısız:', error.message);
    }
  } catch (err) {
    console.warn('[products] Supabase erişilemiyor, cache atlanıyor:', err);
  }
}

export type ProductResolution =
  | { status: 'found'; product: Product; source: 'cache' | 'off' }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

/**
 * Barkoda göre ürünü bulur: önce Supabase cache, sonra Open Food Facts.
 * OFF'tan bulunan ürünü tekrar sorgulanmasın diye cache'e yazar.
 */
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
