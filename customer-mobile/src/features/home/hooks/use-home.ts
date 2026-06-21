import { useQuery } from "@tanstack/react-query";
import { getHomeSummary } from "../services/home.service";

export function useGetHomeSummary() {
  return useQuery({
    queryKey: ["home-summary"],
    queryFn: getHomeSummary,
  });
}
