import { Link } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';

export function FavoritesPage() {
  const { favorites, toggle } = useFavorites();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-700">Favoriler</h1>

      {favorites.length === 0 ? (
        <p className="mt-8 text-center text-sm text-neutral-400">
          Henüz favori ürününüz yok. Ürün detay ekranındaki "Favorilere Ekle" butonuyla
          ekleyebilirsiniz.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {favorites.map((entry) => (
            <li
              key={entry.barcode}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3"
            >
              <Link to={`/urun/${entry.barcode}`} className="flex flex-1 items-center gap-3">
                {entry.imageUrl ? (
                  <img src={entry.imageUrl} alt={entry.name} className="h-12 w-12 rounded-lg object-contain" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-neutral-100" />
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-neutral-800">{entry.name}</p>
                  {entry.brand && <p className="text-xs text-neutral-400">{entry.brand}</p>}
                </div>
              </Link>
              <button
                type="button"
                onClick={() => toggle(entry)}
                className="text-xs font-medium text-neutral-400 hover:text-danger-500"
              >
                Kaldır
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
