import React from 'react';
import { AgentStatus } from '../../types/workflow';

interface StatusBadgeProps {
  status: AgentStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const styles: Record<AgentStatus, { bg: string, text: string, dot: string, label: string }> = {
    pending: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Pending' },
    active: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500 animate-pulse', label: 'Active' },
    processing: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500 animate-pulse', label: 'Processing' },
    completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Completed' },
    warning: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Warning' },
    error: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Error' },
    skipped: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-300', label: 'Skipped' },
  };

  const config = styles[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}>
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}
