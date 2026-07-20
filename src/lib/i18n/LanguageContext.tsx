import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { translations, type Language } from './translations';

const STORAGE_KEY = 'language.v1';

function detectDefaultLanguage(): Language {
  if (typeof window === 'undefined') return 'tr';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'tr' || stored === 'en') return stored;
  } catch {
    // localStorage kapalıysa navigator diline göre devam ediyoruz.
  }
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'tr';
}

type TranslateParams = Record<string, string | number>;
export type TranslateFn = (key: string, params?: TranslateParams) => string;

function resolvePath(dict: unknown, path: string[]): unknown {
  return path.reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    key in params ? String(params[key]) : `{{${key}}}`
  );
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TranslateFn;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectDefaultLanguage);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch (err) {
      console.warn('[i18n] Dil tercihi localStorage’a yazılamadı:', err);
    }
  }, []);

  const t = useCallback<TranslateFn>(
    (key, params) => {
      const path = key.split('.');
      const value = resolvePath(translations[language], path) ?? resolvePath(translations.tr, path);
      if (typeof value !== 'string') {
        console.warn(`[i18n] Çeviri bulunamadı: "${key}"`);
        return key;
      }
      return interpolate(value, params);
    },
    [language]
  );

  const value = useMemo<LanguageContextValue>(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage, LanguageProvider içinde kullanılmalı.');
  }
  return ctx;
}
