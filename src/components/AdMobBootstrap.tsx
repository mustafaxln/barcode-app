import { useEffect } from 'react';
import { initializeAdMob, showAppBanner } from '../lib/admob';

/**
 * Native Android'de AdMob'u bir kez başlatır ve üst banner'ı gösterir.
 * Web'de no-op. App ağacının tepesine bir kez konur.
 */
export function AdMobBootstrap() {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await initializeAdMob();
      if (!cancelled) await showAppBanner();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
