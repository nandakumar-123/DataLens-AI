import React from 'react';
import { AgentDefinition } from '../../types/workflow';

interface AgentNodeProps {
  agent: AgentDefinition;
  isFirst?: boolean;
  isLast?: boolean;
}

export function AgentNode({ agent, isFirst = false, isLast = false }: AgentNodeProps) {
  
  const getStatusStyles = () => {
    switch (agent.status) {
      case 'completed': return 'border-emerald-500 bg-emerald-50 text-emerald-700';
      case 'active':
      case 'processing': return 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm animate-pulse-light ring-2 ring-indigo-200 ring-offset-1';
      case 'warning': return 'border-amber-500 bg-amber-50 text-amber-700';
      case 'error': return 'border-red-500 bg-red-50 text-red-700';
      case 'skipped': return 'border-gray-300 bg-gray-100 text-gray-500';
      case 'pending':
      default: return 'border-gray-200 bg-white text-gray-400';
    }
  };

  const getIcon = () => {
    switch (agent.status) {
      case 'completed': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✕';
      case 'active':
      case 'processing': return '●';
      case 'skipped': return '−';
      case 'pending':
      default: return '○';
    }
  };

  return (
    <div className="flex flex-col items-center relative group w-24 sm:w-32 z-10">
      
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 text-xl font-bold transition-all duration-300 ${getStatusStyles()}`}>
        {getIcon()}
      </div>

      <div className="mt-3 text-center">
        <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${agent.status === 'pending' ? 'text-gray-400' : 'text-gray-700'}`}>
          {agent.id}
        </div>
        <div className={`text-xs sm:text-sm font-medium leading-tight ${agent.status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>
          {agent.name}
        </div>
      </div>
    </div>
  );
}
