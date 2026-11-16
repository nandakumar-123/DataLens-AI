import React from 'react';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <AppHeader />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}

export function PageContainer({ children, className = '' }: AppLayoutProps & { className?: string }) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full ${className}`}>
      {children}
    </div>
  );
}
