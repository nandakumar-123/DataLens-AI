export type AgentStatus = 
  | 'pending'
  | 'active'
  | 'processing'
  | 'completed'
  | 'warning'
  | 'error'
  | 'skipped';

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  progress?: number;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  message: string;
  status: 'info' | 'success' | 'warning' | 'error' | 'processing';
}
