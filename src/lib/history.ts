import type { NutritionInfo, Product } from './types';
import type { ScoreLabel } from './scoring';
import type { UserSensitivities } from './sensitivities';
import { calculateSuitabilityScore } from './scoring';

/**
 * Skor hesabı için gereken ürün alanlarının tarama anındaki kopyası.
 * Profil (alerjen/diyet) değişince History listesindeki puanı ağ isteği olmadan
 * yeniden hesaplayabilmek için tutulur.
 */
export interface HistoryScoringSnapshot {
  allergensTags: string[];
  additivesTags: string[];
  ingredientsText?: string;
  nutrition?: NutritionInfo;
}

export interface HistoryEntry {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  /** Tarama anındaki skor — scoring snapshot yoksa geriye dönük fallback. */
  score: number;
  label: ScoreLabel;
  scannedAt: string;
  scoring?: HistoryScoringSnapshot;
}

const STORAGE_KEY = 'scan-history.v1';
const MAX_ENTRIES = 100;

/** En yeni kayıtlar başta; aynı barkoddan yalnızca ilk (en güncel) satır kalır. */
function dedupeByBarcode(entries: HistoryEntry[]): HistoryEntry[] {
  const seen = new Set<string>();
  const result: HistoryEntry[] = [];
  for (const entry of entries) {
    if (seen.has(entry.barcode)) continue;
    seen.add(entry.barcode);
    result.push(entry);
  }
  return result;
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const entries = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    const deduped = dedupeByBarcode(entries);
    // Eski çift kayıtlar varsa bir kerelik temizleyip kaydet.
    if (deduped.length !== entries.length) persist(deduped);
    return deduped;
  } catch (err) {
    console.warn('[history] localStorage okunamadı:', err);
    return [];
  }
}

function persist(entries: HistoryEntry[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('[history] localStorage yazılamadı:', err);
  }
}

/**
 * Aynı barkodu yeniden eklerken eski kaydı kaldırıp en üste taşır.
 * Böylece: (1) React StrictMode'un çift effect'i, (2) tarama → eksik bilgiyi tamamla →
 * geri dön / tekrar aç akışı, (3) aynı ürünü yeniden arama — aynı ürünü iki satır göstermez.
 */
export function addHistoryEntry(entry: HistoryEntry): HistoryEntry[] {
  const existing = loadHistory();
  const withoutSame = existing.filter((e) => e.barcode !== entry.barcode);
  const next = [entry, ...withoutSame].slice(0, MAX_ENTRIES);
  persist(next);
  return next;
}

/**
 * Aynı barkodlu geçmiş kayıtlarının skorunu (ve varsa scoring snapshot'ını) günceller.
 * Profil değiştikten sonra ürün açıldığında veya History'de canlı hesap sonrası kullanılır.
 */
/** Değişiklik yoksa `null` döner — çağıran taraf gereksiz setState yapmasın diye. */
export function updateHistoryScores(
  barcode: string,
  update: { score: number; label: ScoreLabel; scoring?: HistoryScoringSnapshot }
): HistoryEntry[] | null {
  const existing = loadHistory();
  let changed = false;
  const next = existing.map((entry) => {
    if (entry.barcode !== barcode) return entry;

    const scoreSame = entry.score === update.score && entry.label === update.label;
    // scoring sadece yoksa eklenir veya içerik gerçekten değiştiyse güncellenir —
    // her çağrıda yeni obje referansı sonsuz render döngüsü yaratmasın diye.
    const shouldWriteScoring =
      Boolean(update.scoring) &&
      (!entry.scoring || JSON.stringify(entry.scoring) !== JSON.stringify(update.scoring));

    if (scoreSame && !shouldWriteScoring) return entry;

    changed = true;
    return {
      ...entry,
      score: update.score,
      label: update.label,
      scoring: shouldWriteScoring ? update.scoring : entry.scoring,
    };
  });
  if (!changed) return null;
  persist(next);
  return next;
}

/**
 * Snapshot'ı olan tüm geçmiş kayıtlarının skorunu mevcut hassasiyet profiline göre
 * tek seferde yeniden hesaplar. Değişiklik yoksa aynı dizi referansını döner.
 */
/** Değişiklik yoksa `null` döner. */
export function recalculateHistoryScores(sensitivities: UserSensitivities): HistoryEntry[] | null {
  const existing = loadHistory();
  let changed = false;
  const next = existing.map((entry) => {
    if (!entry.scoring) return entry;
    const product: Product = {
      barcode: entry.barcode,
      name: entry.name,
      brand: entry.brand,
      imageUrl: entry.imageUrl,
      ingredientsText: entry.scoring.ingredientsText,
      nutrition: entry.scoring.nutrition,
      additivesTags: entry.scoring.additivesTags,
      allergensTags: entry.scoring.allergensTags,
      source: 'off',
      verified: true,
    };
    const result = calculateSuitabilityScore(product, sensitivities);
    if (result.score === entry.score && result.label === entry.label) return entry;
    changed = true;
    return { ...entry, score: result.score, label: result.label };
  });
  if (!changed) return null;
  persist(next);
  return next;
}

export function clearHistory(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
