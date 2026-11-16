import React from 'react';
import { AgentDefinition } from '../../types/workflow';
import { AgentNode } from './AgentNode';

interface AgentWorkflowProps {
  agents: AgentDefinition[];
  className?: string;
}

export function AgentWorkflow({ agents, className = '' }: AgentWorkflowProps) {
  return (
    <div className={`py-8 overflow-x-auto ${className}`}>
      <div className="flex items-start justify-between min-w-[800px] max-w-5xl mx-auto relative px-4 sm:px-8">
        
        {/* Connector Line */}
        <div className="absolute top-6 left-12 right-12 h-0.5 bg-gray-200 -z-0">
          <div 
            className="h-full bg-indigo-500 transition-all duration-500 ease-in-out" 
            style={{ 
              width: `${Math.max(0, (agents.findIndex(a => a.status === 'active' || a.status === 'processing') / (agents.length - 1)) * 100 || 
                (agents.every(a => a.status === 'completed') ? 100 : 0))}%` 
            }}
          ></div>
        </div>

        {agents.map((agent, index) => (
          <AgentNode 
            key={agent.id} 
            agent={agent} 
            isFirst={index === 0}
            isLast={index === agents.length - 1}
          />
        ))}

      </div>
    </div>
  );
}
