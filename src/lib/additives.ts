export interface AdditiveInfo {
  name: string;
  description: string;
  /** Bilimsel tartışmalı/hassasiyet riski taşıyan, kullanıcıya ayrıca vurgulanması gereken katkı maddesi. */
  attention: boolean;
}

/**
 * Küçük, MVP kapsamlı bir E-kodu referans listesi (en yaygın karşılaşılanlar).
 * Eksiksiz bir katkı maddesi ansiklopedisi değildir — Faz Sonrası Backlog'da genişletilebilir.
 */
export const ADDITIVE_REFERENCE: Record<string, AdditiveInfo> = {
  e100: { name: 'Kurkumin', description: 'Doğal sarı renklendirici (zerdeçal kökenli).', attention: false },
  e120: { name: 'Koşnil (Karmin)', description: 'Böcek kökenli kırmızı renklendirici — vegan değildir.', attention: true },
  e160a: { name: 'Karotenoidler', description: 'Doğal sarı/turuncu renklendirici.', attention: false },
  e200: { name: 'Sorbik Asit', description: 'Koruyucu, genel olarak düşük risk.', attention: false },
  e211: { name: 'Sodyum Benzoat', description: 'Koruyucu; bazı kişilerde hassasiyet bildirilmiştir.', attention: true },
  e220: { name: 'Kükürt Dioksit', description: 'Koruyucu; sülfit hassasiyeti/astımı olanlarda reaksiyona yol açabilir.', attention: true },
  e250: { name: 'Sodyum Nitrit', description: 'Et ürünlerinde koruyucu; yüksek tüketimi tartışmalı.', attention: true },
  e251: { name: 'Sodyum Nitrat', description: 'Koruyucu; yüksek tüketimi tartışmalı.', attention: true },
  e300: { name: 'Askorbik Asit (C Vitamini)', description: 'Antioksidan, düşük risk.', attention: false },
  e322: { name: 'Lesitin', description: 'Emülgatör; genelde soya kökenlidir.', attention: false },
  e330: { name: 'Sitrik Asit', description: 'Asitlik düzenleyici, düşük risk.', attention: false },
  e407: { name: 'Karragenan', description: 'Kıvam arttırıcı; bazı araştırmalarda sindirim sistemi etkisi tartışılmıştır.', attention: true },
  e440: { name: 'Pektin', description: 'Doğal kıvam verici (meyve kökenli).', attention: false },
  e450: { name: 'Difosfatlar', description: 'Kıvam/su tutucu.', attention: false },
  e471: { name: 'Mono- ve Digliseritler', description: 'Emülgatör; bitkisel veya hayvansal kökenli olabilir.', attention: false },
  e500: { name: 'Sodyum Bikarbonat', description: 'Kabartıcı, düşük risk.', attention: false },
  e621: { name: 'Monosodyum Glutamat (MSG)', description: 'Tat arttırıcı; bazı kişilerde hassasiyet bildirilmiştir.', attention: true },
  e631: { name: 'Disodyum İnosinat', description: 'Tat arttırıcı; genelde hayvansal kökenlidir.', attention: true },
  e951: { name: 'Aspartam', description: 'Yapay tatlandırıcı; fenilketonüri (PKU) hastaları için uyarı içerir.', attention: true },
  e952: { name: 'Siklamat', description: 'Yapay tatlandırıcı.', attention: true },
  e955: { name: 'Sükraloz', description: 'Yapay tatlandırıcı.', attention: false },
};

/** OFF'tan gelen etiketler bazen "e322i" gibi varyant harfi içerir; temel kod üzerinden eşleştiriyoruz. */
export function getAdditiveInfo(tag: string): AdditiveInfo | null {
  const normalized = tag.toLowerCase();
  if (ADDITIVE_REFERENCE[normalized]) return ADDITIVE_REFERENCE[normalized];

  const baseCodeMatch = normalized.match(/^(e\d{3,4})/);
  if (baseCodeMatch && ADDITIVE_REFERENCE[baseCodeMatch[1]]) {
    return ADDITIVE_REFERENCE[baseCodeMatch[1]];
  }
  return null;
}
