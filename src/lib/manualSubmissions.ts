import { supabase } from './supabaseClient';
import type { NutritionInfo } from './types';

export interface ManualSubmissionInput {
  barcode: string;
  name: string;
  brand?: string;
  ingredientsText?: string;
  nutrition?: NutritionInfo;
  imageUrl?: string;
}

export async function submitManualProduct(
  input: ManualSubmissionInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('manual_submissions').insert({
      barcode: input.barcode,
      name: input.name,
      brand: input.brand || null,
      ingredients_text: input.ingredientsText || null,
      nutrition_json: input.nutrition ?? null,
      image_url: input.imageUrl || null,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.',
    };
  }
}
