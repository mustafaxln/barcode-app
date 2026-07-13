import { useCallback, useEffect, useState } from 'react';
import type { AllergenId, UserSensitivities } from '../lib/sensitivities';
import { loadSensitivities, saveSensitivities } from '../lib/sensitivities';

export function useSensitivities() {
  const [sensitivities, setSensitivities] = useState<UserSensitivities>(loadSensitivities);

  useEffect(() => {
    saveSensitivities(sensitivities);
  }, [sensitivities]);

  const toggleAllergen = useCallback((id: AllergenId) => {
    setSensitivities((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(id)
        ? prev.allergens.filter((a) => a !== id)
        : [...prev.allergens, id],
    }));
  }, []);

  const toggleFlag = useCallback((key: keyof Omit<UserSensitivities, 'allergens'>) => {
    setSensitivities((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return { sensitivities, toggleAllergen, toggleFlag };
}
