import { apiRequest } from "./client";

export interface DatasetUploadResponse {
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
  async loadDemo(key: string): Promise<DatasetUploadResponse> {
    return apiRequest<DatasetUploadResponse>(`/api/datasets/demo/${encodeURIComponent(key)}`, { method: "POST" });
  },
};
