/**
 * Barkod tarama için arka kamerayı mümkün olduğunca net/yüksek çözünürlükte açar.
 *
 * Capacitor WebView'da varsayılan getUserMedia çoğu telefonda düşük çözünürlüklü
 * (veya geniş açı) lensi seçer; native kamera uygulamasına göre bulanık görünür.
 * Burada: yüksek ideal çözünürlük → continuous focus → hafif zoom deniyoruz.
 */

type CapZoom = { min: number; max: number; step?: number };
type ExtendedCapabilities = MediaTrackCapabilities & {
  focusMode?: string[];
  zoom?: CapZoom;
};

const CONSTRAINT_ATTEMPTS: MediaStreamConstraints[] = [
  {
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
    },
  },
  {
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  },
  {
    audio: false,
    video: {
      facingMode: 'environment',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  },
  {
    audio: false,
    video: { facingMode: 'environment' },
  },
];

/** Ultra-wide / macro etiketlerini cezalandır; ana arka kamerayı tercih et. */
function scoreCameraLabel(label: string): number {
  const l = label.toLowerCase();
  if (!l) return 1;
  if (/(ultra|wide|macro|tele)/.test(l)) return 0;
  if (/(back|rear|environment|arka)/.test(l)) return 3;
  return 1;
}

async function preferRearCameraId(): Promise<string | undefined> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((d) => d.kind === 'videoinput' && d.deviceId);
    if (cameras.length === 0) return undefined;
    cameras.sort((a, b) => scoreCameraLabel(b.label) - scoreCameraLabel(a.label));
    return cameras[0]?.deviceId;
  } catch {
    return undefined;
  }
}

/**
 * Stream açıldıktan sonra odak/zoom yeteneklerini zorla.
 * Bazı Android WebView'larda yalnızca applyConstraints sonrası continuous focus açılır.
 */
export async function optimizeTrackForBarcode(track: MediaStreamTrack): Promise<void> {
  const caps = track.getCapabilities?.() as ExtendedCapabilities | undefined;
  if (!caps) return;

  const advanced: MediaTrackConstraintSet[] = [];

  if (caps.focusMode?.includes('continuous')) {
    advanced.push({ focusMode: 'continuous' } as MediaTrackConstraintSet);
  }

  // Hafif zoom: barkodu büyütür ve birçok telefonda ana (daha net) lens aralığına yaklaşır.
  if (caps.zoom && typeof caps.zoom.max === 'number') {
    const min = caps.zoom.min ?? 1;
    const max = caps.zoom.max;
    const target = Math.min(Math.max(min, 1.4), max);
    if (target > min) {
      advanced.push({ zoom: target } as MediaTrackConstraintSet);
    }
  }

  if (advanced.length === 0) return;

  try {
    await track.applyConstraints({ advanced });
    console.log('[scan] optimizeTrack uygulandı:', track.getSettings());
  } catch {
    for (const single of advanced) {
      try {
        await track.applyConstraints({ advanced: [single] });
      } catch {
        // Cihaz desteklemiyor — sessizce geç.
      }
    }
  }
}

async function getUserMediaWithFallback(
  attempts: MediaStreamConstraints[]
): Promise<MediaStream> {
  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
      console.warn('[scan] getUserMedia denemesi başarısız, fallback…', constraints.video);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Kamera açılamadı');
}

/**
 * Barkod taramaya uygun bir MediaStream döner.
 * Önce yüksek çözünürlüklü arka kamera dener; başarısız olursa kademeli düşer.
 */
export async function openBarcodeCamera(): Promise<MediaStream> {
  // İzin aldıktan sonra etiketler dolu olabilir; önce basit bir açılışla izin iste,
  // sonra mümkünse daha iyi cihaza geç.
  let stream = await getUserMediaWithFallback(CONSTRAINT_ATTEMPTS);

  const preferredId = await preferRearCameraId();
  const currentId = stream.getVideoTracks()[0]?.getSettings()?.deviceId;

  if (preferredId && preferredId !== currentId) {
    try {
      const better = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          deviceId: { exact: preferredId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
      });
      stream.getTracks().forEach((t) => t.stop());
      stream = better;
      console.log('[scan] Tercih edilen arka kamera seçildi:', preferredId);
    } catch {
      // Tercih edilen cihaz açılamazsa mevcut stream ile devam.
    }
  }

  const track = stream.getVideoTracks()[0];
  if (track) {
    await optimizeTrackForBarcode(track);
    // Bazı cihazlarda odak ancak kısa gecikmeyle tutar — bir kez daha dene.
    window.setTimeout(() => {
      void optimizeTrackForBarcode(track);
    }, 800);
  }

  const settings = track?.getSettings();
  console.log('[scan] Kamera ayarları:', settings);

  return stream;
}
