import { useMutation } from "@tanstack/react-query";
import { productApi } from "@/lib/apis/product";

export function useProductBarcodeLookup() {
  return useMutation({
    mutationFn: ({ code, outletId }: { code: string; outletId: string }) =>
      productApi.getByBarcode(code, outletId),
  });
}