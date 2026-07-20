import { useQuery } from '@tanstack/react-query';
import { resolveProduct } from '../lib/productRepository';

export function useProduct(barcode: string | undefined) {
  return useQuery({
    queryKey: ['product', barcode],
    queryFn: () => resolveProduct(barcode!),
    enabled: Boolean(barcode),
    retry: false,
    // Ürün sayfasına her girişte (özellikle geliştirme/QA sırasında veritabanı uygulama dışından
    // -örn. SQL Editor'den- değiştirilebildiği için) her zaman sunucudan taze veri iste; elde
    // önceden başarıyla çekilmiş bir sonuç olsa bile ona güvenip göstermeyi atla.
    refetchOnMount: 'always',
  });
}
