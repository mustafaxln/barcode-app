import type { ScoreLabel } from './scoring';

export interface HistoryEntry {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  score: number;
  label: ScoreLabel;
  scannedAt: string;
}

const STORAGE_KEY = 'scan-history.v1';
const MAX_ENTRIES = 100;

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch (err) {
    console.warn('[history] localStorage okunamadı:', err);
    return [];
  }
}

export function addHistoryEntry(entry: HistoryEntry): HistoryEntry[] {
  const existing = loadHistory();
  const next = [entry, ...existing].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('[history] localStorage yazılamadı:', err);
  }
  return next;
}

export function clearHistory(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
