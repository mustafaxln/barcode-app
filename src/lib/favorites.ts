export interface FavoriteEntry {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  addedAt: string;
}

const STORAGE_KEY = 'favorites.v1';

export function loadFavorites(): FavoriteEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FavoriteEntry[]) : [];
  } catch (err) {
    console.warn('[favorites] localStorage okunamadı:', err);
    return [];
  }
}

function persist(favorites: FavoriteEntry[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch (err) {
    console.warn('[favorites] localStorage yazılamadı:', err);
  }
}

export function toggleFavoriteEntry(
  entry: Omit<FavoriteEntry, 'addedAt'>
): FavoriteEntry[] {
  const existing = loadFavorites();
  const isFav = existing.some((fav) => fav.barcode === entry.barcode);
  const next = isFav
    ? existing.filter((fav) => fav.barcode !== entry.barcode)
    : [{ ...entry, addedAt: new Date().toISOString() }, ...existing];
  persist(next);
  return next;
}
