import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType, NotFoundException } from '@zxing/library';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { openBarcodeCamera } from '../lib/barcodeCamera';
import {
  isNativeBarcodeScannerAvailable,
  startNativeBarcodeScan,
} from '../lib/nativeBarcodeScanner';

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
  const { t } = useLanguage();
  const useNative = isNativeBarcodeScannerAvailable();

  const [status, setStatus] = useState<ScanStatus>('requesting');
  const [errorMessage, setErrorMessage] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');

  useEffect(() => {
    let cancelled = false;

    setStatus('requesting');

    if (useNative) {
      let stopNative: (() => Promise<void>) | null = null;

      startNativeBarcodeScan({
        onBarcode: (code) => {
          if (cancelled) return;
          void (async () => {
            await stopNative?.();
            stopNative = null;
            navigate(`/urun/${code}`, { state: { fromScan: true } });
          })();
        },
        onError: (message) => {
          if (cancelled) return;
          console.error(message);
          setStatus('error');
          setErrorMessage(t('scan.errorGeneric'));
        },
      })
        .then((stop) => {
          stopNative = stop;
          if (cancelled) {
            void stop();
            return;
          }
          setStatus('scanning');
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          console.error(err);
          setStatus('error');
          const name = err instanceof DOMException ? err.name : '';
          setErrorMessage(
            name === 'NotAllowedError'
              ? t('scan.errorNotAllowed')
              : name === 'NotFoundError'
                ? t('scan.errorNotFound')
                : t('scan.errorGeneric')
          );
        });

      return () => {
        cancelled = true;
        void stopNative?.();
      };
    }

    // Web: getUserMedia + ZXing
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, PRODUCT_BARCODE_FORMATS);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints);
    let activeStream: MediaStream | null = null;

    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].startsWith('MultiFormatReader: non-ReaderException')) {
        return;
      }
      originalWarn(...args);
    };

    async function startWeb() {
      console.log('[scan] getUserMedia isteniyor…');
      const stream = await openBarcodeCamera();
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      activeStream = stream;
      const video = videoRef.current;
      if (video) {
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;
      }

      await reader.decodeFromStream(stream, videoRef.current!, (result, error) => {
        if (cancelled) return;
        if (result) {
          reader.reset();
          navigate(`/urun/${result.getText()}`, { state: { fromScan: true } });
          return;
        }
        if (error && !(error instanceof NotFoundException)) {
          console.error(error);
        }
      });

      if (!cancelled) setStatus('scanning');
    }

    startWeb().catch((err: unknown) => {
      if (cancelled) return;
      console.error(err);
      setStatus('error');
      const name = err instanceof DOMException ? err.name : '';
      setErrorMessage(
        name === 'NotAllowedError'
          ? t('scan.errorNotAllowed')
          : name === 'NotFoundError'
            ? t('scan.errorNotFound')
            : t('scan.errorGeneric')
      );
    });

    return () => {
      cancelled = true;
      activeStream?.getTracks().forEach((track) => track.stop());
      reader.reset();
      console.warn = originalWarn;
    };
  }, [navigate, t, useNative]);

  const handleManualSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = manualBarcode.trim();
    if (trimmed.length >= 6) {
      navigate(`/urun/${trimmed}`, { state: { fromScan: true } });
    }
  };

  return (
    <div className="scan-page flex flex-col items-center gap-6 px-4 pb-6 pt-14">
      <div className="scan-chrome rounded-xl bg-neutral-50/95 px-4 py-2 backdrop-blur-sm">
        <h1 className="text-center text-2xl font-bold text-brand-700">{t('scan.title')}</h1>
        <p className="mt-1 text-center text-sm text-neutral-500">{t('scan.subtitle')}</p>
      </div>

      <div
        className={`native-scan-viewport relative aspect-[4/3] w-full max-w-lg overflow-hidden rounded-2xl ${
          useNative ? 'bg-transparent' : 'bg-black'
        }`}
      >
        {!useNative && (
          <video
            ref={videoRef}
            aria-label={t('scan.cameraAlt')}
            className="h-full w-full object-cover"
            muted
            playsInline
            autoPlay
          />
        )}

        {status === 'scanning' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-28 w-4/5 rounded-lg border-2 border-brand-500/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        )}

        {status === 'requesting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-center text-sm text-white">
            {t('scan.cameraStarting')}
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 p-4 text-center text-sm text-white">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="scan-chrome w-full max-w-lg rounded-xl bg-neutral-50/95 p-3 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2 text-xs text-neutral-400">
          <div className="h-px flex-1 bg-neutral-200" />
          {t('scan.orManualEntry')}
          <div className="h-px flex-1 bg-neutral-200" />
        </div>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            value={manualBarcode}
            onChange={(event) => setManualBarcode(event.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            placeholder={t('scan.placeholder')}
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={manualBarcode.trim().length < 6}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {t('scan.searchButton')}
          </button>
        </form>
      </div>
    </div>
  );
}
