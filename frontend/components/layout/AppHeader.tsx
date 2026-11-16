"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { datasetsApi, RecentSessionItem } from '../../lib/api/datasets';

export function AppHeader() {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sessions, setSessions] = useState<RecentSessionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await datasetsApi.getRecentSessions(10);
      setSessions(data);
    } catch (e) {
      console.error("Failed to load sessions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDrawerOpen) {
      loadSessions();
    }
  }, [isDrawerOpen]);

  const getStatusBadge = (status: string) => {
    if (status.includes('completed') || status.includes('agent_8')) {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
    }
    if (status.includes('agent_7')) {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">Model Trained</span>;
    }
    if (status.includes('error')) {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200">Error</span>;
    }
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex flex-col group">
                <span className="text-xl font-black text-gray-900 tracking-tight group-hover:text-indigo-600 transition-colors">DataLens AI</span>
                <span className="text-[11px] font-bold text-indigo-600 tracking-wider uppercase">8-Agent Data Science Platform</span>
              </Link>
              
              <nav className="hidden md:flex items-center space-x-4 pl-4 border-l border-slate-200">
                <Link href="/" className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Home</Link>
                <Link href="/analysis" className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors">New Analysis</Link>
              </nav>
            </div>

            <div className="flex items-center space-x-3">
              {/* Session History Button */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 shadow-xs transition-all active:scale-95"
              >
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Session History</span>
              </button>

              <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-gray-500">AutoML Engine Active</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Session History Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setIsDrawerOpen(false)} />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-100 flex flex-col">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Recent Sessions</h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Quickly resume past analysis pipelines</p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fetching History...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-slate-500 font-semibold text-sm">No analysis sessions found.</p>
                    <p className="text-slate-400 text-xs mt-1">Upload a dataset or try a demo to get started.</p>
                  </div>
                ) : (
                  sessions.map((s) => (
                    <div
                      key={s.session_id}
                      onClick={() => {
                        setIsDrawerOpen(false);
                        router.push(`/analysis/${s.session_id}/agent-1`);
                      }}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[11px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                          {s.session_id.substring(0, 8)}...
                        </span>
                        {getStatusBadge(s.status)}
                      </div>
                      
                      <div className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                        {s.datasets.length > 0 ? s.datasets.join(', ') : 'Untitled Session'}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-400">
                        <span>{s.created_at ? new Date(s.created_at).toLocaleDateString() + ' ' + new Date(s.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Recently'}</span>
                        <span className="font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">Resume &rarr;</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    router.push('/analysis');
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors text-center block"
                >
                  + Start New Analysis
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
