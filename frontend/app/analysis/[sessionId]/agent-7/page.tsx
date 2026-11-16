"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { analysisApi, Agent7RecommendResponse, Agent7TrainResponse } from "../../../../lib/api/analysis";
import ReactMarkdown from "react-markdown";

export default function Agent7Page({ params }: { params: Promise<{ sessionId: string }> }) {
  const router = useRouter();
  const { sessionId } = use(params);

  const [recommendData, setRecommendData] = useState<Agent7RecommendResponse | null>(null);
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [isTraining, setIsTraining] = useState(false);
  const [trainProgress, setTrainProgress] = useState<string[]>([]);
  const [trainResult, setTrainResult] = useState<Agent7TrainResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [sessionId]);

  const loadRecommendations = async () => {
    try {
      const res = await analysisApi.agent7Recommend(sessionId);
      setRecommendData(res);
      // Pre-select AI recommended models
      const initialSelection = new Set<string>();
      res.ai_recommended_models.forEach(m => {
        if (res.compatible_models.includes(m.name)) {
          initialSelection.add(m.name);
        }
      });
      setSelectedModels(initialSelection);
    } catch (err: any) {
      setError(err.message || "Failed to load Agent 7 data");
    }
  };

  const toggleModel = (modelName: string) => {
    const newSet = new Set(selectedModels);
    if (newSet.has(modelName)) {
      newSet.delete(modelName);
    } else {
      newSet.add(modelName);
    }
    setSelectedModels(newSet);
  };

  const startTraining = async () => {
    if (selectedModels.size === 0) return;
    setIsTraining(true);
    setTrainResult(null); // Reset so the UI goes back to training mode
    setTrainProgress(["✓ Preparing data", "✓ Building preprocessing pipeline", "● Training models..."]);
    
    try {
      const res = await analysisApi.agent7Train(sessionId, Array.from(selectedModels));
      setTrainResult(res);
      setTrainProgress(prev => [...prev.slice(0, 2), "✓ Models trained successfully!", "✓ Evaluated models", "✓ Selected best model"]);
    } catch (err: any) {
      setError(err.message || "Training failed");
    } finally {
      setIsTraining(false);
    }
  };

  const handleDownload = (modelId: string) => {
    window.location.href = analysisApi.getAgent7DownloadUrl(sessionId, modelId);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-gray-900">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-md text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold border border-red-200">
            !
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Agent 7 Error</h2>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <button 
            onClick={() => router.push(`/analysis/${sessionId}/agent-6`)} 
            className="w-full px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-semibold transition"
          >
            ← Back to Agent 6
          </button>
        </div>
      </div>
    );
  }

  if (!recommendData) {
    return (
      <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-gray-600 font-medium text-sm">Agent 7: Analyzing dataset and generating model recommendations...</p>
      </div>
    );
  }

  const isSupervised = recommendData.learning_type === "supervised";

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              MODEL TRAINING
            </h1>
            <p className="text-gray-500 text-sm mt-1">Agent 7 AutoML & Performance Benchmarking</p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
            <span className="text-emerald-600 font-medium">A1-A6 ✓</span>
            <span>→</span>
            <span className="text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">Agent 7 ●</span>
            <span>→</span>
            <span className="text-gray-400">Agent 8</span>
          </div>
        </div>

        {!trainResult ? (
          /* PRE-TRAINING UI */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-1 space-y-6">
              {/* ML Problem Summary */}
              <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold mb-4 border-b border-gray-100 pb-2 text-gray-900">ML PROBLEM</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs uppercase font-semibold block mb-1">Learning Type</span>
                    <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-md capitalize font-semibold">
                      {recommendData.learning_type}
                    </span>
                  </div>
                  {isSupervised && (
                    <div>
                      <span className="text-gray-500 text-xs uppercase font-semibold block mb-1">Problem Type</span>
                      <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-md capitalize font-semibold">
                        {recommendData.problem_type}
                      </span>
                    </div>
                  )}
                  {isSupervised && (
                    <div>
                      <span className="text-gray-500 text-xs uppercase font-semibold block mb-1">Target (Y)</span>
                      <span className="font-mono font-bold bg-gray-100 text-gray-900 px-2.5 py-1 rounded-md">
                        {recommendData.target}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 text-xs uppercase font-semibold block mb-1">Features (X)</span>
                    <span className="text-gray-800 font-medium">{recommendData.features.length} selected features</span>
                  </div>
                </div>
              </div>

              {/* Training Progress (if active) */}
              {isTraining && (
                <div className="bg-blue-50/70 border border-blue-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-lg font-bold mb-4 text-blue-900 flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    Training in Progress
                  </h3>
                  <div className="space-y-2 font-mono text-xs text-gray-700">
                    {trainProgress.map((p, i) => (
                      <div key={i} className={p.startsWith("●") ? "text-blue-700 font-bold animate-pulse" : ""}>{p}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              {/* AI Recommended Models */}
              <div className="bg-emerald-50/70 border border-emerald-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold mb-4 text-emerald-950 flex items-center gap-2">
                  <span>✨</span> AI RECOMMENDED MODELS
                </h3>
                <div className="space-y-4">
                  {recommendData.ai_recommended_models.map((m, i) => {
                    const isSelected = selectedModels.has(m.name);
                    return (
                      <div 
                        key={i} 
                        className={`bg-white p-4 rounded-xl border transition-all ${
                          isSelected ? 'border-emerald-500 shadow-sm' : 'border-gray-200 opacity-80'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-gray-900 text-md">★ {m.name}</h4>
                          <button 
                            onClick={() => !isTraining && toggleModel(m.name)}
                            disabled={isTraining}
                            className={`text-xs px-3 py-1 rounded-md font-semibold transition-colors ${
                              isSelected 
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isSelected ? '✓ Selected' : '+ Add'}
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{m.reason}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* User Model Selection */}
              <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold mb-2 text-gray-900">USER MODEL SELECTION</h3>
                <p className="text-sm text-gray-500 mb-4">Select the models you want to train and compare. AI recommendations are pre-selected.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {recommendData.compatible_models.map(modelName => {
                    const isSelected = selectedModels.has(modelName);
                    const isRecommended = recommendData.ai_recommended_models.some(m => m.name === modelName);
                    return (
                      <div 
                        key={modelName}
                        onClick={() => !isTraining && toggleModel(modelName)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-center
                          ${isTraining ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
                          ${isSelected ? 'bg-blue-50/80 border-blue-400 shadow-xs' : 'bg-white border-gray-200'}
                        `}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-400 bg-white'
                          }`}>
                            {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <span className={`text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                            {modelName}
                          </span>
                        </div>
                        {isRecommended && (
                          <span className="text-[10px] text-emerald-700 font-bold ml-6 mt-1">
                            AI Recommended
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* POST-TRAINING UI */
          <div className="space-y-8">
            {/* Final Best Model or No Reliable Model */}
            {trainResult.is_reliable && trainResult.best_model ? (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-blue-50 border border-emerald-300 p-8 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-8xl select-none text-emerald-900">🏆</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-800 font-bold text-xs bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    ★ Best Model Selected
                  </span>
                  <span className="text-gray-600 text-xs font-mono uppercase font-semibold">
                    ({recommendData.problem_type || recommendData.learning_type})
                  </span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 tracking-tight">
                  {trainResult.best_model.name}
                </h3>
                
                {/* Dynamic Evaluation Metrics Cards based on Classification / Regression */}
                {recommendData.problem_type === 'classification' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                    <div className="bg-white border border-emerald-200 p-3.5 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Accuracy</div>
                      <div className="text-2xl font-mono font-black text-gray-900">{(trainResult.best_model.main_score * 100).toFixed(1)}%</div>
                      <div className="text-[10px] text-gray-500 font-mono">({trainResult.best_model.main_score.toFixed(4)})</div>
                    </div>
                    <div className="bg-white border border-blue-200 p-3.5 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">CV Accuracy</div>
                      <div className="text-2xl font-mono font-black text-blue-900">{(trainResult.best_model.cv_score * 100).toFixed(1)}%</div>
                      <div className="text-[10px] text-blue-600 font-mono">({trainResult.best_model.cv_score.toFixed(4)})</div>
                    </div>
                    <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Precision</div>
                      <div className="text-xl font-mono font-bold text-gray-900">
                        {trainResult.best_model.metrics?.precision !== undefined ? `${(trainResult.best_model.metrics.precision * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Recall</div>
                      <div className="text-xl font-mono font-bold text-gray-900">
                        {trainResult.best_model.metrics?.recall !== undefined ? `${(trainResult.best_model.metrics.recall * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-white border border-indigo-200 p-3.5 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-1">F1 Score</div>
                      <div className="text-xl font-mono font-bold text-indigo-900">
                        {trainResult.best_model.metrics?.f1 !== undefined ? `${(trainResult.best_model.metrics.f1 * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-white border border-purple-200 p-3.5 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-1">ROC-AUC</div>
                      <div className="text-xl font-mono font-bold text-purple-900">
                        {trainResult.best_model.metrics?.roc_auc !== undefined ? `${(trainResult.best_model.metrics.roc_auc * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Fit Diagnosis</div>
                      <div className={`text-xs font-bold mt-1 ${
                        trainResult.best_model.status.includes('Severe Overfitting') ? 'text-rose-600' : 
                        trainResult.best_model.status.includes('Overfitting') ? 'text-amber-600' : 
                        trainResult.best_model.status.includes('Underfitting') ? 'text-rose-600' : 'text-emerald-700'
                      }`}>
                        {trainResult.best_model.status}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-1">
                        Gap: {trainResult.best_model.generalization_gap !== undefined ? `+${(trainResult.best_model.generalization_gap * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                ) : recommendData.problem_type === 'regression' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                    <div className="bg-white border border-emerald-200 p-3.5 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">R² (Train)</div>
                      <div className="text-2xl font-mono font-black text-gray-900">{trainResult.best_model.main_score.toFixed(4)}</div>
                    </div>
                    <div className="bg-white border border-blue-200 p-3.5 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">CV R² Score</div>
                      <div className="text-2xl font-mono font-black text-blue-900">{trainResult.best_model.cv_score?.toFixed(4) || 'N/A'}</div>
                    </div>
                    <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">MAE</div>
                      <div className="text-xl font-mono font-bold text-gray-900">
                        {trainResult.best_model.metrics?.mae !== undefined ? trainResult.best_model.metrics.mae.toFixed(4) : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">MSE</div>
                      <div className="text-xl font-mono font-bold text-gray-900">
                        {trainResult.best_model.metrics?.mse !== undefined ? trainResult.best_model.metrics.mse.toFixed(4) : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-white border border-indigo-200 p-3.5 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-1">RMSE</div>
                      <div className="text-xl font-mono font-bold text-indigo-900">
                        {trainResult.best_model.metrics?.rmse !== undefined ? trainResult.best_model.metrics.rmse.toFixed(4) : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-white border border-purple-200 p-3.5 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-1">Gen Gap</div>
                      <div className="text-xl font-mono font-bold text-purple-900">
                        {trainResult.best_model.generalization_gap?.toFixed(4) || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Fit Diagnosis</div>
                      <div className={`text-xs font-bold mt-1 ${
                        trainResult.best_model.status.includes('Severe Overfitting') ? 'text-rose-600' : 
                        trainResult.best_model.status.includes('Overfitting') ? 'text-amber-600' : 
                        trainResult.best_model.status.includes('Underfitting') ? 'text-rose-600' : 'text-emerald-700'
                      }`}>
                        {trainResult.best_model.status}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-emerald-200 p-4 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Silhouette Score</div>
                      <div className="text-2xl font-mono font-black text-gray-900">{trainResult.best_model.main_score.toFixed(4)}</div>
                    </div>
                    <div className="bg-white border border-blue-200 p-4 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">Calinski-Harabasz</div>
                      <div className="text-xl font-mono font-bold text-blue-900">{trainResult.best_model.metrics?.calinski_harabasz !== undefined ? trainResult.best_model.metrics.calinski_harabasz.toFixed(2) : 'N/A'}</div>
                    </div>
                    <div className="bg-white border border-purple-200 p-4 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-1">Davies-Bouldin</div>
                      <div className="text-xl font-mono font-bold text-purple-900">{trainResult.best_model.metrics?.davies_bouldin !== undefined ? trainResult.best_model.metrics.davies_bouldin.toFixed(4) : 'N/A'}</div>
                    </div>
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
                      <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Fit Status</div>
                      <div className="text-lg font-bold text-emerald-700 mt-1">{trainResult.best_model.status}</div>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex gap-4">
                  <button 
                    onClick={() => handleDownload(trainResult.best_model.model_id)} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow flex items-center gap-2"
                  >
                    <span>↓</span> Download Best Model (.pkl)
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/70 border border-amber-300 p-8 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl select-none text-amber-900">⚠</div>
                <h2 className="text-amber-800 font-bold text-xs tracking-wider mb-2 uppercase">⚠ NO RELIABLE MODEL FOUND</h2>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Best Available Model: {trainResult.best_model?.name || "None"}</h3>
                
                {trainResult.best_model && (
                  <div className="flex flex-wrap gap-8 mb-6">
                    <div>
                      <div className="text-gray-500 text-sm mb-1">Main Score</div>
                      <div className="text-3xl font-mono font-bold text-gray-900">
                        {(trainResult.best_model.main_score * 100).toFixed(1)}%
                      </div>
                    </div>
                    {isSupervised && (
                      <>
                        <div>
                          <div className="text-gray-500 text-sm mb-1">CV Score</div>
                          <div className="text-3xl font-mono font-bold text-gray-900">
                            {(trainResult.best_model.cv_score * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-sm mb-1">Gap</div>
                          <div className="text-xl font-mono text-gray-700 mt-2">
                            {trainResult.best_model.generalization_gap?.toFixed(3) || "N/A"}
                          </div>
                        </div>
                      </>
                    )}
                    <div>
                      <div className="text-gray-500 text-sm mb-1">Status</div>
                      <div className="text-xl font-bold mt-1 text-rose-600">
                        {trainResult.best_model.status}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="text-gray-700 mb-6 text-sm max-w-2xl leading-relaxed">
                  No evaluated model achieved reliable validation performance on this dataset. This could be due to noise, weak predictive features, or extreme target difficulty. You can proceed with the best available model, try training again, or review your ML preparation in Agent 6.
                </div>
                
                <div className="flex gap-4">
                  <button onClick={startTraining} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                    ↻ Try Training Again
                  </button>
                  <button onClick={() => router.push(`/analysis/${sessionId}/agent-6`)} className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition border border-gray-300">
                    ← Review ML Preparation (Agent 6)
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Model Comparison Table */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">MODEL COMPARISON</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {recommendData.problem_type === 'classification' 
                        ? 'Evaluation Metrics: Accuracy, Precision, Recall, F1, ROC-AUC & Fit Diagnosis'
                        : recommendData.problem_type === 'regression'
                        ? 'Evaluation Metrics: R², MAE, MSE, RMSE & Fit Diagnosis'
                        : 'Evaluation Metrics: Silhouette, Calinski-Harabasz, Davies-Bouldin'}
                    </p>
                  </div>
                  {trainResult.trained_models.some((m: any) => m.is_fallback) && (
                    <span className="text-xs text-blue-800 bg-blue-50 border border-blue-200 px-2 py-1 rounded-md font-semibold">
                      ⚡ Auto-fallback models added
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-600 bg-gray-50 uppercase font-semibold border-b border-gray-200">
                      <tr>
                        <th className="px-5 py-3.5">Model</th>
                        {recommendData.problem_type === 'classification' ? (
                          <>
                            <th className="px-4 py-3.5">Accuracy</th>
                            <th className="px-4 py-3.5 text-blue-700">CV Accuracy</th>
                            <th className="px-4 py-3.5">Precision</th>
                            <th className="px-4 py-3.5">Recall</th>
                            <th className="px-4 py-3.5">F1</th>
                            <th className="px-4 py-3.5">ROC-AUC</th>
                            <th className="px-4 py-3.5">Gap</th>
                          </>
                        ) : recommendData.problem_type === 'regression' ? (
                          <>
                            <th className="px-4 py-3.5">R² (Train)</th>
                            <th className="px-4 py-3.5 text-blue-700">CV R²</th>
                            <th className="px-4 py-3.5">MAE</th>
                            <th className="px-4 py-3.5">MSE</th>
                            <th className="px-4 py-3.5">RMSE</th>
                            <th className="px-4 py-3.5">Gap</th>
                          </>
                        ) : (
                          <>
                            <th className="px-5 py-3.5">Silhouette</th>
                            <th className="px-5 py-3.5">Calinski-Harabasz</th>
                            <th className="px-5 py-3.5">Davies-Bouldin</th>
                          </>
                        )}
                        <th className="px-5 py-3.5">Fit Diagnosis</th>
                        <th className="px-5 py-3.5">Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {trainResult.trained_models.sort((a: any,b: any) => (b.cv_score ?? b.main_score) - (a.cv_score ?? a.main_score)).map((m: any) => {
                        const isBest = m.model_id === trainResult.best_model?.model_id;
                        const trainPct = (m.main_score <= 1 && m.main_score >= 0) ? `${(m.main_score * 100).toFixed(1)}%` : m.main_score.toFixed(3);
                        const cvPct = (m.cv_score !== undefined && m.cv_score <= 1 && m.cv_score >= 0) ? `${(m.cv_score * 100).toFixed(1)}%` : (m.cv_score !== undefined ? m.cv_score.toFixed(3) : '-');
                        const gapVal = m.generalization_gap !== undefined ? m.generalization_gap : (m.main_score - (m.cv_score ?? m.main_score));
                        const gapPct = (Math.abs(gapVal) <= 1) ? `${(gapVal * 100).toFixed(1)}%` : gapVal.toFixed(3);
                        
                        return (
                          <tr key={m.model_id} className={`transition-colors ${isBest ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600 font-semibold' : 'hover:bg-gray-50'}`}>
                            <td className="px-5 py-4 font-medium text-gray-900">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900">{m.name}</span>
                                {isBest && <span className="text-emerald-800 text-xs bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">★ Best</span>}
                                {m.is_fallback && <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">auto-fallback</span>}
                              </div>
                            </td>
                            {recommendData.problem_type === 'classification' ? (
                              <>
                                <td className="px-4 py-4 font-mono font-bold text-gray-800">{trainPct}</td>
                                <td className="px-4 py-4 font-mono font-black text-blue-700">{cvPct}</td>
                                <td className="px-4 py-4 font-mono text-gray-700 text-xs">
                                  {m.metrics?.precision !== undefined ? `${(m.metrics.precision * 100).toFixed(1)}%` : '-'}
                                </td>
                                <td className="px-4 py-4 font-mono text-gray-700 text-xs">
                                  {m.metrics?.recall !== undefined ? `${(m.metrics.recall * 100).toFixed(1)}%` : '-'}
                                </td>
                                <td className="px-4 py-4 font-mono text-indigo-700 text-xs font-bold">
                                  {m.metrics?.f1 !== undefined ? `${(m.metrics.f1 * 100).toFixed(1)}%` : '-'}
                                </td>
                                <td className="px-4 py-4 font-mono text-purple-700 text-xs">
                                  {m.metrics?.roc_auc !== undefined ? `${(m.metrics.roc_auc * 100).toFixed(1)}%` : '-'}
                                </td>
                                <td className="px-4 py-4 font-mono">
                                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                                    gapVal > 0.15 ? 'text-rose-700 bg-rose-50 border border-rose-200' :
                                    gapVal > 0.08 ? 'text-amber-700 bg-amber-50 border border-amber-200' :
                                    'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                  }`}>
                                    {gapVal > 0 ? `+${gapPct}` : gapPct}
                                  </span>
                                </td>
                              </>
                            ) : recommendData.problem_type === 'regression' ? (
                              <>
                                <td className="px-4 py-4 font-mono font-bold text-gray-800">{m.main_score.toFixed(4)}</td>
                                <td className="px-4 py-4 font-mono font-black text-blue-700">{m.cv_score?.toFixed(4) || '-'}</td>
                                <td className="px-4 py-4 font-mono text-gray-700 text-xs">
                                  {m.metrics?.mae !== undefined ? m.metrics.mae.toFixed(4) : '-'}
                                </td>
                                <td className="px-4 py-4 font-mono text-gray-700 text-xs">
                                  {m.metrics?.mse !== undefined ? m.metrics.mse.toFixed(4) : '-'}
                                </td>
                                <td className="px-4 py-4 font-mono text-indigo-700 text-xs font-bold">
                                  {m.metrics?.rmse !== undefined ? m.metrics.rmse.toFixed(4) : '-'}
                                </td>
                                <td className="px-4 py-4 font-mono text-gray-700 text-xs">
                                  {gapVal?.toFixed(4) || '-'}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-5 py-4 font-mono font-bold text-gray-800">{m.main_score.toFixed(4)}</td>
                                <td className="px-5 py-4 font-mono text-blue-700 text-xs">
                                  {m.metrics?.calinski_harabasz !== undefined ? m.metrics.calinski_harabasz.toFixed(2) : '-'}
                                </td>
                                <td className="px-5 py-4 font-mono text-purple-700 text-xs">
                                  {m.metrics?.davies_bouldin !== undefined ? m.metrics.davies_bouldin.toFixed(4) : '-'}
                                </td>
                              </>
                            )}
                            <td className="px-5 py-4">
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1 ${
                                m.status.includes('Severe Overfitting') ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                m.status.includes('Overfitting') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                m.status.includes('Underfitting') ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                m.status.includes('Leakage') ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                m.status.includes('Good') || m.status.includes('Excellent') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}>
                                {m.status}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {isBest ? (
                                <span className="text-emerald-800 font-bold text-xs bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md">★ Selected</span>
                              ) : (
                                <span className="text-gray-400 text-xs font-medium">Alternative</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Explanation — full width, always visible */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🧠</span> AI EXPLANATION & FIT ASSESSMENT
                </h3>
                {trainResult.explanation ? (
                  <div className="text-gray-700 text-sm leading-relaxed space-y-3 prose prose-sm max-w-none">
                    <ReactMarkdown>{trainResult.explanation}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm italic">No explanation available.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => router.push(`/analysis/${sessionId}/agent-6`)}
            disabled={isTraining}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            ← Back to Agent 6
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 font-semibold tracking-wide mb-1">✓ AGENT 7 ML TRAINING</span>
            <div className="flex space-x-4 text-[11px] font-medium text-gray-500">
              <span className="text-emerald-600">Models Selected</span>
              {trainResult && <span className="text-emerald-600">✓ Trained</span>}
            </div>
          </div>

          {!trainResult ? (
            <button 
              onClick={startTraining}
              disabled={isTraining || selectedModels.size === 0}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5
                ${isTraining || selectedModels.size === 0 ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed transform-none' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
              `}
            >
              {isTraining ? 'Training in Progress...' : 'Start Training →'}
            </button>
          ) : (
            <button 
              onClick={() => router.push(`/analysis/${sessionId}/agent-7/result`)}
              className="px-8 py-3 rounded-xl text-sm font-bold transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Continue to Model Evaluation →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
