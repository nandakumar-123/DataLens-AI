"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { analysisApi, Agent4AnalyzeResponse } from "../../../../lib/api/analysis";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function Agent4Page({ params }: { params: Promise<{ sessionId: string }> }) {
  const router = useRouter();
  const { sessionId } = use(params);

  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("Agent 4 Started");
  const [results, setResults] = useState<Agent4AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runAnalysis();
  }, [sessionId]);

  const runAnalysis = async () => {
    try {
      setProgress(20);
      setProgressText("Dataset Loaded");
      
      const res = await analysisApi.runAgent4Analyze(sessionId);
      
      setProgress(40);
      setProgressText("Descriptive Statistics Completed");
      
      setTimeout(() => {
        setProgress(60);
        setProgressText("Correlation Analysis Completed");
      }, 500);
      
      setTimeout(() => {
        setProgress(75);
        setProgressText("Hypothesis Testing Completed");
      }, 1000);
      
      setTimeout(() => {
        setProgress(100);
        setProgressText("Agent 4 Completed");
        setResults(res);
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || "An error occurred during statistical analysis");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-gray-900">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-md text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold border border-red-200">
            !
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analysis Failed</h1>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <button 
            onClick={() => { setError(null); runAnalysis(); }} 
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition-colors"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between mb-3 items-center">
            <span className="text-sm font-medium text-gray-700">{progressText}</span>
            <span className="text-sm font-bold text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  const sigTests = results.hypothesis_tests.filter(t => t.significant).length;

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6 pb-28">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              STATISTICS & RESEARCH
            </h1>
            <p className="text-gray-500 text-sm mt-1">Agent 4 Analysis & Statistical Verification</p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
            <span className="text-emerald-600 font-medium">Agent 1 ✓</span>
            <span>→</span>
            <span className="text-emerald-600 font-medium">Agent 2 ✓</span>
            <span>→</span>
            <span className="text-emerald-600 font-medium">Agent 3 ✓</span>
            <span>→</span>
            <span className="text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded border border-blue-200">Agent 4 ●</span>
            <span>→</span>
            <span className="text-gray-400">Agent 5</span>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Rows</div>
            <div className="text-2xl font-bold text-gray-900">{results.rows.toLocaleString()}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Numerical / Categorical</div>
            <div className="text-2xl font-bold text-gray-900">{results.numerical_count} / {results.categorical_count}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Significant Tests</div>
            <div className="text-2xl font-bold text-emerald-600">{sigTests}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Strong Correlations</div>
            <div className="text-2xl font-bold text-indigo-600">
              {results.correlations.strongest_positive.length + results.correlations.strongest_negative.length}
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-6 mb-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
          <h2 className="text-lg font-semibold text-blue-950 mb-2 flex items-center">
            <span className="mr-2">✨</span> AI Statistical Summary
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{results.ai_summary}</p>
        </div>

        {/* Statistics Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8 shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Descriptive Statistics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100/70 border-b border-gray-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">Column</th>
                  <th className="px-4 py-3">Count</th>
                  <th className="px-4 py-3">Mean</th>
                  <th className="px-4 py-3">Median</th>
                  <th className="px-4 py-3">Std Dev</th>
                  <th className="px-4 py-3">Min</th>
                  <th className="px-4 py-3">Max</th>
                  <th className="px-4 py-3">Skewness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {results.descriptive.map((stat, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">{stat.column}</td>
                    <td className="px-4 py-3">{stat.count}</td>
                    <td className="px-4 py-3 font-mono">{stat.mean !== null ? stat.mean.toFixed(2) : 'N/A'}</td>
                    <td className="px-4 py-3 font-mono">{stat.median !== null ? stat.median.toFixed(2) : 'N/A'}</td>
                    <td className="px-4 py-3 font-mono">{stat.std !== null ? stat.std.toFixed(2) : 'N/A'}</td>
                    <td className="px-4 py-3 font-mono">{stat.min !== null ? stat.min.toFixed(2) : 'N/A'}</td>
                    <td className="px-4 py-3 font-mono">{stat.max !== null ? stat.max.toFixed(2) : 'N/A'}</td>
                    <td className="px-4 py-3 font-mono">{stat.skewness !== null ? stat.skewness.toFixed(2) : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Correlations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Correlation Heatmap</h2>
            {results.correlations.z && results.correlations.z.length > 0 ? (
              <div className="w-full overflow-hidden h-[400px]">
                <Plot
                  data={[
                    {
                      z: results.correlations.z,
                      x: results.correlations.x,
                      y: results.correlations.y,
                      type: 'heatmap',
                      colorscale: 'RdBu',
                      zmin: -1,
                      zmax: 1
                    }
                  ]}
                  layout={{
                    margin: { t: 10, l: 120, b: 120, r: 10 },
                    paper_bgcolor: '#ffffff',
                    plot_bgcolor: '#ffffff',
                    font: { color: '#374151', size: 12 },
                    xaxis: { tickangle: 45 },
                  }}
                  config={{ responsive: true, displayModeBar: false }}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="text-gray-400 h-32 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                Not enough numerical columns for correlation
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-md font-semibold text-gray-900 mb-3">Strongest Positive</h2>
              <div className="space-y-2">
                {results.correlations.strongest_positive.map((corr, i) => (
                  <div key={i} className="flex justify-between items-center text-sm p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                    <span className="text-gray-700 truncate pr-2 font-medium" title={`${corr.feature_a} ↔ ${corr.feature_b}`}>
                      {corr.feature_a} ↔ {corr.feature_b}
                    </span>
                    <span className="text-emerald-700 font-bold font-mono">{corr.correlation}</span>
                  </div>
                ))}
                {results.correlations.strongest_positive.length === 0 && (
                  <div className="text-gray-400 text-sm bg-gray-50 p-3 rounded text-center">None found</div>
                )}
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-md font-semibold text-gray-900 mb-3">Strongest Negative</h2>
              <div className="space-y-2">
                {results.correlations.strongest_negative.map((corr, i) => (
                  <div key={i} className="flex justify-between items-center text-sm p-2.5 bg-rose-50/60 border border-rose-100 rounded-lg">
                    <span className="text-gray-700 truncate pr-2 font-medium" title={`${corr.feature_a} ↔ ${corr.feature_b}`}>
                      {corr.feature_a} ↔ {corr.feature_b}
                    </span>
                    <span className="text-rose-700 font-bold font-mono">{corr.correlation}</span>
                  </div>
                ))}
                {results.correlations.strongest_negative.length === 0 && (
                  <div className="text-gray-400 text-sm bg-gray-50 p-3 rounded text-center">None found</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hypothesis Tests */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Hypothesis Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.hypothesis_tests.map((test, i) => (
              <div 
                key={i} 
                className={`p-5 rounded-xl border transition-all ${
                  test.significant 
                    ? 'bg-emerald-50/40 border-emerald-200 shadow-sm' 
                    : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{test.test_name}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    test.significant 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {test.significant ? 'Significant' : 'Not Sig.'}
                  </span>
                </div>
                <div className="text-md font-bold text-gray-900 mb-1">{test.variables}</div>
                <div className="text-xs text-gray-500 mb-3">{test.groups}</div>
                <div className="flex justify-between text-sm mb-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <span className="text-gray-600 font-medium">p-value:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {test.p_value < 0.001 ? '< 0.001' : test.p_value.toFixed(4)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 border-t border-gray-100 pt-2 mt-2 leading-relaxed">
                  {test.interpretation}
                </div>
              </div>
            ))}
            {results.hypothesis_tests.length === 0 && (
              <div className="col-span-full p-8 text-center text-gray-500 bg-white border border-dashed border-gray-200 rounded-xl">
                No suitable hypothesis tests found for the available columns.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => router.push(`/analysis/${sessionId}/agent-3`)}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back to Agent 3
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 font-semibold tracking-wide mb-1">✓ AGENT 4 COMPLETED</span>
            <div className="flex space-x-4 text-[11px] font-medium text-gray-500">
              <span className="text-emerald-600">Stats ✓</span>
              <span className="text-emerald-600">Correlations ✓</span>
              <span className="text-emerald-600">Tests ✓</span>
            </div>
          </div>

          <button 
            onClick={() => router.push(`/analysis/${sessionId}/agent-5`)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Next: Exploration (Agent 5) →
          </button>
        </div>
      </div>
    </div>
  );
}
