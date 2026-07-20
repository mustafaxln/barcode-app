import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// ErrorBoundary uygulama ağacının en tepesinde, LanguageProvider'ın DIŞINDA yer alıyor
// (render sırasında oluşan bir hata Provider'ın kendisinden de kaynaklanabilir). Bu yüzden
// useLanguage/context'e güvenmiyor; localStorage'daki dil tercihini kendi başına, minimal
// bir sözlükle okuyor.
const FALLBACK_TEXT = {
  tr: {
    title: 'Bir şeyler ters gitti',
    body: 'Uygulama beklenmeyen bir hatayla karşılaştı. Sayfayı yeniden yüklemeyi deneyin.',
    reload: 'Ana Sayfaya Dön',
  },
  en: {
    title: 'Something went wrong',
    body: 'The app encountered an unexpected error. Try reloading the page.',
    reload: 'Back to Home',
  },
};

function getFallbackLanguage(): 'tr' | 'en' {
  try {
    const stored = window.localStorage.getItem('language.v1');
    if (stored === 'en') return 'en';
  } catch {
    // localStorage erişilemiyorsa varsayılana düşüyoruz.
  }
  return 'tr';
}

/**
 * Beklenmeyen bir render hatası olduğunda React ağacı tamamen boşalıp beyaz ekran kalır.
 * Bu bileşen o durumu yakalayıp kullanıcıya anlamlı bir mesaj + "Yeniden Dene" seçeneği sunar.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Beklenmeyen hata:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const text = FALLBACK_TEXT[getFallbackLanguage()];
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-xl font-bold text-danger-500">{text.title}</h1>
          <p className="max-w-sm text-sm text-neutral-500">{text.body}</p>
          <p className="max-w-sm font-mono text-xs text-neutral-400">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {text.reload}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
