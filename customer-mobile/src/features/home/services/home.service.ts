import { apiClient } from "@/services/api-client";
import type { HomeSummaryResponse } from "../types/home.types";

export async function getHomeSummary(): Promise<HomeSummaryResponse> {
  const res = await apiClient.get<{ data: HomeSummaryResponse }>("/home");
  return res.data;
}
