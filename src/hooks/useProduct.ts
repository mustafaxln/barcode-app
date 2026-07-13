import { useQuery } from '@tanstack/react-query';
import { resolveProduct } from '../lib/productRepository';

export function useProduct(barcode: string | undefined) {
  return useQuery({
    queryKey: ['product', barcode],
    queryFn: () => resolveProduct(barcode!),
    enabled: Boolean(barcode),
    retry: false,
  });
}
