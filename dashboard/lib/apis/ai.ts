import { apiClient } from "./base";

export interface AiAnalysisReport {
  analysis: string;
  generatedAt: string;
}

export const aiApi = {
  async getBusinessAnalysis(regenerate = false): Promise<AiAnalysisReport> {
    const url = `/ai/analyze${regenerate ? "?regenerate=true" : ""}`;
    const res = await apiClient.get<{ data: AiAnalysisReport }>(url);
    return res.data.data;
  },
};

export default aiApi;
