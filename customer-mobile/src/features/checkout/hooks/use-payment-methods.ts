import { useQuery } from "@tanstack/react-query";
import { getPaymentMethods } from "../services/payment-method.service";

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
    staleTime: 5 * 60 * 1000,
  });
}
