"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AgentResultLayout } from '../../../../../components/workflow/AgentResultLayout';
import { Card, CardContent } from '../../../../../components/ui/Card';
import { mockAgents } from '../../../../../lib/mock/workflow';
import { analysisApi, Agent2ResultResponse } from '../../../../../lib/api/analysis';

export default function Agent2ResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Agent2ResultResponse | null>(null);

  const [agents] = useState(
    mockAgents.map((a, idx) => ({
      ...a,
      status: (idx === 0 || idx === 1 ? 'completed' : idx === 2 ? 'active' : 'pending') as any,
    }))
  );

  useEffect(() => {
    let mounted = true;
    const loadResult = async () => {
      if (!sessionId) return;
      try {
        const res = await analysisApi.getAgent2Result(sessionId);
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) setLoading(false);
      }
    };
    loadResult();
    return () => { mounted = false; };
  }, [sessionId]);

  if (loading || !data) {
    return null; // The layout handles the animation, but we need data first. We can just show empty layout until data.
  }

  const prevScore = data.history.length > 0 ? data.history[data.history.length - 1].old_score : data.score;
  const initial = data.initial_report?.issues;
  const current = data.current_report?.issues;

  return (
    <AgentResultLayout
      title="Agent 2 Results"
      subtitle="Data Quality & Cleaning"
      agents={agents}
      score={data.score}
      scoreLabel="Data Quality Score"
      previousScore={prevScore}
      onBack={() => router.push(`/analysis/${sessionId}/agent-2`)}
      onProceed={() => router.push(`/analysis/${sessionId}/agent-3`)}
    >
      
      {data.score < 95 && data.attempts >= 3 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start space-x-3 text-yellow-800">
          <svg className="w-6 h-6 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="font-bold">Maximum safe cleaning attempts reached</h4>
            <p className="text-sm mt-1">DataLens AI could not safely improve the dataset further without making potentially destructive assumptions.</p>
          </div>
        </div>
      )}

      {/* AI Summary */}
      <Card className="bg-indigo-50 border-indigo-100">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wider mb-2">AI Summary</h3>
          <p className="text-indigo-900">{data.ai_summary}</p>
        </CardContent>
      </Card>

      {/* Cleaning Summary (Before/After) */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Cleaning Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Card>
            <CardContent className="p-4">
              <h4 className="text-sm font-bold text-gray-500 uppercase">Missing Values</h4>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-400">Before</p>
                  <p className="font-semibold">{initial?.total_missing || 0}</p>
                </div>
                <div className="text-gray-300">&rarr;</div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">After</p>
                  <p className="font-semibold text-gray-900">{current?.total_missing || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h4 className="text-sm font-bold text-gray-500 uppercase">Duplicates</h4>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-400">Before</p>
                  <p className="font-semibold">{initial?.duplicates || 0}</p>
                </div>
                <div className="text-gray-300">&rarr;</div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">After</p>
                  <p className="font-semibold text-gray-900">{current?.duplicates || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h4 className="text-sm font-bold text-gray-500 uppercase">Outliers</h4>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-400">Before</p>
                  <p className="font-semibold">
                    {Object.values(initial?.outliers || {}).reduce((sum: number, v: any) => sum + v.count, 0)}
                  </p>
                </div>
                <div className="text-gray-300">&rarr;</div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">After</p>
                  <p className="font-semibold text-gray-900">
                    {Object.values(current?.outliers || {}).reduce((sum: number, v: any) => sum + v.count, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Outlier Results Detail */}
      {current?.outliers && Object.keys(current.outliers).length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Remaining Outliers Detection</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(current.outliers).map(col => {
              const info = current.outliers[col];
              return (
                <Card key={`outlier-${col}`}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-gray-900 truncate pr-2">{col}</h4>
                      <span className="px-2 py-1 bg-gray-100 text-xs font-semibold rounded text-gray-600">{info.method}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Detected:</span>
                      <span className="font-medium">{info.count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Percentage:</span>
                      <span className="font-medium">{info.percentage}%</span>
                    </div>
                    <div className="mt-3 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                      Review Recommended
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      {data.history.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Cleaning Attempt History</h3>
          <div className="flex flex-wrap gap-4">
            {data.history.map((h: { attempt: number; old_score: number; new_score: number }, i: number) => (
              <div key={i} className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <span className="text-xs font-bold text-gray-400">Attempt {h.attempt}</span>
                <span className="text-sm font-semibold">{h.old_score}</span>
                <span className="text-gray-300">&rarr;</span>
                <span className="text-sm font-semibold text-green-600">{h.new_score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </AgentResultLayout>
  );
}
