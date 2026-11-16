"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout, PageContainer } from '../../../../components/layout/AppLayout';
import { AgentWorkflow } from '../../../../components/workflow/AgentWorkflow';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { mockAgents } from '../../../../lib/mock/workflow';
import { analysisApi, Agent3ValidationResponse } from '../../../../lib/api/analysis';

export default function Agent3Page() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Agent3ValidationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, text: 'Agent 3 Started' });

  const agents = mockAgents.map((a, idx) => ({
    ...a,
    status: (idx < 2 ? 'completed' : idx === 2 ? 'active' : 'pending') as any,
  }));

  useEffect(() => {
    let mounted = true;
    const loadValidation = async () => {
      if (!sessionId) return;
      try {
        setProgress({ percent: 30, text: 'Dataset Loaded' });
        const res = await analysisApi.validateAgent3(sessionId);
        
        if (mounted) {
          setProgress({ percent: 100, text: 'Agent 3 Completed' });
          setData(res);
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setErrorMessage(err.message || 'Failed to validate dataset.');
          setLoading(false);
        }
      }
    };
    loadValidation();
    return () => { mounted = false; };
  }, [sessionId]);

  const handleDownload = () => {
    window.open(analysisApi.getAgent3DownloadUrl(sessionId), '_blank');
  };

  const handleContinue = () => {
    router.push(`/analysis/${sessionId}/agent-4`);
  };

  const handleBack = () => {
    router.push(`/analysis/${sessionId}/agent-2`);
  };

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 pt-6 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AgentWorkflow agents={agents} />
        </div>
      </div>

      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Data Management</h1>
              <p className="text-gray-500 mt-2">Agent 3 is validating the cleaned dataset for analysis.</p>
            </div>
            <Button variant="ghost" onClick={handleBack}>
              &larr; Back to Agent 2
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 space-y-6">
              <div className="w-full max-w-md bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-4 transition-all duration-500 ease-out" 
                  style={{ width: `${progress.percent}%` }}
                ></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{progress.percent}%</h2>
              <p className="text-lg text-gray-600 font-medium animate-pulse">{progress.text}</p>
            </div>
          ) : errorMessage ? (
            <div className="p-8 bg-red-50 border border-red-200 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold text-red-800 mb-2">AGENT 3 VALIDATION FAILED</h3>
              <p className="text-red-700 mb-6">Reason: {errorMessage}</p>
              <Button variant="outline" onClick={handleBack}>&larr; Back</Button>
            </div>
          ) : data ? (
            <div className="space-y-6 animate-fade-in-up">
              
              <div className="flex items-center space-x-3 text-green-700 bg-green-50 p-4 rounded-xl border border-green-200">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="text-lg font-bold uppercase tracking-wider">Agent 3 Completed</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-500 uppercase tracking-wider">Current Dataset</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xl font-bold text-gray-900">{data.filename}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-sm font-medium text-green-700">Validated</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <span className="block text-sm text-gray-500">Rows</span>
                        <span className="block text-2xl font-bold text-gray-900">{data.rows.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-sm text-gray-500">Columns</span>
                        <span className="block text-2xl font-bold text-gray-900">{data.columns}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-500 uppercase tracking-wider">Data Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span className="text-gray-600">Numeric Columns</span>
                      <span className="font-bold text-gray-900">{data.numeric_columns}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span className="text-gray-600">Categorical Columns</span>
                      <span className="font-bold text-gray-900">{data.categorical_columns}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span className="text-gray-600">Date Columns</span>
                      <span className="font-bold text-gray-900">{data.date_columns}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Missing Values</span>
                      <span className="font-bold text-gray-900">{data.missing_values.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? 'Hide Dataset' : 'View Dataset'}
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  Download Dataset
                </Button>
              </div>

              {showPreview && data.preview && data.preview.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(data.preview[0]).map((header) => (
                            <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.preview.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            {Object.values(row).map((val: any, colIdx) => (
                              <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {val !== null && val !== undefined ? String(val) : <span className="text-gray-400 italic">null</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              <div className="pt-8 border-t border-gray-200 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Ready for:</p>
                  <p className="font-bold text-gray-900">Agent 4 — Statistics & Research</p>
                </div>
                <Button variant="primary" size="lg" onClick={handleContinue}>
                  Proceed to Agent 4 &rarr;
                </Button>
              </div>

            </div>
          ) : null}
          
        </div>
      </PageContainer>
    </AppLayout>
  );
}
