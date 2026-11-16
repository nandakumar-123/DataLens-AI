import { apiRequest, apiUrl } from "./client";

export type CleanDecisions = { duplicates: string; missing: Record<string, string>; outliers: Record<string, string> };
export type CombinationStep = { right_dataset: string; left_key: string; right_key: string; type?: string; [key: string]: any };
export type Agent1ProfileResponse = { session_id?: string; status?: string; profiles?: any[]; relationships?: any[]; recommendation?: any; [key: string]: any };
export type Agent1ResultResponse = { status?: string; datasets_combined?: number; filename?: string; rows?: number; columns?: number; [key: string]: any };
export type Agent2AnalyzeResponse = { score: number; attempts: number; report?: any; recommendations?: any; [key: string]: any };
export type Agent2ResultResponse = { history: Array<{ attempt: number; old_score: number; new_score: number }>; [key: string]: any };
export type Agent3ValidationResponse = { preview: Array<Record<string, unknown>>; [key: string]: any };
export type Agent4AnalyzeResponse = { descriptive: Array<{ column: string; count: number; mean: number | null; median: number | null; std: number | null; min: number | null; max: number | null; skewness: number | null }>; correlations: { z: number[][]; x: string[]; y: string[]; strongest_positive: Array<{ feature_a: string; feature_b: string; correlation: number }>; strongest_negative: Array<{ feature_a: string; feature_b: string; correlation: number }> }; hypothesis_tests: Array<{ significant: boolean; test_name: string; variables: string; groups: string; p_value: number; interpretation: string }>; [key: string]: any };\nexport type Agent6State = { [key: string]: any };
export type Agent7RecommendResponse = { ai_recommended_models: Array<{ name: string; reason: string }>; compatible_models: string[]; [key: string]: any };
export type Agent7TrainResponse = { [key: string]: any };
export type TrainedModelResult = { [key: string]: any };

const base = (id: string, suffix: string) => `/api/analysis/${encodeURIComponent(id)}/${suffix}`;

export const analysisApi = {
  runAgent1: (id: string) => apiRequest<Agent1ProfileResponse>(base(id, "agent-1/profile"), { method: "POST" }),
  combineDatasets: (id: string, payload: Record<string, any>) => apiRequest(base(id, "agent-1/combine"), { method: "POST", body: JSON.stringify(payload) }),
  getAgent1Result: (id: string) => apiRequest<Agent1ResultResponse>(base(id, "agent-1/result")),
  getDownloadUrl: (id: string) => apiUrl(base(id, "agent-1/download")),
  runAgent2Analyze: (id: string) => apiRequest<Agent2AnalyzeResponse>(base(id, "agent-2/analyze"), { method: "POST" }),
  runAgent2Clean: (id: string, decisions: CleanDecisions) => apiRequest<any>(base(id, "agent-2/clean"), { method: "POST", body: JSON.stringify(decisions) }),
  getAgent2Result: (id: string) => apiRequest<Agent2ResultResponse>(base(id, "agent-2/result")),
  validateAgent3: (id: string) => apiRequest<Agent3ValidationResponse>(base(id, "agent-3/validate")),
  getAgent3DownloadUrl: (id: string) => apiUrl(base(id, "agent-3/download")),
  runAgent4Analyze: (id: string) => apiRequest<Agent4AnalyzeResponse>(base(id, "agent-4/analyze"), { method: "POST" }),
  askAgent4: (id: string, question: string) => apiRequest<any>(base(id, "agent-4/ask"), { method: "POST", body: JSON.stringify({ question }) }),
  runAgent6Analyze: (id: string) => apiRequest<Agent6State>(base(id, "agent-6/analyze"), { method: "POST" }),
  setAgent6LearningType: (id: string, learning_type: string) => apiRequest<Agent6State>(base(id, "agent-6/learning-type"), { method: "POST", body: JSON.stringify({ learning_type }) }),
  setAgent6Config: (id: string, target: string, features: string[]) => apiRequest<Agent6State>(base(id, "agent-6/config"), { method: "POST", body: JSON.stringify({ target, features }) }),
  agent7Recommend: (id: string) => apiRequest<Agent7RecommendResponse>(base(id, "agent-7/recommend")),
  agent7Train: (id: string, models: string[]) => apiRequest<Agent7TrainResponse>(base(id, "agent-7/train"), { method: "POST", body: JSON.stringify({ models }) }),
  getAgent7DownloadUrl: (id: string, modelId: string) => apiUrl(base(id, `agent-7/download/${encodeURIComponent(modelId)}`)),
  getAgent7Result: (id: string) => apiRequest<TrainedModelResult>(base(id, "agent-7/result")),
  agent7Predict: (id: string, modelId: string, features: Record<string, any>) => apiRequest<any>(base(id, `agent-7/predict/${encodeURIComponent(modelId)}`), { method: "POST", body: JSON.stringify({ features }) }),
  runAgent8: (id: string) => apiRequest<any>(base(id, "agent-8/run"), { method: "POST" }),
  getAgent8Result: (id: string) => apiRequest<any>(base(id, "agent-8/result")),
  getAgent8DownloadUrl: (id: string, format: string) => apiUrl(`${base(id, "agent-8/download")}?format=${encodeURIComponent(format)}`),
  chatAgent8: (id: string, message: string) => apiRequest<any>(base(id, "agent-8/chat"), { method: "POST", body: JSON.stringify({ message }) }),
};
