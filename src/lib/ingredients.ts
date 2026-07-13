/**
 * Bazı katkıda bulunanlar OFF'a sadece içindekiler listesini değil, ambalajın üzerindeki TÜM
 * metni (üretici bilgisi, barkod, son kullanma tarihi, saklama koşulları, enerji tablosu başlığı
 * vb.) kopyalayıp yapıştırıyor. Bu fonksiyon "İçindekiler:" gibi bir işaretten sonrasını alıp,
 * bilinen "ilgisiz metin" başlangıçlarından (üretici, tavsiye edilen tüketim tarihi, net miktar,
 * enerji ve besin öğeleri vb.) önce kesiyor. Amaç mükemmel değil, "kabaca doğru" bir sonuç.
 */
// Not: Türkçe'de büyük noktalı "İ" harfi, JS regex'in varsayılan case-insensitive eşleştirmesinde
// düz "i" ile eşleşmez ("Turkish-I" problemi). Bu yüzden ilk harf için [İIıi] karakter sınıfını
// açıkça belirtiyoruz.
const INGREDIENTS_START_MARKERS = [/[İIıi][cç]indekiler\s*[:：]/i, /ingredients\s*[:：]/i];

const IRRELEVANT_TAIL_MARKERS = [
  /üretici\s*(firma)?\s*[:：]?/i,
  /tavsiye edilen t[üu]ketim tarihi/i,
  /son kullanma tarihi/i,
  /net (miktar|a[ğg]ırlık)/i,
  /enerji ve besin/i,
  /saklama ko[şs]ullar[ıi]/i,
  /a[çc][ıi]ld[ıi]ktan sonra/i,
  /kullanmadan önce çalkala/i,
  /t[üu]ketici (ileti[şs]im|hizmet)/i,
  /[İIıi][şs]letme kay[ıi]t/i,
  /men[şs]e[i]?\s*[üu]lke/i,
  /www\./i,
];

export function extractIngredientsSection(rawText: string): string {
  let text = rawText;

  for (const marker of INGREDIENTS_START_MARKERS) {
    const match = text.match(marker);
    if (match && match.index !== undefined) {
      text = text.slice(match.index + match[0].length);
      break;
    }
  }

  let cutAt = text.length;
  for (const marker of IRRELEVANT_TAIL_MARKERS) {
    const match = text.match(marker);
    if (match && match.index !== undefined && match.index < cutAt) {
      cutAt = match.index;
    }
  }

  return text.slice(0, cutAt).trim();
}

/**
 * OFF'un ham içindekiler metni "Şeker, Fındık 13%, emülsifiyanlar: lesitin [SOYA], vanilin" gibi
 * gelir. Basit bir virgülle bölme parantez/köşeli parantez içindeki virgülleri de böler,
 * bu yüzden parantez derinliğini takip ederek sadece üst seviyedeki virgüllerden bölüyoruz.
 * Ayrıca Fransızca/Almanca gibi dillerde ondalık ayracı virgül olduğundan ("7,4%"), rakamlar
 * arasındaki virgülleri madde ayracı olarak SAYMIYORUZ.
 */
export function parseIngredients(ingredientsText: string | undefined): string[] {
  if (!ingredientsText) return [];

  // Ondalık virgülü ("7,4") geçici olarak koruma altına al, madde ayracı virgülünden ayırt edelim.
  const DECIMAL_PLACEHOLDER = '\u0000';
  const protectedText = ingredientsText.replace(/(\d),(\d)/g, `$1${DECIMAL_PLACEHOLDER}$2`);

  const items: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of protectedText) {
    if (char === '(' || char === '[') depth++;
    if (char === ')' || char === ']') depth = Math.max(0, depth - 1);

    if (char === ',' && depth === 0) {
      items.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) items.push(current.trim());

  return items
    .map((item) => item.replaceAll(DECIMAL_PLACEHOLDER, ','))
    .filter(Boolean);
}
