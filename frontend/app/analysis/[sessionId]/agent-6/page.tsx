"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { analysisApi, Agent6State } from "../../../../lib/api/analysis";

type Step = 'initial' | 'learning_type' | 'xy_selection' | 'processing' | 'completed' | 'error';

export default function Agent6Page({ params }: { params: Promise<{ sessionId: string }> }) {
  const router = useRouter();
  const { sessionId } = use(params);

  const [step, setStep] = useState<Step>('initial');
  const [errorMsg, setErrorMsg] = useState("");
  const [state, setState] = useState<Agent6State | null>(null);
  
  // UI state for selections
  const [target, setTarget] = useState<string>("");
  const [features, setFeatures] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");

  useEffect(() => {
    runInitialAnalysis();
  }, [sessionId]);

  const runInitialAnalysis = async () => {
    try {
      setStep('initial');
      const res = await analysisApi.runAgent6Analyze(sessionId);
      setState(res);
      setStep('learning_type');
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to run ML preparation analysis");
      setStep('error');
    }
  };

  const handleLearningTypeSelection = async (type: "supervised" | "unsupervised") => {
    try {
      setIsSubmitting(true);
      const res = await analysisApi.setAgent6LearningType(sessionId, type);
      setState(res);
      
      if (type === "supervised") {
        if (res.ai_xy_rec) {
          setTarget(res.ai_xy_rec.target || "");
          setFeatures(res.ai_xy_rec.features || []);
        }
        setStep('xy_selection');
      } else {
        // Skip straight to processing for unsupervised
        await handleConfigSubmit(null, res.metadata.columns);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to set learning type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeatureToggle = (col: string) => {
    if (features.includes(col)) {
      setFeatures(features.filter(f => f !== col));
    } else {
      setFeatures([...features, col]);
    }
  };

  const handleConfigSubmit = async (t: string | null = target, f: string[] = features) => {
    try {
      setIsSubmitting(true);
      setStep('processing');
      
      // Simulate real progress steps visually
      setProgress(20);
      setProgressText("Learning Type Analyzed");
      await new Promise(r => setTimeout(r, 600));
      
      setProgress(40);
      setProgressText("Human Configuration Approved");
      await new Promise(r => setTimeout(r, 600));
      
      const res = await analysisApi.setAgent6Config(sessionId, t, f);
      
      setProgress(60);
      setProgressText("Preprocessing Prepared");
      await new Promise(r => setTimeout(r, 600));
      
      setProgress(75);
      setProgressText("Feature Analysis Completed");
      await new Promise(r => setTimeout(r, 600));
      
      setProgress(90);
      setProgressText("Leakage Check Completed");
      await new Promise(r => setTimeout(r, 600));
      
      setProgress(100);
      setProgressText("ML Preparation Completed");
      await new Promise(r => setTimeout(r, 500));
      
      setState(res);
      setStep('completed');
    } catch (err: any) {
      setErrorMsg(err.message || "Validation failed");
      setStep('xy_selection'); // go back to let user fix
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-gray-900">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-md text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold border border-red-200">
            !
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">ML Preparation Failed</h1>
          <p className="text-gray-600 text-sm mb-6">{errorMsg}</p>
          <button 
            onClick={runInitialAnalysis} 
            className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow transition-colors"
          >
            Retry Preparation
          </button>
        </div>
      </div>
    );
  }

  if (step === 'initial' || step === 'processing') {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between mb-3 items-center">
            <span className="text-sm font-medium text-gray-700">
              {step === 'initial' ? "Analyzing Dataset for ML..." : progressText}
            </span>
            <span className="text-sm font-bold text-purple-600">
              {step === 'initial' ? "0%" : `${progress}%`}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div 
              className={`bg-purple-600 h-3 rounded-full transition-all duration-500 ease-out ${step === 'initial' ? 'w-1/4 animate-pulse' : ''}`}
              style={{ width: step === 'initial' ? undefined : `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6 pb-28">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              ML PREPARATION
            </h1>
            <p className="text-gray-500 text-sm mt-1">Agent 6 Learning-Type Selection & Preprocessing Pipeline</p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
            <span className="text-emerald-600 font-medium">Agent 1-5 ✓</span>
            <span>→</span>
            <span className="text-purple-600 font-bold bg-purple-50 px-2.5 py-1 rounded border border-purple-200">Agent 6 ●</span>
            <span>→</span>
            <span className="text-gray-400">Agent 7</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: LEARNING TYPE */}
        {step === 'learning_type' && state?.ai_learning_type_rec && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Select Machine Learning Type</h2>
            
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600"></div>
              <h3 className="text-xs font-bold text-purple-700 mb-1 uppercase tracking-wider">AI Recommendation</h3>
              <div className="text-2xl font-bold text-purple-950 mb-3 capitalize">
                {state.ai_learning_type_rec.learning_type} Learning
              </div>
              <div className="bg-white p-4 rounded-xl border border-purple-100 text-sm text-gray-700 shadow-sm leading-relaxed">
                <span className="font-bold text-gray-900 mb-1 block">Reason:</span>
                {state.ai_learning_type_rec.reason}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <button 
                onClick={() => handleLearningTypeSelection("supervised")}
                disabled={isSubmitting}
                className={`p-6 rounded-2xl border text-left transition-all shadow-sm hover:shadow-md ${
                  state.ai_learning_type_rec.learning_type === 'supervised' 
                    ? 'bg-purple-50/40 border-2 border-purple-500 hover:bg-purple-50/70' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-lg font-bold mb-2 text-gray-900">Supervised Learning</div>
                <div className="text-sm text-gray-600 leading-relaxed">Predict a specific target column (e.g. classification or regression).</div>
              </button>
              
              <button 
                onClick={() => handleLearningTypeSelection("unsupervised")}
                disabled={isSubmitting}
                className={`p-6 rounded-2xl border text-left transition-all shadow-sm hover:shadow-md ${
                  state.ai_learning_type_rec.learning_type === 'unsupervised' 
                    ? 'bg-purple-50/40 border-2 border-purple-500 hover:bg-purple-50/70' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-lg font-bold mb-2 text-gray-900">Unsupervised Learning</div>
                <div className="text-sm text-gray-600 leading-relaxed">Find hidden patterns without a target (e.g. clustering or anomaly detection).</div>
              </button>
            </div>
            
            <div className="mt-8 text-center text-xs text-gray-500 font-medium">
              Note: You cannot mix supervised and unsupervised models later.
            </div>
          </div>
        )}

        {/* STEP 2: X/Y SELECTION */}
        {step === 'xy_selection' && state?.ai_xy_rec && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Configure Supervised Learning</h2>
            
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
              <h3 className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wider">AI Selection Reason</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{state.ai_xy_rec.reason}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Target Selection */}
              <div className="col-span-1">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm h-full">
                  <h3 className="text-md font-bold mb-2 text-purple-700">Target (Y)</h3>
                  <p className="text-xs text-gray-500 mb-4">Select the column you want to predict.</p>
                  
                  <select 
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition shadow-sm"
                  >
                    <option value="">-- Select Target --</option>
                    {state.metadata?.columns.map((col: string) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Feature Selection */}
              <div className="col-span-1 md:col-span-2">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm h-full">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-bold text-blue-700">Features (X)</h3>
                    <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full border border-blue-200">
                      {features.length} selected
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Select the input columns to use for prediction.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-2">
                    {state.metadata?.columns.filter((c: string) => c !== target).map((col: string) => (
                      <label 
                        key={col} 
                        className={`flex items-center p-2.5 rounded-xl border cursor-pointer transition-all ${
                          features.includes(col) 
                            ? 'bg-blue-50/70 border-blue-300 text-blue-900 shadow-xs' 
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={features.includes(col)}
                          onChange={() => handleFeatureToggle(col)}
                          className="mr-3 accent-blue-600 rounded"
                        />
                        <span className="text-sm font-medium truncate" title={col}>{col}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button 
                onClick={() => setStep('learning_type')}
                className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleConfigSubmit()}
                disabled={isSubmitting || !target || features.length === 0}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition"
              >
                Approve X / Y
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: COMPLETED SUMMARY */}
        {step === 'completed' && state && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">REVIEW ML CONFIGURATION</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* General Summary */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 border-b border-gray-100 pb-2 text-gray-900">Configuration Overview</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs font-semibold uppercase block mb-1">Learning Type</span>
                    <span className="text-lg font-bold capitalize text-purple-700">{state.learning_type}</span>
                  </div>
                  
                  {state.learning_type === 'supervised' ? (
                    <>
                      <div>
                        <span className="text-gray-500 text-xs font-semibold uppercase block mb-1">Target (Y)</span>
                        <span className="text-sm font-mono font-bold bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-1 rounded-md">
                          {state.target}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs font-semibold uppercase block mb-1">Features Selected</span>
                        <span className="text-md font-semibold text-gray-800">{state.features.length} Columns</span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <span className="text-gray-500 text-xs font-semibold uppercase block mb-1">Recommended Tasks</span>
                      <span className="text-md font-semibold text-gray-800">Clustering, Dimensionality Reduction</span>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-gray-500 text-xs font-semibold uppercase block mb-1">Status</span>
                    <span className="text-sm font-bold text-emerald-600 flex items-center mt-1">
                      <span className="mr-2">✓</span> Ready for Model Selection
                    </span>
                  </div>
                </div>
              </div>

              {/* Preprocessing & Checks */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 border-b border-gray-100 pb-2 text-gray-900">Pipeline Preparation</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Numeric Features</span>
                      <span className="font-semibold text-gray-900">{state.preprocessing.numeric_features.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Categorical Features</span>
                      <span className="font-semibold text-gray-900">{state.preprocessing.categorical_features.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Numeric Scaler</span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-800 font-semibold">{state.preprocessing.numeric_scaler}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Categorical Encoder</span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-800 font-semibold">{state.preprocessing.categorical_encoder}</span>
                    </div>
                  </div>
                </div>

                {state.learning_type === 'supervised' && (
                  <div className={`border rounded-2xl p-6 shadow-sm ${
                    state.imbalance.detected || state.leakage.length > 0 
                      ? 'bg-amber-50/60 border-amber-200' 
                      : 'bg-white border-gray-200'
                  }`}>
                    <h3 className="text-lg font-bold mb-4 border-b border-gray-100 pb-2 text-gray-900">Safety Checks</h3>
                    
                    <div className="mb-4">
                      <span className="text-gray-500 text-xs font-semibold uppercase block mb-1">Class Imbalance</span>
                      {state.imbalance.detected ? (
                        <div className="text-amber-800 text-sm font-medium flex items-start mt-1">
                          <span className="mr-2">⚠</span> 
                          <span>{state.imbalance.reason}</span>
                        </div>
                      ) : (
                        <div className="text-emerald-700 text-sm font-semibold">✓ {state.imbalance.reason}</div>
                      )}
                    </div>
                    
                    <div>
                      <span className="text-gray-500 text-xs font-semibold uppercase block mb-1">Data Leakage</span>
                      {state.leakage.length > 0 ? (
                        <div className="space-y-2">
                          {state.leakage.map((l: any, i: number) => (
                            <div key={i} className="text-amber-800 text-sm flex items-start font-medium">
                              <span className="mr-2">⚠</span> 
                              <span><strong>{l.feature}</strong>: {l.reason}</span>
                            </div>
                          ))}
                          <div className="text-xs text-amber-700 mt-2 font-medium">Requires human review before continuing.</div>
                        </div>
                      ) : (
                        <div className="text-emerald-700 text-sm font-semibold">✓ No obvious target leakage detected.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      {(step === 'learning_type' || step === 'completed') && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <button 
              onClick={() => {
                if (step === 'completed') {
                  setStep('learning_type'); // Allow modification
                } else {
                  router.push(`/analysis/${sessionId}/agent-5`);
                }
              }}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← {step === 'completed' ? 'Modify Configuration' : 'Back to Agent 5'}
            </button>
            
            {step === 'completed' && (
              <button 
                onClick={() => router.push(`/analysis/${sessionId}/agent-7`)}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Continue to Model Selection →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
