import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import aiApi from "@/lib/apis/ai";

const AI_KEYS = {
  analysis: () => ["ai", "analysis"] as const,
};

export function useGetBusinessAnalysis(enabled = true) {
  return useQuery({
    queryKey: AI_KEYS.analysis(),
    queryFn: () => aiApi.getBusinessAnalysis(false),
    enabled,
    retry: false,
    staleTime: Infinity,
  });
}

export function useRegenerateBusinessAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => aiApi.getBusinessAnalysis(true),
    onSuccess: (data) => {
      qc.setQueryData(AI_KEYS.analysis(), data);
    },
  });
}
