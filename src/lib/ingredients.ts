/**
 * Bazı katkıda bulunanlar OFF'a sadece içindekiler listesini değil, ambalajın üzerindeki TÜM
 * metni (üretici bilgisi, barkod, son kullanma tarihi, saklama koşulları, enerji tablosu başlığı
 * vb.) kopyalayıp yapıştırıyor. Bu fonksiyon "İçindekiler:" gibi bir işaretten sonrasını alıp,
 * bilinen "ilgisiz metin" başlangıçlarından (üretici, tavsiye edilen tüketim tarihi, net miktar,
 * enerji ve besin öğeleri vb.) önce kesiyor. Amaç mükemmel değil, "kabaca doğru" bir sonuç.
 */
// Not: Türkçe'de büyük noktalı "İ" harfi, JS regex'in varsayılan case-insensitive eşleştirmesinde
// düz "i" ile eşleşmez ("Turkish-I" problemi). Bu yüzden ilgili kelimenin ilk harfi için [İIıi]
// karakter sınıfını açıkça belirtiyoruz.
//
// Bazı çok-pazarlı ürünlerde (örn. birden fazla ülkeye giden ambalajlar) OFF'a TEK metin
// alanında art arda birden fazla dilin içindekiler bölümü eklenmiş oluyor ("Ingredients: ...
// Ingrédients: ... Ingredientes: ..."). Bu yüzden sadece İLK işareti değil, tüm işaretleri
// buluyoruz: ilk işaretten ikinci işarete kadarki kısmı alıyoruz (yani sadece ilk dili).
const LABEL_HEADER_PATTERN =
  /([İIıi][cç]indekiler|ingredients|ingr[ée]dients|ingredientes|ingredienti|zutaten|p[eë]rb[eë]r[eë]sit)\s*[:：]/gi;

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

/** Kaba bir "bu parça gerçek bir madde listesine benziyor mu" kontrolü (virgül yoğunluğuna bakarak). */
function looksLikeIngredientsList(segment: string): boolean {
  const commaCount = (segment.match(/,/g) ?? []).length;
  return commaCount >= 2 && segment.trim().length >= 15;
}

export function extractIngredientsSection(rawText: string): string {
  const matches = [...rawText.matchAll(LABEL_HEADER_PATTERN)];

  let text = rawText;
  if (matches.length > 0) {
    const first = matches[0];
    const beforeFirst = rawText.slice(0, first.index ?? 0);

    if (looksLikeIngredientsList(beforeFirst)) {
      // Metin zaten bir başlık olmadan doğrudan madde listesiyle başlıyor; bulunan işaret
      // aslında SONRAKİ bir dilin başlığı. O yüzden işaretten ÖNCEKİ kısmı (gerçek listeyi) alıyoruz.
      text = beforeFirst;
    } else {
      const start = (first.index ?? 0) + first[0].length;
      const end = matches.length > 1 ? matches[1].index : rawText.length;
      text = rawText.slice(start, end);
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

  const restored = items.map((item) => item.replaceAll(DECIMAL_PLACEHOLDER, ',')).filter(Boolean);

  // Bazı OFF metinlerinde parantezden ÖNCE de fazladan virgül oluyor ("bitkisel yağlar , (palm,
  // ayçiçek, kanola)"), bu da parantezi ayrı bir "madde" gibi böler. Sadece parantez/köşeli
  // parantez içeriğinden oluşan bir öğeyi, önceki maddenin açıklaması sayıp onunla birleştiriyoruz.
  const merged: string[] = [];
  for (const item of restored) {
    const isParenOnly = /^[([].*[)\]]\.?$/.test(item);
    if (isParenOnly && merged.length > 0) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${item}`;
    } else {
      merged.push(item);
    }
  }

  return merged;
}
