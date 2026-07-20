import type { Product } from './types';
import type { AllergenId, UserSensitivities } from './sensitivities';
import { getNutrientLevel } from './nutritionThresholds';
import { isAttentionAdditive } from './additives';

export type ScoreLabel = 'uygun' | 'dikkatli-ol' | 'uygun-degil';

type TrackedNutrient = 'fat' | 'saturatedFat' | 'sugars' | 'salt';

/**
 * Skor sebepleri artık hazır bir metin (`message`) değil, YAPISAL veri taşıyor. Metne çevirme
 * işi arayüz katmanında (ScoreBadge.tsx) `t()` ile yapılıyor — böylece scoring.ts dil bilmeden,
 * saf mantık olarak kalabiliyor.
 */
export type ScoreReason =
  | { severity: 'critical'; type: 'allergenMatch'; allergenId: AllergenId }
  | { severity: 'warning'; type: 'veganConflict' }
  | { severity: 'warning'; type: 'vegetarianConflict' }
  | { severity: 'warning'; type: 'glutenConflict' }
  | { severity: 'warning'; type: 'lactoseConflict' }
  | { severity: 'warning' | 'info'; type: 'nutrientLevel'; nutrient: TrackedNutrient; level: 'medium' | 'high'; tracked: boolean }
  | { severity: 'info'; type: 'additiveNote'; tag: string }
  | { severity: 'info'; type: 'noConflict' };

export interface ScoreResult {
  score: number;
  label: ScoreLabel;
  matchedAllergens: AllergenId[];
  reasons: ScoreReason[];
}

/** Görünen etiket ("Uygun"/"Suitable" vb.) artık `t('score.label.<label>')` üzerinden geliyor. */
export const SCORE_LABEL_META: Record<ScoreLabel, { badgeClassName: string; textClassName: string }> = {
  uygun: { badgeClassName: 'bg-brand-100 text-brand-700', textClassName: 'text-brand-700' },
  'dikkatli-ol': { badgeClassName: 'bg-warn-100 text-warn-500', textClassName: 'text-warn-500' },
  'uygun-degil': { badgeClassName: 'bg-danger-100 text-danger-500', textClassName: 'text-danger-500' },
};

function textContainsAny(text: string | undefined, keywords: string[]): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  return keywords.find((keyword) => lower.includes(keyword)) ?? null;
}

/**
 * Vegan/vejetaryen ihlalleri OFF'un allergens_tags'inde tam yer almadığı için (örn. bal, jelatin,
 * et), içindekiler metninde basit anahtar kelime taraması da yapıyoruz. Bu bir yaklaşıklamadır,
 * kesin bir sertifikasyon değildir — UI'da bu sınırlılık belirtiliyor. Ürün içeriği artık her
 * zaman İngilizce çekildiği için anahtar kelimeler de İngilizce.
 */
const VEGAN_CONFLICT_KEYWORDS = ['honey', 'gelatin', 'gelatine', 'ham', 'bacon', 'salami', 'pepperoni'];
const VEGETARIAN_CONFLICT_KEYWORDS = ['ham', 'bacon', 'salami', 'pepperoni', 'meat stock', 'chicken', 'fish'];

const NUTRIENT_BASE_PENALTY: Record<'medium' | 'high', number> = { medium: 3, high: 8 };
const NUTRIENT_TRACKED_EXTRA_PENALTY: Record<'medium' | 'high', number> = { medium: 7, high: 17 };

export function calculateSuitabilityScore(product: Product, sensitivities: UserSensitivities): ScoreResult {
  const matchedAllergens = sensitivities.allergens.filter((id) => product.allergensTags.includes(id));

  // 1) Sert engelleyici: seçili alerjenlerden biri üründe varsa skor otomatik sıfır.
  if (matchedAllergens.length > 0) {
    return {
      score: 0,
      label: 'uygun-degil',
      matchedAllergens,
      reasons: matchedAllergens.map((id) => ({
        severity: 'critical',
        type: 'allergenMatch',
        allergenId: id,
      })),
    };
  }

  let score = 100;
  const reasons: ScoreReason[] = [];

  // 2) Diyet uyumu (vegan / vejetaryen / glutensiz / laktozsuz)
  if (sensitivities.vegan) {
    const tagConflict = ['milk', 'eggs', 'fish', 'crustaceans'].find((tag) =>
      product.allergensTags.includes(tag)
    );
    const keywordConflict = textContainsAny(product.ingredientsText, VEGAN_CONFLICT_KEYWORDS);
    if (tagConflict || keywordConflict) {
      score -= 40;
      reasons.push({ severity: 'warning', type: 'veganConflict' });
    }
  }

  if (sensitivities.vegetarian) {
    const tagConflict = ['fish', 'crustaceans'].find((tag) => product.allergensTags.includes(tag));
    const keywordConflict = textContainsAny(product.ingredientsText, VEGETARIAN_CONFLICT_KEYWORDS);
    if (tagConflict || keywordConflict) {
      score -= 40;
      reasons.push({ severity: 'warning', type: 'vegetarianConflict' });
    }
  }

  if (sensitivities.glutenFree && product.allergensTags.includes('gluten')) {
    score -= 40;
    reasons.push({ severity: 'warning', type: 'glutenConflict' });
  }

  if (sensitivities.lactoseFree && product.allergensTags.includes('milk')) {
    score -= 30;
    reasons.push({ severity: 'warning', type: 'lactoseConflict' });
  }

  // 3) Besin değeri puanlaması (FSA trafik ışığı eşiklerine göre)
  const nutrientTrackMap: Record<TrackedNutrient, boolean> = {
    fat: sensitivities.trackFat,
    saturatedFat: sensitivities.trackFat,
    sugars: sensitivities.trackSugar,
    salt: sensitivities.trackSalt,
  };

  (['fat', 'saturatedFat', 'sugars', 'salt'] as const).forEach((nutrient) => {
    const level = getNutrientLevel(nutrient, product.nutrition?.[nutrient]);
    if (level === 'medium' || level === 'high') {
      const tracked = nutrientTrackMap[nutrient];
      score -= NUTRIENT_BASE_PENALTY[level] + (tracked ? NUTRIENT_TRACKED_EXTRA_PENALTY[level] : 0);
      if (level === 'high' || tracked) {
        reasons.push({
          severity: level === 'high' ? 'warning' : 'info',
          type: 'nutrientLevel',
          nutrient,
          level,
          tracked,
        });
      }
    }
  });

  // 4) Katkı maddesi puanlaması
  const attentionAdditives = product.additivesTags.filter((tag) => isAttentionAdditive(tag));

  if (product.additivesTags.length > 0) {
    score -= Math.min(10, product.additivesTags.length);
  }
  if (attentionAdditives.length > 0) {
    score -= Math.min(24, attentionAdditives.length * 8);
    attentionAdditives.forEach((tag) => {
      reasons.push({ severity: 'info', type: 'additiveNote', tag });
    });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const label: ScoreLabel = score >= 70 ? 'uygun' : score >= 40 ? 'dikkatli-ol' : 'uygun-degil';

  if (reasons.length === 0) {
    reasons.push({ severity: 'info', type: 'noConflict' });
  }

  return { score, label, matchedAllergens, reasons };
}
