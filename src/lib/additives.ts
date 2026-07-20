import type { TranslateFn } from './i18n/LanguageContext';

export interface AdditiveInfo {
  name: string;
  description: string;
  /** Bilimsel tartışmalı/hassasiyet riski taşıyan, kullanıcıya ayrıca vurgulanması gereken katkı maddesi. */
  attention: boolean;
}

/**
 * Küçük, MVP kapsamlı bir E-kodu referans listesi (en yaygın karşılaşılanlar).
 * Eksiksiz bir katkı maddesi ansiklopedisi değildir — Faz Sonrası Backlog'da genişletilebilir.
 * İsim/açıklama metinleri `lib/i18n/translations.ts` içindeki `additives.<code>` anahtarlarından
 * gelir (TR/EN); burada sadece "dikkat" bayrağı ve bilinen kod listesi tutulur.
 */
const ATTENTION_CODES = new Set([
  'e120',
  'e211',
  'e220',
  'e250',
  'e251',
  'e407',
  'e621',
  'e631',
  'e951',
  'e952',
]);

const KNOWN_CODES = new Set([
  'e100',
  'e120',
  'e160a',
  'e200',
  'e211',
  'e220',
  'e250',
  'e251',
  'e300',
  'e322',
  'e330',
  'e407',
  'e440',
  'e450',
  'e471',
  'e500',
  'e621',
  'e631',
  'e951',
  'e952',
  'e955',
]);

function normalizeCode(tag: string): string | null {
  const normalized = tag.toLowerCase();
  if (KNOWN_CODES.has(normalized)) return normalized;

  // OFF'tan gelen etiketler bazen "e322i" gibi varyant harfi içerir; temel kod üzerinden eşleştiriyoruz.
  const baseCodeMatch = normalized.match(/^(e\d{3,4})/);
  if (baseCodeMatch && KNOWN_CODES.has(baseCodeMatch[1])) {
    return baseCodeMatch[1];
  }
  return null;
}

export function getAdditiveInfo(tag: string, t: TranslateFn): AdditiveInfo | null {
  const code = normalizeCode(tag);
  if (!code) return null;

  return {
    name: t(`additives.${code}.name`),
    description: t(`additives.${code}.description`),
    attention: ATTENTION_CODES.has(code),
  };
}

/** Skor hesaplamasında (scoring.ts) sadece "dikkat" bayrağı gerekiyor, çeviriye ihtiyaç yok. */
export function isAttentionAdditive(tag: string): boolean {
  const code = normalizeCode(tag);
  return Boolean(code && ATTENTION_CODES.has(code));
}

export function isKnownAdditive(tag: string): boolean {
  return normalizeCode(tag) !== null;
}
