import { parseIngredients } from '../lib/ingredients';

export function IngredientsList({ ingredientsText }: { ingredientsText?: string }) {
  const items = parseIngredients(ingredientsText);

  if (items.length === 0) {
    return (
      <p className="text-sm text-neutral-400">Bu ürün için içindekiler bilgisi bulunamadı.</p>
    );
  }

  return (
    <ol className="flex flex-col gap-1.5 text-left">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2 text-sm text-neutral-700">
          <span className="text-neutral-400">{index + 1}.</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}
