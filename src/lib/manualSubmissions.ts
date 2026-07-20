import { supabase } from './supabaseClient';
import type { NutritionInfo, Product } from './types';

export interface ManualSubmissionInput {
  barcode: string;
  name: string;
  brand?: string;
  ingredientsText?: string;
  nutrition?: NutritionInfo;
  imageUrl?: string;
}

interface ExistingProductRow {
  barcode: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  ingredients_text: string | null;
  nutrition_json: NutritionInfo | null;
  additives_tags: string[] | null;
  allergens_tags: string[] | null;
  category: string | null;
}

/**
 * Open Food Facts'te barkod bulunsa bile içindekiler/besin değerleri sıklıkla boş geliyor
 * (OFF veritabanının kendi veri eksikliği, bizim koddan bağımsız). Bu durumda ürünü "zaten
 * eklenmiş" sayıp kullanıcının eksik bilgiyi tamamlamasını engellemek yanlış olur — sadece
 * hem içindekiler hem besin değeri gerçekten mevcutsa "tamamlanmış" kabul ediyoruz.
 */
function isProductDataComplete(row: ExistingProductRow): boolean {
  const hasIngredients = Boolean(row.ingredients_text && row.ingredients_text.trim().length > 0);
  const hasNutrition = Object.values(row.nutrition_json ?? {}).some(
    (value) => value !== undefined && value !== null
  );
  return hasIngredients && hasNutrition;
}

/**
 * Manuel gönderilen ürünü hem denetim kaydı için `manual_submissions`'a, hem de kullanıcı
 * hemen tekrar aratınca/geçmişinde görsün diye `products`'a (source: 'manual', verified: false)
 * yazar.
 *
 * `products`'ta zaten bir kayıt varsa (örn. OFF'tan gelmiş ama eksik) bunu bir engel olarak
 * görmüyoruz: kullanıcının girdiği alanlarla mevcut satırı **birleştirip** (merge) üzerine
 * yazıyoruz — OFF'un doldurduğu alanlar (görsel, marka vb.) kullanıcı boş bıraktıysa korunur,
 * kullanıcının girdiği alanlar (özellikle içindekiler/besin değeri) üzerine yazılır. Sadece
 * mevcut kayıt zaten eksiksizse (hem içindekiler hem besin değeri dolu) tekrar eklemeyi
 * engelleyip anlamlı bir hata döndürüyoruz.
 */
export type ManualSubmissionErrorKey =
  | 'supabaseNotConfigured'
  | 'alreadyComplete'
  | 'submissionFailed'
  | 'unexpected';

export type ManualSubmissionResult =
  | { success: true }
  | { success: false; errorKey: ManualSubmissionErrorKey };

/** Metne çevrilmiş hata mesajları arayüz katmanında `t(\`manualAdd.errors.${errorKey}\`)` ile üretiliyor. */
export async function submitManualProduct(input: ManualSubmissionInput): Promise<ManualSubmissionResult> {
  if (!supabase) {
    return { success: false, errorKey: 'supabaseNotConfigured' };
  }

  try {
    const { data: existing, error: existingError } = await supabase
      .from('products')
      .select('barcode, name, brand, image_url, ingredients_text, nutrition_json, additives_tags, allergens_tags, category')
      .eq('barcode', input.barcode)
      .maybeSingle();

    if (existingError) {
      console.warn('[manual submissions] Mevcut ürün kontrolü başarısız, devam ediliyor:', existingError.message);
    } else if (existing && isProductDataComplete(existing as ExistingProductRow)) {
      return { success: false, errorKey: 'alreadyComplete' };
    }

    const existingRow = (existing ?? null) as ExistingProductRow | null;

    const { error: submissionError } = await supabase.from('manual_submissions').insert({
      barcode: input.barcode,
      name: input.name,
      brand: input.brand || null,
      ingredients_text: input.ingredientsText || null,
      nutrition_json: input.nutrition ?? null,
      image_url: input.imageUrl || null,
    });

    if (submissionError) {
      console.warn('[manual submissions] Gönderim başarısız:', submissionError.message);
      return { success: false, errorKey: 'submissionFailed' };
    }

    const mergedNutrition: NutritionInfo | undefined =
      input.nutrition || existingRow?.nutrition_json
        ? { ...(existingRow?.nutrition_json ?? {}), ...(input.nutrition ?? {}) }
        : undefined;

    const product: Product = {
      barcode: input.barcode,
      name: input.name || existingRow?.name || input.barcode,
      brand: input.brand || existingRow?.brand || undefined,
      imageUrl: input.imageUrl || existingRow?.image_url || undefined,
      ingredientsText: input.ingredientsText || existingRow?.ingredients_text || undefined,
      nutrition: mergedNutrition,
      additivesTags: existingRow?.additives_tags ?? [],
      allergensTags: existingRow?.allergens_tags ?? [],
      category: existingRow?.category ?? undefined,
      source: 'manual',
      verified: false,
    };

    const { error: productError } = await supabase.from('products').upsert({
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
    });

    if (productError) {
      // Kullanıcının denetim kaydı (manual_submissions) zaten başarıyla oluştu; sadece hemen
      // görünür olma adımı başarısız oldu. Bunu sert bir hata gibi göstermiyoruz, çünkü veri
      // kaybolmadı — moderasyon üzerinden hâlâ eklenebilir.
      console.warn('[manual submissions] products tablosuna anında yazma başarısız:', productError.message);
    }

    return { success: true };
  } catch (err) {
    console.warn('[manual submissions] Beklenmeyen hata:', err);
    return { success: false, errorKey: 'unexpected' };
  }
}
