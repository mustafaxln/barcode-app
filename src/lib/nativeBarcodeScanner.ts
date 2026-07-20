import { Capacitor } from '@capacitor/core';
import {
  BarcodeFormat,
  BarcodeScanner,
  LensFacing,
  Resolution,
} from '@capacitor-mlkit/barcode-scanning';
import type { PluginListenerHandle } from '@capacitor/core';

const PRODUCT_FORMATS = [
  BarcodeFormat.Ean13,
  BarcodeFormat.Ean8,
  BarcodeFormat.UpcA,
  BarcodeFormat.UpcE,
  BarcodeFormat.Code128,
];

export function isNativeBarcodeScannerAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Capacitor WebView getUserMedia çoğu telefonda düşük çözünürlüklü / soft preview verir.
 * ML Kit + CameraX native önizleme, telefon kamerasına yakın netlik sağlar.
 */
export async function startNativeBarcodeScan(options: {
  onBarcode: (value: string) => void;
  onError: (message: string) => void;
}): Promise<() => Promise<void>> {
  document.body.classList.add('barcode-scanner-active');

  const permission = await BarcodeScanner.requestPermissions();
  if (permission.camera !== 'granted' && permission.camera !== 'limited') {
    document.body.classList.remove('barcode-scanner-active');
    throw new DOMException('Camera permission denied', 'NotAllowedError');
  }

  const { supported } = await BarcodeScanner.isSupported();
  if (!supported) {
    document.body.classList.remove('barcode-scanner-active');
    throw new DOMException('No usable camera', 'NotFoundError');
  }

  let settled = false;
  const listeners: PluginListenerHandle[] = [];

  listeners.push(
    await BarcodeScanner.addListener('barcodesScanned', (event) => {
      if (settled) return;
      const code = event.barcodes[0]?.rawValue ?? event.barcodes[0]?.displayValue;
      if (!code) return;
      settled = true;
      options.onBarcode(code);
    })
  );

  listeners.push(
    await BarcodeScanner.addListener('scanError', (event) => {
      console.error('[scan] native scanError:', event.message);
      options.onError(event.message);
    })
  );

  await BarcodeScanner.startScan({
    formats: PRODUCT_FORMATS,
    lensFacing: LensFacing.Back,
    resolution: Resolution['1920x1080'],
  });

  // Hafif zoom: barkodu büyütür, ultra-wide soft görüntüden uzaklaştırır.
  try {
    const [{ zoomRatio: min }, { zoomRatio: max }] = await Promise.all([
      BarcodeScanner.getMinZoomRatio(),
      BarcodeScanner.getMaxZoomRatio(),
    ]);
    const target = Math.min(Math.max(min, 1.5), max);
    await BarcodeScanner.setZoomRatio({ zoomRatio: target });
    console.log('[scan] native zoom:', target, `(min=${min}, max=${max})`);
  } catch (err) {
    console.warn('[scan] native zoom ayarlanamadı', err);
  }

  return async () => {
    settled = true;
    document.body.classList.remove('barcode-scanner-active');
    for (const listener of listeners) {
      try {
        await listener.remove();
      } catch {
        // ignore
      }
    }
    try {
      await BarcodeScanner.removeAllListeners();
    } catch {
      // ignore
    }
    try {
      await BarcodeScanner.stopScan();
    } catch {
      // ignore
    }
  };
}
