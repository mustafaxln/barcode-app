import { useState, type ReactNode } from 'react';

const STORAGE_KEY = 'disclaimer-accepted.v1';

function hasAccepted(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return true;
  }
}

export function DisclaimerGate({ children }: { children: ReactNode }) {
  const [accepted, setAccepted] = useState(hasAccepted);

  if (accepted) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <h2 className="text-lg font-bold text-neutral-900">Başlamadan Önce</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500">
          Bu uygulama, taradığınız ürünlerin içeriğini Open Food Facts açık veritabanından ve
          kullanıcı katkılarından alır. Gösterilen alerjen uyarıları, katkı maddesi açıklamaları ve
          uygunluk skoru <strong>tıbbi veya beslenme tavsiyesi değildir</strong>, sadece
          bilgilendirme amaçlıdır. Gerçek kullanımda ürün etiketini ve uzman görüşünü esas alın.
        </p>
        <button
          type="button"
          onClick={() => {
            try {
              window.localStorage.setItem(STORAGE_KEY, '1');
            } catch {
              // localStorage kapalıysa da devam etmesine izin veriyoruz.
            }
            setAccepted(true);
          }}
          className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Anladım, Devam Et
        </button>
      </div>
    </div>
  );
}
