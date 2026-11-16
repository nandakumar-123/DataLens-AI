"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { analysisApi } from "../../../../lib/api/analysis";
import ReactMarkdown from "react-markdown";

export default function Agent5Page({ params }: { params: Promise<{ sessionId: string }> }) {
  const router = useRouter();
  const { sessionId } = use(params);

  const [question, setQuestion] = useState("");
  const [chatLog, setChatLog] = useState<{role: string, content: string}[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) return;
    const q = question.trim();
    setQuestion("");
    setChatLog([...chatLog, { role: "user", content: q }]);
    setIsAsking(true);
    
    try {
      const res = await analysisApi.askAgent4(sessionId, q);
      setChatLog(prev => [...prev, { role: "agent", content: res.answer }]);
    } catch (err: any) {
      setChatLog(prev => [...prev, { role: "agent", content: "Error: " + (err.message || "Failed to get answer") }]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6 pb-28">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              DATA EXPLORATION
            </h1>
            <p className="text-gray-500 text-sm mt-1">Agent 5 Q&A & Interactive Dataset Insights</p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
            <span className="text-emerald-600 font-medium">Agent 1 ✓</span>
            <span>→</span>
            <span className="text-emerald-600 font-medium">Agent 2 ✓</span>
            <span>→</span>
            <span className="text-emerald-600 font-medium">Agent 3 ✓</span>
            <span>→</span>
            <span className="text-emerald-600 font-medium">Agent 4 ✓</span>
            <span>→</span>
            <span className="text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded border border-blue-200">Agent 5 ●</span>
            <span>→</span>
            <span className="text-gray-400">Agent 6</span>
          </div>
        </div>

        {/* Chat / Q&A */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-16 shadow-sm">
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>✨</span> Ask DataLens AI
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Ask natural language questions about patterns, statistics, outliers, or distributions in your dataset.
            </p>
          </div>
          
          <div className="p-6 space-y-6 min-h-[400px] max-h-[600px] overflow-y-auto bg-white">
            {chatLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                <div className="text-5xl">🤖</div>
                <div className="text-gray-700 font-semibold text-lg">No questions asked yet</div>
                <div className="text-sm text-gray-500 max-w-md">
                  Try asking things like:
                </div>
                <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
                  <button 
                    onClick={() => setQuestion("Which variable has the highest variance?")}
                    className="p-3 text-xs text-left bg-blue-50/70 border border-blue-200 text-blue-800 rounded-xl hover:bg-blue-100/70 transition"
                  >
                    💬 "Which variable has the highest variance?"
                  </button>
                  <button 
                    onClick={() => setQuestion("Are there any strong correlations that might cause data leakage?")}
                    className="p-3 text-xs text-left bg-blue-50/70 border border-blue-200 text-blue-800 rounded-xl hover:bg-blue-100/70 transition"
                  >
                    💬 "Are there any strong correlations that might cause data leakage?"
                  </button>
                </div>
              </div>
            ) : (
              chatLog.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-gray-50 border border-gray-200 text-gray-800 shadow-sm prose prose-sm max-w-none'
                  }`}>
                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isAsking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border border-gray-200 text-gray-600 rounded-2xl px-5 py-3 text-sm animate-pulse flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div>
                  Thinking & analyzing data...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex gap-3">
              <input 
                type="text" 
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askQuestion()}
                placeholder="Ask a question about the dataset..."
                className="flex-1 bg-white border border-gray-300 rounded-xl px-5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
                disabled={isAsking}
              />
              <button 
                onClick={askQuestion}
                disabled={isAsking || !question.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-semibold transition shadow hover:shadow-md flex items-center justify-center"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => router.push(`/analysis/${sessionId}/agent-4`)}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back to Agent 4 (Statistics)
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 font-semibold tracking-wide mb-1">✓ AGENT 5 EXPLORATION</span>
            <div className="flex space-x-4 text-[11px] font-medium text-gray-500">
              <span className="text-blue-600 font-bold">Q&A Active</span>
            </div>
          </div>

          <button 
            onClick={() => router.push(`/analysis/${sessionId}/agent-6`)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Yes, Continue to ML →
          </button>
        </div>
      </div>
    </div>
  );
}
