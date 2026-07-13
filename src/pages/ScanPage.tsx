import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType, NotFoundException } from '@zxing/library';

type ScanStatus = 'requesting' | 'scanning' | 'error';

const PRODUCT_BARCODE_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
];

export function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  const [status, setStatus] = useState<ScanStatus>('requesting');
  const [errorMessage, setErrorMessage] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, PRODUCT_BARCODE_FORMATS);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints);
    let cancelled = false;

    setStatus('requesting');
    reader
      .decodeFromVideoDevice(null, videoRef.current!, (result, error) => {
        if (cancelled) return;
        if (result) {
          reader.reset();
          navigate(`/urun/${result.getText()}`, { state: { fromScan: true } });
          return;
        }
        // NotFoundException her karede barkod bulunamayınca fırlatılır, bu normal akış — hata değil.
        if (error && !(error instanceof NotFoundException)) {
          console.error(error);
        }
      })
      .then(() => {
        if (!cancelled) setStatus('scanning');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error(err);
        setStatus('error');
        const name = err instanceof DOMException ? err.name : '';
        setErrorMessage(
          name === 'NotAllowedError'
            ? 'Kamera izni verilmedi. Tarayıcı ayarlarından bu site için kamera erişimine izin verip sayfayı yenileyin.'
            : name === 'NotFoundError'
              ? 'Cihazınızda kullanılabilir bir kamera bulunamadı.'
              : 'Kamera başlatılamadı. Aşağıdan barkodu elle girerek de arayabilirsiniz.'
        );
      });

    return () => {
      cancelled = true;
      reader.reset();
    };
  }, [navigate]);

  const handleManualSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = manualBarcode.trim();
    if (trimmed.length >= 6) {
      navigate(`/urun/${trimmed}`, { state: { fromScan: true } });
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-6">
      <div>
        <h1 className="text-center text-2xl font-bold text-brand-700">Barkod Tara</h1>
        <p className="mt-1 text-center text-sm text-neutral-500">
          Ürünün barkodunu kameraya gösterin.
        </p>
      </div>

      <div className="relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-2xl bg-black">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

        {status === 'scanning' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-4/5 rounded-lg border-2 border-brand-500/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        )}

        {status === 'requesting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-center text-sm text-white">
            Kamera başlatılıyor…
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 p-4 text-center text-sm text-white">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-3 flex items-center gap-2 text-xs text-neutral-400">
          <div className="h-px flex-1 bg-neutral-200" />
          veya barkodu elle girin
          <div className="h-px flex-1 bg-neutral-200" />
        </div>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            value={manualBarcode}
            onChange={(event) => setManualBarcode(event.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            placeholder="Örn. 8690504048577"
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={manualBarcode.trim().length < 6}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            Ara
          </button>
        </form>
      </div>
    </div>
  );
}
