import { useCallback, useState } from 'react';
import type { HistoryEntry } from '../lib/history';
import { addHistoryEntry, clearHistory, loadHistory } from '../lib/history';

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  const addEntry = useCallback((entry: HistoryEntry) => {
    setHistory(addHistoryEntry(entry));
  }, []);

  const clear = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  return { history, addEntry, clear };
}
