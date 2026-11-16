import type { AgentDefinition, ActivityEvent } from "../../types/workflow";

export const mockAgents: AgentDefinition[] = [
  { id: "agent-1", name: "Data Ingestion & Profiling", description: "Inspect datasets, infer schemas, and identify relationships", status: "pending", progress: 0 },
  { id: "agent-2", name: "Data Quality & Cleaning", description: "Detect missing values, duplicates, and outliers", status: "pending", progress: 0 },
  { id: "agent-3", name: "Validation & Preparation", description: "Validate the cleaned dataset and prepare it for analysis", status: "pending", progress: 0 },
  { id: "agent-4", name: "Statistical Analysis", description: "Generate descriptive statistics and statistical tests", status: "pending", progress: 0 },
  { id: "agent-5", name: "Research Assistant", description: "Ask questions about statistical findings", status: "pending", progress: 0 },
  { id: "agent-6", name: "ML Preparation", description: "Identify learning type, target, and features", status: "pending", progress: 0 },
  { id: "agent-7", name: "AutoML & Model Training", description: "Recommend, train, and evaluate machine-learning models", status: "pending", progress: 0 },
  { id: "agent-8", name: "Insights & Reporting", description: "Create an analysis report and downloadable outputs", status: "pending", progress: 0 },
];

export const mockEvents: ActivityEvent[] = [
  { id: "workflow-ready", timestamp: new Date().toISOString(), message: "Workflow is ready. Upload a dataset to begin.", status: "info" },
];
