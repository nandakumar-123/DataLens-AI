"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout, PageContainer } from '../../../../components/layout/AppLayout';
import { AgentWorkflow } from '../../../../components/workflow/AgentWorkflow';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent } from '../../../../components/ui/Card';
import { mockAgents } from '../../../../lib/mock/workflow';
import { analysisApi, Agent1ProfileResponse, CombinationStep } from '../../../../lib/api/analysis';

export default function Agent1ExecutionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Agent1ProfileResponse | null>(null);
  const [globalError, setGlobalError] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [isCombining, setIsCombining] = useState(false);
  
  // Execution state
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [stepStatuses, setStepStatuses] = useState<Record<number, 'pending' | 'combining' | 'success' | 'error'>>({});
  const [stepErrors, setStepErrors] = useState<Record<number, string>>({});
  
  // Editable plan
  const [plan, setPlan] = useState<CombinationStep[]>([]);

  useEffect(() => {
    let mounted = true;
    const runProfile = async () => {
      try {
        const res = await analysisApi.runAgent1(sessionId);
        if (mounted) {
          setData(res);
          if (res.recommendation?.combination_plan) {
            setPlan(res.recommendation.combination_plan);
            const initialStatuses: any = {};
            res.recommendation.combination_plan.forEach((_: CombinationStep, i: number) => initialStatuses[i] = 'pending');
            setStepStatuses(initialStatuses);
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setGlobalError(err.message || 'Failed to profile datasets.');
          setLoading(false);
        }
      }
    };
    runProfile();
    return () => { mounted = false; };
  }, [sessionId, router]);

  const executeStep = async (stepIndex: number, currentPlan: CombinationStep[]) => {
    if (stepIndex >= currentPlan.length) {
      router.push(`/analysis/${sessionId}/agent-1/result`);
      return;
    }

    setCurrentStepIndex(stepIndex);
    setStepStatuses(prev => ({ ...prev, [stepIndex]: 'combining' }));
    
    const step = currentPlan[stepIndex];
    // Allow step.left_dataset to be CURRENT_RESULT directly or forced if idx > 0
    const leftDs = stepIndex === 0 ? step.left_dataset : (step.left_dataset === "CURRENT_RESULT" ? "CURRENT_RESULT" : "Combined Dataset");
    
    try {
      await analysisApi.combineDatasets(sessionId, {
        left: leftDs,
        right: step.right_dataset,
        left_key: step.left_key,
        right_key: step.right_key,
        type: step.join_type
      });
      
      setStepStatuses(prev => ({ ...prev, [stepIndex]: 'success' }));
      // Recursively execute next
      executeStep(stepIndex + 1, currentPlan);
      
    } catch (err: any) {
      setIsCombining(false);
      setStepStatuses(prev => ({ ...prev, [stepIndex]: 'error' }));
      
      if (err.data && err.data.error_code === 'COMBINATION_VALIDATION_ERROR') {
         setStepErrors(prev => ({ ...prev, [stepIndex]: err.data.message }));
      } else {
         setStepErrors(prev => ({ ...prev, [stepIndex]: err.message || 'Combination failed.' }));
      }
    }
  };

  const handleAcceptRecommendation = () => {
    if (plan.length === 0) {
      router.push(`/analysis/${sessionId}/agent-1/result`);
      return;
    }
    setIsCombining(true);
    setGlobalError('');
    executeStep(0, plan);
  };
  
  const handleEditPlan = () => {
    setIsEditing(true);
  };
  
  const saveEdits = () => {
    setIsEditing(false);
  };
  
  const updateStep = (index: number, field: keyof CombinationStep, value: string) => {
    const newPlan = [...plan];
    newPlan[index] = { ...newPlan[index], [field]: value };
    setPlan(newPlan);
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
            <h2 className="text-xl font-bold text-gray-900">Agent 1 is analyzing datasets</h2>
            <ul className="text-sm text-gray-500 space-y-1 text-center">
              <li>Profiling data</li>
              <li>Detecting relationships</li>
              <li>Generating combination plans</li>
            </ul>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const rec = data?.recommendation;

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 pt-6 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AgentWorkflow agents={mockAgents.map((a, i) => ({ ...a, status: i === 0 ? 'active' : 'pending'}))} />
        </div>
      </div>

      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Dataset Combination</h1>
          <p className="text-gray-600">Agent 1 has detected relationships between your datasets.</p>

          {globalError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg shadow-sm">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-bold">Error</h4>
                  <p className="text-sm mt-1">{globalError}</p>
                </div>
              </div>
            </div>
          )}

          {data?.profiles && data.profiles.length === 1 ? (
            <Card className="border-indigo-200 shadow-lg">
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <svg className="w-16 h-16 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">Single dataset detected.</h3>
                  <p className="text-gray-600">No combination is required.</p>
                  <div className="pt-6">
                    <Button variant="primary" onClick={() => router.push(`/analysis/${sessionId}/agent-1/result`)}>
                      Continue to Agent 2 →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (rec?.is_reliable === false || (rec?.combination_plan && rec.combination_plan.length === 0)) ? (
            <Card className="border-yellow-200 bg-yellow-50 shadow-md">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4 text-yellow-800">
                  <svg className="w-8 h-8 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-bold">{rec?.reason && rec.reason.includes("Mistral API key is not configured") ? "⚠ Mistral AI Error" : "⚠ No Reliable Relationship Found"}</h3>
                    <p className="mt-2 text-sm">{rec?.reason || "No compatible join keys or reliable relationships were identified between these datasets."}</p>
                    <p className="mt-2 text-sm font-medium">{rec?.reason && rec.reason.includes("Mistral") ? "Recommendation: Configure Mistral API Key in .env and restart backend." : "Recommendation: Keep datasets separate."}</p>
                    <div className="mt-6 flex space-x-4">
                      <Button variant="primary" onClick={() => router.push(`/analysis/${sessionId}/agent-1/result`)}>
                        {rec?.reason && rec.reason.includes("Mistral") ? "Bypass & Proceed" : "Keep Separate"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : rec?.combination_plan && rec.combination_plan.length > 0 ? (
            <Card className="border-indigo-200 shadow-lg">
              <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">AI Dataset Combination Plan</h3>
                <span className="flex items-center text-green-600 text-sm font-bold">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {plan.length} step{plan.length !== 1 ? 's' : ''} detected
                </span>
              </div>
              <CardContent className="p-8">
                
                <div className="space-y-8">
                  {plan.map((step, idx) => (
                    <div key={idx} className={`relative p-6 rounded-lg border ${stepStatuses[idx] === 'error' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                      {/* Step Header */}
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Step {idx + 1}</span>
                        {stepStatuses[idx] === 'success' && <span className="text-green-600 font-bold text-sm">✓ Completed</span>}
                        {stepStatuses[idx] === 'combining' && <span className="text-indigo-600 font-bold text-sm animate-pulse">Combining...</span>}
                      </div>

                      {/* Visual Flow */}
                      {!isEditing ? (
                        <>
                          <div className="flex flex-col items-center max-w-lg mx-auto space-y-4">
                            <div className="w-full text-center px-6 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm font-mono font-medium text-gray-900">
                              {(step.left_dataset === "CURRENT_RESULT" || (idx > 0 && step.left_dataset === "Combined Dataset")) ? "Combined Result" : step.left_dataset}
                            </div>
                            
                            <div className="flex items-center text-indigo-600 text-sm font-mono font-bold bg-indigo-50 px-4 py-1 rounded-full">
                              {step.left_key} = {step.right_key} 
                              <span className="ml-2 text-xs text-indigo-400">({step.join_type})</span>
                            </div>

                            <div className="w-full text-center px-6 py-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm font-mono font-medium text-gray-900">
                              {step.right_dataset}
                            </div>
                          </div>
                          
                          {stepStatuses[idx] === 'error' && (
                            <div className="mt-6 p-4 bg-white border border-red-200 text-red-700 text-sm rounded shadow-sm">
                              <span className="font-bold flex items-center mb-2">
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Combination Failed
                              </span> 
                              <p className="mb-4">{stepErrors[idx]}</p>
                              <div className="mt-4 flex space-x-3">
                                <Button variant="outline" onClick={() => executeStep(idx, plan)}>Retry Step</Button>
                                <Button variant="secondary" onClick={() => setIsEditing(true)}>Fix Plan</Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Left Dataset</label>
                            <input type="text" className="w-full p-2 border rounded" value={idx === 0 ? step.left_dataset : "Combined Dataset"} disabled />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Right Dataset</label>
                            <select className="w-full p-2 border rounded" value={step.right_dataset} onChange={e => updateStep(idx, 'right_dataset', e.target.value)}>
                              {data?.profiles?.map(p => <option key={p.filename} value={p.filename}>{p.filename}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Left Key</label>
                            <input type="text" className="w-full p-2 border rounded" value={step.left_key} onChange={e => updateStep(idx, 'left_key', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Right Key</label>
                            <input type="text" className="w-full p-2 border rounded" value={step.right_key} onChange={e => updateStep(idx, 'right_key', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Join Type</label>
                            <select className="w-full p-2 border rounded" value={step.join_type} onChange={e => updateStep(idx, 'join_type', e.target.value)}>
                              <option value="LEFT">LEFT</option>
                              <option value="INNER">INNER</option>
                              <option value="RIGHT">RIGHT</option>
                              <option value="OUTER">OUTER</option>
                            </select>
                          </div>
                        </div>
                      )}
                      
                    </div>
                  ))}
                </div>

                {!isEditing ? (
                  <div className="mt-10 flex justify-center space-x-4">
                    <Button variant="primary" onClick={handleAcceptRecommendation} disabled={isCombining}>
                      {isCombining ? 'Executing...' : '✓ Accept & Combine'}
                    </Button>
                    <Button variant="secondary" onClick={handleEditPlan} disabled={isCombining}>✎ Edit Recommendation</Button>
                    <Button variant="ghost" onClick={() => router.push(`/analysis/${sessionId}/agent-1/result`)}>Keep Separate</Button>
                  </div>
                ) : (
                  <div className="mt-10 flex justify-end space-x-4">
                    <Button variant="ghost" onClick={() => setPlan(rec.combination_plan)}>Cancel</Button>
                    <Button variant="primary" onClick={saveEdits}>Save Edits</Button>
                  </div>
                )}
                
              </CardContent>
            </Card>
          ) : null}

        </div>
      </PageContainer>
    </AppLayout>
  );
}
