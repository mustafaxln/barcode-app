import { useCallback, useState } from 'react';
import type { FavoriteEntry } from '../lib/favorites';
import { loadFavorites, toggleFavoriteEntry } from '../lib/favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>(loadFavorites);

  const toggle = useCallback((entry: Omit<FavoriteEntry, 'addedAt'>) => {
    setFavorites(toggleFavoriteEntry(entry));
  }, []);

  const isFavorite = useCallback(
    (barcode: string) => favorites.some((fav) => fav.barcode === barcode),
    [favorites]
  );

  return { favorites, toggle, isFavorite };
}
