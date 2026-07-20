import { useCallback, useState } from 'react';
import type { HistoryEntry, HistoryScoringSnapshot } from '../lib/history';
import {
  addHistoryEntry,
  clearHistory,
  loadHistory,
  recalculateHistoryScores,
  updateHistoryScores,
} from '../lib/history';
import type { ScoreLabel } from '../lib/scoring';
import type { UserSensitivities } from '../lib/sensitivities';

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  const addEntry = useCallback((entry: HistoryEntry) => {
    setHistory(addHistoryEntry(entry));
  }, []);

  const updateScores = useCallback(
    (
      barcode: string,
      update: { score: number; label: ScoreLabel; scoring?: HistoryScoringSnapshot }
    ) => {
      const next = updateHistoryScores(barcode, update);
      if (next) setHistory(next);
    },
    []
  );

  const recalculateAll = useCallback((sensitivities: UserSensitivities) => {
    const next = recalculateHistoryScores(sensitivities);
    if (next) setHistory(next);
  }, []);

  const clear = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  return { history, addEntry, updateScores, recalculateAll, clear };
}
