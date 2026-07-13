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
