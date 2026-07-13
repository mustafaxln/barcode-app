import type { Product } from './types';
import type { AllergenId, UserSensitivities } from './sensitivities';
import { ALLERGEN_OPTIONS } from './sensitivities';
import { getNutrientLevel } from './nutritionThresholds';
import { getAdditiveInfo } from './additives';

export type ScoreLabel = 'uygun' | 'dikkatli-ol' | 'uygun-degil';

export interface ScoreReason {
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface ScoreResult {
  score: number;
  label: ScoreLabel;
  matchedAllergens: AllergenId[];
  reasons: ScoreReason[];
}

export const SCORE_LABEL_META: Record<
  ScoreLabel,
  { text: string; badgeClassName: string; textClassName: string }
> = {
  uygun: { text: 'Uygun', badgeClassName: 'bg-brand-100 text-brand-700', textClassName: 'text-brand-700' },
  'dikkatli-ol': {
    text: 'Dikkatli Ol',
    badgeClassName: 'bg-warn-100 text-warn-500',
    textClassName: 'text-warn-500',
  },
  'uygun-degil': {
    text: 'Uygun Değil',
    badgeClassName: 'bg-danger-100 text-danger-500',
    textClassName: 'text-danger-500',
  },
};

function allergenLabel(id: AllergenId): string {
  return ALLERGEN_OPTIONS.find((option) => option.id === id)?.label ?? id;
}

function textContainsAny(text: string | undefined, keywords: string[]): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  return keywords.find((keyword) => lower.includes(keyword)) ?? null;
}

/**
 * Vegan/vejetaryen ihlalleri OFF'un allergens_tags'inde tam yer almadığı için (örn. bal, jelatin,
 * et), içindekiler metninde basit anahtar kelime taraması da yapıyoruz. Bu bir yaklaşıklamadır,
 * kesin bir sertifikasyon değildir — UI'da bu sınırlılık belirtiliyor.
 */
const VEGAN_CONFLICT_KEYWORDS = ['bal', 'jelatin', 'jambon', 'sucuk', 'salam', 'pastırma'];
const VEGETARIAN_CONFLICT_KEYWORDS = ['jambon', 'sucuk', 'salam', 'pastırma', 'et suyu', 'tavuk', 'balık'];

const NUTRIENT_BASE_PENALTY: Record<'medium' | 'high', number> = { medium: 3, high: 8 };
const NUTRIENT_TRACKED_EXTRA_PENALTY: Record<'medium' | 'high', number> = { medium: 7, high: 17 };

const NUTRIENT_TR_LABEL: Record<'fat' | 'saturatedFat' | 'sugars' | 'salt', string> = {
  fat: 'yağ',
  saturatedFat: 'doymuş yağ',
  sugars: 'şeker',
  salt: 'tuz',
};

export function calculateSuitabilityScore(
  product: Product,
  sensitivities: UserSensitivities
): ScoreResult {
  const matchedAllergens = sensitivities.allergens.filter((id) =>
    product.allergensTags.includes(id)
  );

  // 1) Sert engelleyici: seçili alerjenlerden biri üründe varsa skor otomatik sıfır.
  if (matchedAllergens.length > 0) {
    return {
      score: 0,
      label: 'uygun-degil',
      matchedAllergens,
      reasons: matchedAllergens.map((id) => ({
        severity: 'critical',
        message: `Bu ürün seçtiğiniz "${allergenLabel(id)}" alerjenini içeriyor.`,
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
      reasons.push({
        severity: 'warning',
        message: 'Vegan diyetle uyumsuz olabilir (hayvansal içerik izi tespit edildi).',
      });
    }
  }

  if (sensitivities.vegetarian) {
    const tagConflict = ['fish', 'crustaceans'].find((tag) => product.allergensTags.includes(tag));
    const keywordConflict = textContainsAny(product.ingredientsText, VEGETARIAN_CONFLICT_KEYWORDS);
    if (tagConflict || keywordConflict) {
      score -= 40;
      reasons.push({
        severity: 'warning',
        message: 'Vejetaryen diyetle uyumsuz olabilir (et/balık içerik izi tespit edildi).',
      });
    }
  }

  if (sensitivities.glutenFree && product.allergensTags.includes('gluten')) {
    score -= 40;
    reasons.push({ severity: 'warning', message: 'Gluten içeriyor, glutensiz diyetinizle uyumsuz.' });
  }

  if (sensitivities.lactoseFree && product.allergensTags.includes('milk')) {
    score -= 30;
    reasons.push({
      severity: 'warning',
      message: 'Süt/laktoz içeriyor, laktozsuz diyetinizle uyumsuz olabilir.',
    });
  }

  // 3) Besin değeri puanlaması (FSA trafik ışığı eşiklerine göre)
  const nutrientTrackMap: Record<'fat' | 'saturatedFat' | 'sugars' | 'salt', boolean> = {
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
          message: `${NUTRIENT_TR_LABEL[nutrient]} miktarı 100g'da ${level === 'high' ? 'yüksek' : 'orta'} seviyede${tracked ? ' (takip ettiğiniz bir değer)' : ''}.`,
        });
      }
    }
  });

  // 4) Katkı maddesi puanlaması
  const additiveDetails = product.additivesTags
    .map((tag) => ({ tag, info: getAdditiveInfo(tag) }))
    .filter((entry) => entry.info !== null) as { tag: string; info: NonNullable<ReturnType<typeof getAdditiveInfo>> }[];

  const attentionAdditives = additiveDetails.filter((entry) => entry.info.attention);

  if (product.additivesTags.length > 0) {
    score -= Math.min(10, product.additivesTags.length);
  }
  if (attentionAdditives.length > 0) {
    score -= Math.min(24, attentionAdditives.length * 8);
    attentionAdditives.forEach((entry) => {
      reasons.push({
        severity: 'info',
        message: `${entry.info.name} (${entry.tag.toUpperCase()}) — ${entry.info.description}`,
      });
    });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const label: ScoreLabel = score >= 70 ? 'uygun' : score >= 40 ? 'dikkatli-ol' : 'uygun-degil';

  if (reasons.length === 0) {
    reasons.push({ severity: 'info', message: 'Hassasiyetlerinizle bilinen bir çakışma bulunamadı.' });
  }

  return { score, label, matchedAllergens, reasons };
}
