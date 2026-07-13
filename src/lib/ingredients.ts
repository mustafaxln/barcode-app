/**
 * OFF'un ham içindekiler metni "Şeker, Fındık 13%, emülsifiyanlar: lesitin [SOYA], vanilin" gibi
 * gelir. Basit bir virgülle bölme parantez/köşeli parantez içindeki virgülleri de böler,
 * bu yüzden parantez derinliğini takip ederek sadece üst seviyedeki virgüllerden bölüyoruz.
 */
export function parseIngredients(ingredientsText: string | undefined): string[] {
  if (!ingredientsText) return [];

  const items: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of ingredientsText) {
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

  return items.filter(Boolean);
}
