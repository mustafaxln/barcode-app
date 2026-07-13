export type ProductSource = 'off' | 'manual';

export interface NutritionInfo {
  energyKcal?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrates?: number;
  sugars?: number;
  fiber?: number;
  proteins?: number;
  salt?: number;
}

export interface Product {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  ingredientsText?: string;
  nutrition?: NutritionInfo;
  additivesTags: string[];
  allergensTags: string[];
  category?: string;
  source: ProductSource;
  verified: boolean;
}
