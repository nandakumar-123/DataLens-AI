import React from 'react';
import { ActivityEvent } from '../../types/workflow';

interface ActivityLogProps {
  events: ActivityEvent[];
  className?: string;
}

export function ActivityLog({ events, className = '' }: ActivityLogProps) {
  
  const getIconColor = (status: ActivityEvent['status']) => {
    switch (status) {
      case 'success': return 'text-emerald-500';
      case 'error': return 'text-red-500';
      case 'warning': return 'text-amber-500';
      case 'processing': return 'text-indigo-500 animate-pulse';
      case 'info':
      default: return 'text-gray-400';
    }
  };

  const getIcon = (status: ActivityEvent['status']) => {
    switch (status) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'processing': return '●';
      case 'info':
      default: return '○';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {events.map((event) => (
        <div key={event.id} className="flex space-x-3 text-sm">
          <div className={`flex-shrink-0 mt-0.5 ${getIconColor(event.status)} font-bold`}>
            {getIcon(event.status)}
          </div>
          <div className="flex-1 flex justify-between space-x-2">
            <p className="text-gray-700">{event.message}</p>
            <span className="text-gray-400 whitespace-nowrap text-xs font-mono tabular-nums">
              {event.timestamp}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
