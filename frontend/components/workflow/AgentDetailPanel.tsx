import React from 'react';
import { AgentDefinition, ActivityEvent } from '../../types/workflow';
import { StatusBadge } from '../ui/StatusBadge';
import { ActivityLog } from '../ui/ActivityLog';

interface AgentDetailPanelProps {
  agent: AgentDefinition | null;
  events: ActivityEvent[];
  className?: string;
}

export function AgentDetailPanel({ agent, events, className = '' }: AgentDetailPanelProps) {
  if (!agent) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm ${className}`}>
        <p className="text-gray-500">Select an agent to view details.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{agent.id} - {agent.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{agent.description}</p>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      <div className="p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="font-medium text-gray-700">Progress</span>
            <span className="font-bold text-indigo-600">{agent.progress || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${agent.progress || 0}%` }}
            ></div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Activity Log</h4>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 max-h-64 overflow-y-auto">
            {agent.status === 'pending' ? (
              <p className="text-sm text-gray-400 text-center py-4">Agent is queued. Waiting to start...</p>
            ) : events.length > 0 ? (
              <ActivityLog 
                events={events.map(e => {
                  if (agent.status === 'completed' && e.status === 'processing') {
                    return { 
                      ...e, 
                      status: 'success', 
                      message: e.message.replace('...', ' completed successfully.')
                    };
                  }
                  return e;
                })} 
              />
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No activity recorded yet.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
