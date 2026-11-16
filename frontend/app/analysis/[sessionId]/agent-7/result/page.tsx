"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AgentWorkflow } from '../../../../../components/workflow/AgentWorkflow';
import { AgentDetailPanel } from '../../../../../components/workflow/AgentDetailPanel';
import { mockAgents, mockEvents } from '../../../../../lib/mock/workflow';
import { analysisApi, TrainedModelResult } from '../../../../../lib/api/analysis';

export default function Agent7ResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Prediction State
  const [featureInputs, setFeatureInputs] = useState<Record<string, string>>({});
  const [predictionResult, setPredictionResult] = useState<{prediction: any, probability?: number} | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictError, setPredictError] = useState('');

  const [agents, setAgents] = useState(
    mockAgents.map((a, idx) => ({
      ...a,
      status: (idx < 6 ? 'completed' : idx === 6 ? 'active' : 'pending') as any,
    }))
  );

  useEffect(() => {
    let mounted = true;
    const loadResult = async () => {
      if (!sessionId) return;
      try {
        const res = await analysisApi.getAgent7Result(sessionId);
        if (mounted) {
          setData(res);
          
          if (res.features) {
            const initInputs: Record<string, string> = {};
            res.features.forEach((f: string) => {
              if (res.sample_row && res.sample_row[f] !== undefined) {
                initInputs[f] = String(res.sample_row[f]);
              } else {
                initInputs[f] = '';
              }
            });
            setFeatureInputs(initInputs);
          }
          
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setErrorMessage(err.message || 'Failed to load model evaluation results.');
          setLoading(false);
        }
      }
    };
    loadResult();
    return () => { mounted = false; };
  }, [sessionId]);

  const handlePredict = async () => {
    if (!data?.best_model) return;
    
    // Validate inputs
    for (const f of data.features) {
      const val = featureInputs[f];
      if (!val || val.trim() === '') {
        setPredictError(`Please enter a valid value for ${f}`);
        return;
      }
      
      // Strict type checking based on sample data
      if (data.sample_row && typeof data.sample_row[f] === 'number') {
        if (isNaN(Number(val.trim()))) {
          setPredictError(`"${val}" is invalid. Please enter a valid number for ${f}.`);
          return;
        }
      }
    }
    
    const payload: Record<string, any> = {};
    for (const f of data.features) {
      const val = featureInputs[f].trim();
      if (!isNaN(Number(val)) && val !== '') {
        payload[f] = Number(val);
      } else {
        payload[f] = val;
      }
    }

    setIsPredicting(true);
    setPredictError('');
    setPredictionResult(null);

    try {
      const result = await analysisApi.agent7Predict(sessionId, data.best_model.model_id, payload);
      setPredictionResult(result);
    } catch (err: any) {
      setPredictError(err.message || 'Prediction failed.');
    } finally {
      setIsPredicting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-indigo-600/80 font-semibold text-sm tracking-widest uppercase animate-pulse">Loading Evaluation...</p>
        </div>
      </div>
    );
  }

  const allModels: TrainedModelResult[] = data?.trained_models || [];
  const bestModel = data?.best_model || (allModels.length > 0 ? allModels[0] : null);
  const isReliable = data?.is_reliable ?? (bestModel !== null);
  const hasModels = bestModel !== null || allModels.length > 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 selection:bg-indigo-500/20 font-sans">
      
      {/* HEADER & WORKFLOW */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">MODEL EVALUATION</h1>
              <p className="text-slate-500 text-xs mt-1 font-bold uppercase tracking-wider">Agent 7 Result</p>
            </div>
            <div className="flex space-x-3 text-xs font-bold text-slate-400 hidden sm:flex bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
              <span className="text-slate-600">A1 ✓</span><span>→</span>
              <span className="text-slate-600">A2 ✓</span><span>→</span>
              <span className="text-slate-600">A3 ✓</span><span>→</span>
              <span className="text-slate-600">A4 ✓</span><span>→</span>
              <span className="text-slate-600">A5 ✓</span><span>→</span>
              <span className="text-slate-600">A6 ✓</span><span>→</span>
              <span className="text-indigo-600 font-black flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span> A7</span><span>→</span>
              <span>A8</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          
          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-10">
            
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl shadow-sm font-medium flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {errorMessage}
              </div>
            )}

            {!hasModels ? (
              // NO MODEL STATE
              <div className="text-center p-14 bg-white rounded-[2rem] border border-red-100 shadow-xl shadow-red-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-50 text-red-500 mb-6 shadow-inner border border-red-100">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">NO MODELS TRAINED</h2>
                <p className="text-slate-500 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                  Please return to the model training step to select and train candidate algorithms.
                </p>
                <div className="flex justify-center space-x-4 relative z-10">
                  <button onClick={() => router.push(`/analysis/${sessionId}/agent-7`)} className="px-8 py-3.5 bg-white text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all border border-slate-200 shadow-sm hover:shadow-md">
                    &larr; Back to Model Training
                  </button>
                </div>
              </div>
            ) : (
              // HAS MODEL STATE
              <>
                {!isReliable && (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-2xl shadow-sm font-medium flex items-center gap-3">
                    <svg className="w-5 h-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <div>
                      <span className="font-bold">Generalization Notice:</span> The models evaluated have moderate generalization gaps or noise on this dataset. The best available pipeline has been selected for you below.
                    </div>
                  </div>
                )}
                {/* BEST MODEL SUMMARY */}
                <div className="p-8 md:p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_40px_rgb(99,102,241,0.08)] transition-all duration-500">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-50 via-purple-50/50 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none group-hover:opacity-100 transition-opacity duration-700"></div>
                  
                  <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 relative z-10">
                    <div>
                      <div className="flex items-center space-x-2 mb-3 bg-indigo-50 w-fit px-3 py-1.5 rounded-full border border-indigo-100/50">
                        <span className="text-yellow-500 animate-pulse text-sm leading-none">★</span>
                        <h2 className="text-xs font-black text-indigo-700 uppercase tracking-widest">Best Model Selected</h2>
                        <span className="text-slate-400 text-xs font-bold capitalize">({data.problem_type || data.learning_type})</span>
                      </div>
                      <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{bestModel?.name}</h3>
                    </div>
                    <div className="mt-6 md:mt-0">
                      <button 
                        onClick={() => window.location.href = analysisApi.getAgent7DownloadUrl(sessionId, bestModel.model_id)}
                        className="flex items-center space-x-2 bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-md active:scale-95"
                      >
                        <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>Download Model (.pkl)</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Dynamic Metrics Cards for Best Model */}
                  {data.problem_type === 'classification' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 relative z-10">
                      <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100/80">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Accuracy</p>
                        <p className="font-black text-slate-900 text-xl">{bestModel?.main_score !== undefined ? `${(bestModel.main_score * 100).toFixed(1)}%` : 'N/A'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">({bestModel?.main_score?.toFixed(4)})</p>
                      </div>
                      <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100 shadow-sm">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">CV Accuracy</p>
                        <p className="font-black text-indigo-700 text-xl">{bestModel?.cv_score !== undefined ? `${(bestModel.cv_score * 100).toFixed(1)}%` : 'N/A'}</p>
                        <p className="text-[10px] text-indigo-400 font-mono">({bestModel?.cv_score?.toFixed(4)})</p>
                      </div>
                      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Precision</p>
                        <p className="font-bold text-slate-800 text-lg">{bestModel?.metrics?.precision !== undefined ? `${(bestModel.metrics.precision * 100).toFixed(1)}%` : 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recall</p>
                        <p className="font-bold text-slate-800 text-lg">{bestModel?.metrics?.recall !== undefined ? `${(bestModel.metrics.recall * 100).toFixed(1)}%` : 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">F1 Score</p>
                        <p className="font-bold text-slate-800 text-lg">{bestModel?.metrics?.f1 !== undefined ? `${(bestModel.metrics.f1 * 100).toFixed(1)}%` : 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ROC-AUC</p>
                        <p className="font-bold text-slate-800 text-lg">{bestModel?.metrics?.roc_auc !== undefined ? `${(bestModel.metrics.roc_auc * 100).toFixed(1)}%` : 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fit Diagnosis</p>
                        <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md mt-1 ${
                          bestModel?.status?.includes('Overfitting') ? 'bg-yellow-100 text-yellow-800' :
                          bestModel?.status?.includes('Underfitting') ? 'bg-red-100 text-red-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {bestModel?.status || 'Good Fit'}
                        </span>
                      </div>
                    </div>
                  ) : data.problem_type === 'regression' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 relative z-10">
                      <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100/80">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">R² (Train)</p>
                        <p className="font-black text-slate-900 text-xl">{bestModel?.main_score?.toFixed(4) || 'N/A'}</p>
                      </div>
                      <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100 shadow-sm">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">CV R² Score</p>
                        <p className="font-black text-indigo-700 text-xl">{bestModel?.cv_score?.toFixed(4) || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">MAE</p>
                        <p className="font-bold text-slate-800 text-lg">{bestModel?.metrics?.mae !== undefined ? bestModel.metrics.mae.toFixed(4) : 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">MSE</p>
                        <p className="font-bold text-slate-800 text-lg">{bestModel?.metrics?.mse !== undefined ? bestModel.metrics.mse.toFixed(4) : 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">RMSE</p>
                        <p className="font-bold text-slate-800 text-lg">{bestModel?.metrics?.rmse !== undefined ? bestModel.metrics.rmse.toFixed(4) : 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gen Gap</p>
                        <p className="font-bold text-slate-800 text-lg">{bestModel?.generalization_gap !== undefined ? bestModel.generalization_gap.toFixed(4) : 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fit Diagnosis</p>
                        <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md mt-1 ${
                          bestModel?.status?.includes('Overfitting') ? 'bg-yellow-100 text-yellow-800' :
                          bestModel?.status?.includes('Underfitting') ? 'bg-red-100 text-red-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {bestModel?.status || 'Good Fit'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                      <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100/80">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Silhouette Score</p>
                        <p className="font-black text-slate-900 text-2xl">{bestModel?.main_score?.toFixed(4) || 'N/A'}</p>
                      </div>
                      <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Calinski-Harabasz</p>
                        <p className="font-bold text-indigo-800 text-xl">{bestModel?.metrics?.calinski_harabasz !== undefined ? bestModel.metrics.calinski_harabasz.toFixed(2) : 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Davies-Bouldin</p>
                        <p className="font-bold text-slate-800 text-xl">{bestModel?.metrics?.davies_bouldin !== undefined ? bestModel.metrics.davies_bouldin.toFixed(4) : 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                        <p className="font-bold text-emerald-600 text-lg mt-0.5">{bestModel?.status || 'Trained'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI EXPLANATION */}
                {data.explanation && (
                  <div className="p-7 bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl relative overflow-hidden group">
                    <div className="absolute left-0 top-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-indigo-500 rounded-l-3xl"></div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <h3 className="font-black text-slate-800 tracking-wide text-lg">AI Evaluation & Fit Diagnosis Summary</h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed pl-14 text-[15px] whitespace-pre-wrap">{data.explanation}</p>
                  </div>
                )}

                {/* FEATURE IMPORTANCE / EXPLAINABLE AI (XAI) SECTION */}
                {bestModel?.feature_importances && bestModel.feature_importances.length > 0 && (
                  <div className="p-8 bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-[2.5rem] relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-black text-slate-900 tracking-tight text-lg">Feature Importance / Explainable AI (XAI)</h3>
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 rounded-md">Interpretable ML</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">Top contributing drivers determining predictions in <span className="font-bold text-slate-700">{bestModel.name}</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {bestModel.feature_importances.map((item: any, idx: number) => {
                        const pct = item.percentage ?? Math.round(item.importance * 100);
                        return (
                          <div key={idx} className="group p-3 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/40 border border-slate-100 transition-all">
                            <div className="flex justify-between items-center mb-1.5 text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-black text-[10px] flex items-center justify-center font-mono">{idx + 1}</span>
                                <span className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{item.feature}</span>
                              </div>
                              <span className="font-mono font-black text-indigo-600 text-sm">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500 group-hover:from-indigo-600 group-hover:to-purple-600"
                                style={{ width: `${Math.max(pct, 3)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* COMPARISON TABLE */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight">Model Comparison</h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {data.problem_type === 'classification'
                          ? 'Complete Evaluation Metrics: Accuracy, Precision, Recall, F1, ROC-AUC & Overfitting/Underfitting Diagnosis'
                          : data.problem_type === 'regression'
                          ? 'Complete Evaluation Metrics: R², MAE, MSE, RMSE & Overfitting/Underfitting Diagnosis'
                          : 'Unsupervised Cluster Evaluation Metrics'}
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Model</th>
                          {data.problem_type === 'classification' ? (
                            <>
                              <th className="px-4 py-4 text-left text-[11px] font-black text-slate-700 uppercase tracking-widest">Accuracy</th>
                              <th className="px-4 py-4 text-left text-[11px] font-black text-indigo-600 uppercase tracking-widest">CV Accuracy</th>
                              <th className="px-4 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Precision</th>
                              <th className="px-4 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Recall</th>
                              <th className="px-4 py-4 text-left text-[11px] font-black text-indigo-500 uppercase tracking-widest">F1</th>
                              <th className="px-4 py-4 text-left text-[11px] font-black text-purple-500 uppercase tracking-widest">ROC-AUC</th>
                              <th className="px-4 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Gap</th>
                            </>
                          ) : data.problem_type === 'regression' ? (
                            <>
                              <th className="px-4 py-4 text-left text-[11px] font-black text-slate-700 uppercase tracking-widest">R² (Train)</th>
                              <th className="px-4 py-4 text-left text-[11px] font-black text-indigo-600 uppercase tracking-widest">CV R²</th>
                              <th className="px-4 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">MAE</th>
                              <th className="px-4 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">MSE</th>
                              <th className="px-4 py-4 text-left text-[11px] font-black text-indigo-500 uppercase tracking-widest">RMSE</th>
                              <th className="px-4 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Gap</th>
                            </>
                          ) : (
                            <>
                              <th className="px-6 py-4 text-left text-[11px] font-black text-slate-700 uppercase tracking-widest">Silhouette</th>
                              <th className="px-6 py-4 text-left text-[11px] font-black text-indigo-600 uppercase tracking-widest">Calinski-Harabasz</th>
                              <th className="px-6 py-4 text-left text-[11px] font-black text-purple-600 uppercase tracking-widest">Davies-Bouldin</th>
                            </>
                          )}
                          <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Fit Diagnosis</th>
                          <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Decision</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                        {allModels.sort((a,b) => (b.cv_score || b.main_score || 0) - (a.cv_score || a.main_score || 0)).map((m, i) => {
                          const isBest = m.model_id === bestModel?.model_id;
                          const trainPct = (m.main_score <= 1 && m.main_score >= 0) ? `${(m.main_score * 100).toFixed(1)}%` : m.main_score.toFixed(3);
                          const cvPct = (m.cv_score !== undefined && m.cv_score <= 1 && m.cv_score >= 0) ? `${(m.cv_score * 100).toFixed(1)}%` : (m.cv_score !== undefined ? m.cv_score.toFixed(3) : '-');
                          const gapVal = m.generalization_gap !== undefined ? m.generalization_gap : (m.main_score - (m.cv_score || m.main_score));
                          const gapPct = Math.abs(gapVal) <= 1 ? `${(gapVal * 100).toFixed(1)}%` : gapVal.toFixed(3);

                          return (
                            <tr key={i} className={`transition-colors ${isBest ? 'bg-indigo-50/30' : 'hover:bg-slate-50/80'}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-[15px] font-bold ${isBest ? 'text-indigo-900' : 'text-slate-700'}`}>{m.name}</span>
                                {isBest && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-100 text-indigo-700 uppercase tracking-widest shadow-sm">★ Best</span>}
                              </td>
                              {data.problem_type === 'classification' ? (
                                <>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700 font-bold">{trainPct}</td>
                                  <td className="px-4 py-4 whitespace-nowrap text-[15px] font-black text-indigo-600">{cvPct}</td>
                                  <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                                    {m.metrics?.precision !== undefined ? `${(m.metrics.precision * 100).toFixed(1)}%` : '-'}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                                    {m.metrics?.recall !== undefined ? `${(m.metrics.recall * 100).toFixed(1)}%` : '-'}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-xs text-indigo-600 font-bold">
                                    {m.metrics?.f1 !== undefined ? `${(m.metrics.f1 * 100).toFixed(1)}%` : '-'}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-xs text-purple-600 font-medium">
                                    {m.metrics?.roc_auc !== undefined ? `${(m.metrics.roc_auc * 100).toFixed(1)}%` : '-'}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-xs">
                                    <span className={`px-2 py-0.5 rounded font-semibold ${
                                      gapVal > 0.15 ? 'text-red-700 bg-red-50 border border-red-200' :
                                      gapVal > 0.08 ? 'text-yellow-800 bg-yellow-50 border border-yellow-200' :
                                      'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                    }`}>
                                      {gapVal > 0 ? `+${gapPct}` : gapPct}
                                    </span>
                                  </td>
                                </>
                              ) : data.problem_type === 'regression' ? (
                                <>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700 font-bold">{m.main_score?.toFixed(4)}</td>
                                  <td className="px-4 py-4 whitespace-nowrap text-[15px] font-black text-indigo-600">{m.cv_score?.toFixed(4) || '-'}</td>
                                  <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">{m.metrics?.mae !== undefined ? m.metrics.mae.toFixed(4) : '-'}</td>
                                  <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">{m.metrics?.mse !== undefined ? m.metrics.mse.toFixed(4) : '-'}</td>
                                  <td className="px-4 py-4 whitespace-nowrap text-xs text-indigo-600 font-bold">{m.metrics?.rmse !== undefined ? m.metrics.rmse.toFixed(4) : '-'}</td>
                                  <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">{gapVal?.toFixed(4) || '-'}</td>
                                </>
                              ) : (
                                <>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-bold">{m.main_score?.toFixed(4)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-xs text-indigo-600">{m.metrics?.calinski_harabasz !== undefined ? m.metrics.calinski_harabasz.toFixed(2) : '-'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-xs text-purple-600">{m.metrics?.davies_bouldin !== undefined ? m.metrics.davies_bouldin.toFixed(4) : '-'}</td>
                                </>
                              )}
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1 shadow-sm ${
                                  m.status?.includes('Severe Overfitting') ? 'bg-red-50 text-red-700 border border-red-200' :
                                  m.status?.includes('Overfitting') ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                                  m.status?.includes('Underfitting') ? 'bg-red-50 text-red-700 border border-red-200' :
                                  m.status?.includes('Good') || m.status?.includes('Excellent') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {m.status || 'Trained'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {isBest ? (
                                  <span className="text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">★ Selected</span>
                                ) : (
                                  <span className="text-slate-400 text-xs font-medium">Alternative</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* PREDICTION SECTION */}
                <div className="pt-6">
                  <div className="flex items-center mb-8 space-x-6">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight text-center uppercase">Test The Model</h3>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>
                  
                  <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-[0_8px_40px_rgb(0,0,0,0.04)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
                    
                    <p className="text-slate-500 mb-10 text-center max-w-2xl mx-auto font-medium text-[15px]">
                      Adjust the feature values below and run them through the trained <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">{bestModel?.name}</span> pipeline to generate a real-time prediction.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 mb-12 relative z-10">
                      {data.features.map((feature: string) => (
                        <div key={feature} className="group">
                          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-indigo-500 transition-colors">{feature}</label>
                          <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-medium focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none shadow-sm"
                            value={featureInputs[feature] || ''}
                            onChange={(e) => setFeatureInputs({...featureInputs, [feature]: e.target.value})}
                            placeholder={`Enter ${feature}...`}
                          />
                        </div>
                      ))}
                    </div>

                    {predictError && (
                      <div className="mb-10 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-2xl text-center animate-in zoom-in-95 duration-200 flex items-center justify-center gap-2 shadow-sm">
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        {predictError}
                      </div>
                    )}

                    <div className="flex justify-center mb-10 relative z-10">
                      <button 
                        onClick={handlePredict}
                        disabled={isPredicting}
                        className={`px-12 py-4 rounded-2xl font-black text-[15px] transition-all duration-300 transform active:scale-95 flex items-center space-x-3
                          ${isPredicting 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                            : 'bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-[0_8px_30px_rgb(79,70,229,0.3)] shadow-xl shadow-slate-900/10'
                          }
                        `}
                      >
                        {isPredicting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div>
                            <span>Running Pipeline...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            <span>Generate Prediction</span>
                          </>
                        )}
                      </button>
                    </div>

                    {predictionResult && (
                      <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 relative z-10 mt-6">
                        <div className="max-w-md mx-auto bg-gradient-to-b from-white to-slate-50 border border-slate-200 rounded-[2rem] p-8 text-center shadow-xl shadow-indigo-900/5 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                          
                          <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mb-3">Pipeline Output</p>
                          <p className="text-5xl font-black text-slate-900 tracking-tight">
                            {predictionResult.prediction}
                          </p>
                          
                          {predictionResult.probability !== undefined && (
                            <div className="mt-8 pt-6 border-t border-slate-200">
                              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Confidence Score</p>
                              <div className="flex items-center justify-center space-x-4">
                                <div className="w-full bg-slate-100 rounded-full h-2.5 max-w-[160px] overflow-hidden shadow-inner">
                                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${predictionResult.probability * 100}%` }}></div>
                                </div>
                                <p className="text-lg font-black text-slate-700">
                                  {(predictionResult.probability * 100).toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* BOTTOM NAVIGATION */}
                <div className="flex justify-between items-center pt-8 border-t border-slate-200 mt-14 pb-12">
                  <button 
                    onClick={() => router.push(`/analysis/${sessionId}/agent-7`)}
                    className="px-8 py-3.5 bg-white text-slate-500 font-bold hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm"
                  >
                    &larr; Back to Model Selection
                  </button>
                  <button 
                    onClick={() => router.push(`/analysis/${sessionId}/agent-8`)}
                    className="px-10 py-3.5 bg-indigo-600 text-white font-black tracking-wide rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 transform hover:scale-105 active:scale-95"
                  >
                    Continue to Agent 8 &rarr;
                  </button>
                </div>
              </>
            )}

          </div>

          {/* RIGHT PANEL - hidden on small screens */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28 bg-white/50 backdrop-blur-xl rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-1">
              <AgentDetailPanel agent={agents[6]} events={mockEvents} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
