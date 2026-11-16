import { apiRequest } from "./client";

export interface RecentSessionItem { session_id: string; status: string; created_at?: string | null; datasets: string[]; }\n\nexport interface DatasetUploadResponse {
  session_id: string;
  status: string;
  datasets?: Array<Record<string, unknown>>;
}

export const datasetsApi = {
  async upload(files: File[]): Promise<DatasetUploadResponse> {
    const form = new FormData();
    files.forEach(file => form.append("files", file));
    return apiRequest<DatasetUploadResponse>("/api/datasets/upload", { method: "POST", body: form });
  },
  async getRecentSessions(limit = 10): Promise<RecentSessionItem[]> {\n    return apiRequest<RecentSessionItem[]>(`/api/datasets/sessions?limit=${limit}`);\n  },\n  async loadDemo(key: string): Promise<DatasetUploadResponse> {
    return apiRequest<DatasetUploadResponse>(`/api/datasets/demo/${encodeURIComponent(key)}`, { method: "POST" });
  },
};
