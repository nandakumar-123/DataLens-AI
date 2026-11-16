"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout, PageContainer } from '../../../../components/layout/AppLayout';
import { AgentWorkflow } from '../../../../components/workflow/AgentWorkflow';
import { AgentDetailPanel } from '../../../../components/workflow/AgentDetailPanel';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent } from '../../../../components/ui/Card';
import { mockAgents, mockEvents } from '../../../../lib/mock/workflow';
import { analysisApi, Agent2AnalyzeResponse, CleanDecisions } from '../../../../lib/api/analysis';

export default function Agent2ExecutionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Agent2AnalyzeResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCleaning, setIsCleaning] = useState(false);

  const [decisions, setDecisions] = useState<CleanDecisions>({
    duplicates: 'keep',
    missing: {},
    outliers: {}
  });

  const [agents, setAgents] = useState(
    mockAgents.map((a, idx) => ({
      ...a,
      status: (idx === 0 ? 'completed' : idx === 1 ? 'active' : 'pending') as any,
    }))
  );

  useEffect(() => {
    let mounted = true;
    const loadAnalysis = async () => {
      if (!sessionId) return;
      try {
        const res = await analysisApi.runAgent2Analyze(sessionId);
        if (mounted) {
          if (res.attempts >= 3 || res.score >= 95) {
            router.push(`/analysis/${sessionId}/agent-2/result`);
            return;
          }
          
          setData(res);
          
          // Pre-fill decisions with AI recommendations
          const recs = res.recommendations?.recommendations || {};
          const newDecisions: CleanDecisions = { duplicates: 'keep', missing: {}, outliers: {} };
          
          if (recs.duplicates?.method) {
            newDecisions.duplicates = String(recs.duplicates.method).toLowerCase();
          }
          if (recs.missing) {
            Object.keys(recs.missing).forEach(col => {
              newDecisions.missing[col] = String(recs.missing[col].method).toLowerCase();
            });
          }
          if (recs.outliers) {
            Object.keys(recs.outliers).forEach(col => {
              newDecisions.outliers[col] = String(recs.outliers[col].method).toLowerCase();
            });
          }
          setDecisions(newDecisions);
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setErrorMessage(err.message || 'Failed to analyze data quality.');
          setLoading(false);
        }
      }
    };
    loadAnalysis();
    return () => { mounted = false; };
  }, [sessionId]);

  const handleDecisionChange = (type: 'duplicates' | 'missing' | 'outliers', col: string | null, value: string) => {
    if (type === 'duplicates') {
      setDecisions({ ...decisions, duplicates: value });
    } else if (col) {
      setDecisions({
        ...decisions,
        [type]: { ...decisions[type], [col]: value }
      });
    }
  };

  const handleClean = async () => {
    setIsCleaning(true);
    setErrorMessage('');
    try {
      const res = await analysisApi.runAgent2Clean(sessionId, decisions);
      if (res.status === 'agent_2_completed') {
        router.push(`/analysis/${sessionId}/agent-2/result`);
      } else {
        // Still needs approval (score < 95)
        // Refresh analysis
        const newAnalysis = await analysisApi.runAgent2Analyze(sessionId);
        setData(newAnalysis);
        window.scrollTo(0, 0);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Cleaning failed.');
    } finally {
      setIsCleaning(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="flex flex-col justify-center items-center py-20 space-y-4">
            <svg className="animate-spin h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">Agent 2 is analyzing data quality</h2>
            <ul className="text-sm text-gray-500 space-y-1 text-center">
              <li>Checking missing values</li>
              <li>Detecting duplicates</li>
              <li>Running outlier detection (IQR, Z-score)</li>
            </ul>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const report = data?.report.issues;

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 pt-6 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AgentWorkflow agents={agents} />
        </div>
      </div>

      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            <div className="flex justify-between items-end mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Data Quality & Cleaning</h1>
                <div className="mt-2 inline-flex items-center space-x-2 text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-bold uppercase tracking-wider">Analyzing Final Combined Dataset</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500 block">Quality Score</span>
                <span className={`text-3xl font-bold ${data!.score >= 90 ? 'text-green-600' : data!.score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {data!.score} <span className="text-sm text-gray-500 font-normal">/ 100</span>
                </span>
                <span className="text-xs text-gray-400 block mt-1">Attempt {data!.attempts + 1} of 3</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg shadow-sm">
                {errorMessage}
              </div>
            )}

            {/* AI Summary */}
            <Card className="bg-indigo-50 border-indigo-100">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wider mb-2">AI Recommendation</h3>
                <p className="text-indigo-900">{data?.recommendations?.ai_summary}</p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 border-b pb-2">Human Approval Required</h3>
              
              {/* Duplicates */}
              {report?.duplicates > 0 && (
                <Card>
                  <CardContent className="p-6 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-900">Duplicate Rows</h4>
                      <p className="text-sm text-gray-500">{report.duplicates} rows detected</p>
                    </div>
                    <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                      <button 
                        className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${decisions.duplicates === 'keep' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        onClick={() => handleDecisionChange('duplicates', null, 'keep')}
                      >
                        Keep
                      </button>
                      <button 
                        className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${decisions.duplicates === 'remove' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-red-600'}`}
                        onClick={() => handleDecisionChange('duplicates', null, 'remove')}
                      >
                        Remove
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Missing Values */}
              {Object.keys(report?.missing || {}).map(col => {
                const aiRec = data?.recommendations?.recommendations?.missing?.[col]?.method?.toLowerCase();
                return (
                <Card key={`missing-${col}`}>
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-gray-900">Missing Values in <span className="font-mono bg-gray-100 px-1 rounded">{col}</span></h4>
                      <p className="text-sm text-gray-500">{report.missing[col]} empty cells</p>
                      {data?.recommendations?.recommendations?.missing?.[col]?.reason && (
                        <p className="text-xs text-indigo-600 mt-1 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          AI Reason: {data.recommendations.recommendations.missing[col].reason}
                        </p>
                      )}
                    </div>
                    <select
                      className="border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white"
                      value={decisions.missing[col] || 'keep'}
                      onChange={e => handleDecisionChange('missing', col, e.target.value)}
                    >
                      <option value="keep">Do Nothing {aiRec === 'keep' ? '(AI Rec)' : ''}</option>
                      <option value="mean">Impute Mean {aiRec === 'mean' ? '(AI Rec)' : ''}</option>
                      <option value="median">Impute Median {aiRec === 'median' ? '(AI Rec)' : ''}</option>
                      <option value="mode">Impute Mode {aiRec === 'mode' ? '(AI Rec)' : ''}</option>
                      <option value="drop">Drop Rows {aiRec === 'drop' ? '(AI Rec)' : ''}</option>
                    </select>
                  </CardContent>
                </Card>
              )})}

              {/* Outliers */}
              {Object.keys(report?.outliers || {}).map(col => {
                const info = report.outliers[col];
                const aiRec = data?.recommendations?.recommendations?.outliers?.[col]?.method?.toLowerCase();
                return (
                  <Card key={`outlier-${col}`}>
                    <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-gray-900">Outliers in <span className="font-mono bg-gray-100 px-1 rounded">{col}</span></h4>
                        <p className="text-sm text-gray-500">{info.count} detected using {info.method}</p>
                        {data?.recommendations?.recommendations?.outliers?.[col]?.reason && (
                          <p className="text-xs text-indigo-600 mt-1 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            AI Reason: {data.recommendations.recommendations.outliers[col].reason}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                        <button 
                          className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${decisions.outliers[col] === 'keep' || !decisions.outliers[col] ? 'bg-white shadow text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-900'}`}
                          onClick={() => handleDecisionChange('outliers', col, 'keep')}
                        >
                          Keep {aiRec === 'keep' && <span className="text-xs text-indigo-500 ml-1">★</span>}
                        </button>
                        <button 
                          className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${decisions.outliers[col] === 'cap' ? 'bg-white shadow text-indigo-600 border border-indigo-200' : 'text-gray-500 hover:text-indigo-600'}`}
                          onClick={() => handleDecisionChange('outliers', col, 'cap')}
                        >
                          Cap {aiRec === 'cap' && <span className="text-xs text-indigo-500 ml-1">★</span>}
                        </button>
                        <button 
                          className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${decisions.outliers[col] === 'remove' ? 'bg-white shadow text-red-600 border border-red-200' : 'text-gray-500 hover:text-red-600'}`}
                          onClick={() => handleDecisionChange('outliers', col, 'remove')}
                        >
                          Remove {aiRec === 'remove' && <span className="text-xs text-red-500 ml-1">★</span>}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {!report?.duplicates && Object.keys(report?.missing || {}).length === 0 && Object.keys(report?.outliers || {}).length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No critical cleaning issues found!
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-gray-200">
              <Button variant="ghost">Cancel</Button>
              <Button variant="primary" onClick={handleClean} disabled={isCleaning}>
                {isCleaning ? 'Applying Cleaning...' : 'Apply Approved Changes &rarr;'}
              </Button>
            </div>
            
          </div>

          <div className="lg:col-span-1">
            <AgentDetailPanel agent={agents[1]} events={mockEvents} />
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
