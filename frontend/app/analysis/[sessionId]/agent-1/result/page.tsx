"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AgentResultLayout } from '../../../../../components/workflow/AgentResultLayout';
import { Card, CardContent } from '../../../../../components/ui/Card';
import { mockAgents } from '../../../../../lib/mock/workflow';
import { analysisApi, Agent1ResultResponse } from '../../../../../lib/api/analysis';
import { Button } from '../../../../../components/ui/Button';

export default function Agent1ResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Agent1ResultResponse | null>(null);

  const [agents] = useState(
    mockAgents.map((a, idx) => ({
      ...a,
      status: (idx === 0 ? 'completed' : idx === 1 ? 'active' : 'pending') as any,
    }))
  );

  useEffect(() => {
    let mounted = true;
    const loadResult = async () => {
      if (!sessionId) return;
      try {
        const res = await analysisApi.getAgent1Result(sessionId);
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
    return null; // Layout handles animation
  }

  const isSingleDataset = data.datasets_combined === 1;

  return (
    <AgentResultLayout
      title="Agent 1 Results"
      subtitle="Data Ingestion & Combination"
      agents={agents}
      onBack={() => router.push(`/analysis/${sessionId}/agent-1`)}
      onProceed={() => router.push(`/analysis/${sessionId}/agent-2`)}
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        
        {/* Success Header Area */}
        <div className="text-center p-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
          
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6 shadow-inner ring-4 ring-green-50 transform transition-transform duration-500 group-hover:scale-110">
            <svg className="w-10 h-10 animate-[pulse_2s_ease-in-out_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
            {isSingleDataset ? "Dataset Ingested Successfully!" : "Datasets Combined Successfully!"}
          </h2>
          
          <p className="text-gray-600 max-w-lg mx-auto text-lg">
            {isSingleDataset 
              ? "Only one dataset was uploaded, so no combination was necessary. Your data is prepped and ready."
              : `Successfully combined ${data.datasets_combined} datasets into a single unified source.`}
          </p>
        </div>

        {/* Dataset Stats Section */}
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <h3 className="text-xl font-bold text-gray-900">{isSingleDataset ? "Dataset Overview" : "Final Unified Dataset"}</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
              Ready for Agent 2
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* File Name Card */}
            <Card className="md:col-span-1 bg-white border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-indigo-300 group cursor-default">
              <CardContent className="p-6 flex flex-col h-full justify-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">File Name</p>
                <h4 className="font-bold text-gray-900 truncate text-lg" title={data.filename}>{data.filename}</h4>
              </CardContent>
            </Card>

            {/* Rows Card */}
            <Card className="md:col-span-1 bg-white border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-green-300 group cursor-default">
              <CardContent className="p-6 flex flex-col h-full justify-center">
                <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Total Rows</p>
                <h4 className="font-bold text-gray-900 text-3xl group-hover:text-green-600 transition-colors">{(data.rows ?? 0).toLocaleString()}</h4>
              </CardContent>
            </Card>

            {/* Columns Card */}
            <Card className="md:col-span-1 bg-white border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300 group cursor-default">
              <CardContent className="p-6 flex flex-col h-full justify-center">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Total Columns</p>
                <h4 className="font-bold text-gray-900 text-3xl group-hover:text-blue-600 transition-colors">{(data.columns ?? 0).toLocaleString()}</h4>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Actions Area */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-100 gap-4">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto flex items-center justify-center space-x-2 border-gray-300 hover:bg-gray-50 transition-all hover:shadow-sm group"
            onClick={() => {
              window.location.href = analysisApi.getDownloadUrl(sessionId);
            }}
          >
            <svg className="w-5 h-5 text-gray-500 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{isSingleDataset ? 'Download Dataset' : 'Download Combined CSV'}</span>
          </Button>
          
          <p className="text-sm text-gray-500 flex items-center">
            <svg className="w-4 h-4 mr-1 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ready to clean and analyze your data? Proceed below.
          </p>
        </div>

      </div>
    </AgentResultLayout>
  );
}
