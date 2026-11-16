import React, { useState, useEffect } from 'react';
import { AppLayout, PageContainer } from '../layout/AppLayout';
import { AgentWorkflow } from './AgentWorkflow';
import { Button } from '../ui/Button';

interface AgentResultLayoutProps {
  title: string;
  subtitle: string;
  agents: any[];
  score?: number;
  scoreLabel?: string;
  previousScore?: number;
  onBack: () => void;
  onProceed: () => void;
  children: React.ReactNode;
}

export const AgentResultLayout: React.FC<AgentResultLayoutProps> = ({
  title,
  subtitle,
  agents,
  score,
  scoreLabel = "Score",
  previousScore,
  onBack,
  onProceed,
  children
}) => {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 1500); // 1.5 seconds animation
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 pt-6 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AgentWorkflow agents={agents} />
        </div>
      </div>

      <PageContainer>
        {showAnimation ? (
          <div className="flex flex-col items-center justify-center py-32 animate-pulse">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{title} Completed</h2>
            <p className="text-gray-500 mt-2">Preparing results...</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-600 mt-1">{subtitle}</p>
              </div>
              
              {score !== undefined && (
                <div className={`p-4 rounded-xl border ${score >= 95 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{scoreLabel}</span>
                    <div className="flex items-baseline space-x-2">
                      <span className={`text-3xl font-bold ${score >= 95 ? 'text-green-700' : 'text-yellow-700'}`}>
                        {score}
                      </span>
                      <span className="text-gray-500 text-sm">/ 100</span>
                    </div>
                    {previousScore !== undefined && previousScore < score && (
                      <span className="text-xs font-semibold text-green-600 mt-1">
                        ↑ +{(score - previousScore).toFixed(1)} improvement
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {children}
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-gray-200">
              <Button variant="ghost" onClick={onBack}>Back to Execution</Button>
              <Button variant="primary" onClick={onProceed}>Proceed to Next Agent &rarr;</Button>
            </div>
          </div>
        )}
      </PageContainer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}} />
    </AppLayout>
  );
};
