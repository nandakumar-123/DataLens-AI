"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AgentWorkflow } from '../../../../components/workflow/AgentWorkflow';
import { AgentDetailPanel } from '../../../../components/workflow/AgentDetailPanel';
import { mockAgents, mockEvents } from '../../../../lib/mock/workflow';
import { analysisApi } from '../../../../lib/api/analysis';
import { Download, FileText, Presentation, Table, FileCode2, MessageSquare, Send, Sparkles } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Agent8Page() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    "Collecting analysis results",
    "Building final summary",
    "Generating AI insights",
    "Building report",
    "Finalizing dashboard"
  ];

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    let mounted = true;

    const runAgent8Flow = async () => {
      try {
        setLoadingStep(0);
        await new Promise(r => setTimeout(r, 600));
        if (!mounted) return;
        setLoadingStep(1);
        await new Promise(r => setTimeout(r, 600));
        if (!mounted) return;
        setLoadingStep(2);
        
        await analysisApi.runAgent8(sessionId);
        
        if (!mounted) return;
        setLoadingStep(3);
        await new Promise(r => setTimeout(r, 400));
        if (!mounted) return;
        setLoadingStep(4);
        
        const result = await analysisApi.getAgent8Result(sessionId);
        if (!mounted) return;
        setData(result);
        setLoading(false);
      } catch (err: any) {
        if (mounted) {
          console.error(err);
          setErrorMessage(err.message || 'Failed to generate Agent 8 report.');
          setLoading(false);
        }
      }
    };
    runAgent8Flow();
    return () => { 
      mounted = false; 
      hasRun.current = false;
    };
  }, [sessionId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;
    
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatting(true);
    
    try {
      const res = await analysisApi.chatAgent8(sessionId, userMsg);
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        text: `✅ Created! New slide "${res.new_slide.title}" has been successfully added to your presentation.` 
      }]);
      // Reload data to reflect custom slides if we want to show them
      const newData = await analysisApi.getAgent8Result(sessionId);
      setData(newData);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { role: 'ai', text: `Error: ${err.message}` }]);
    } finally {
      setIsChatting(false);
    }
  };

  const [agents, setAgents] = useState(
    mockAgents.map((a: any, idx: number) => ({
      ...a,
      status: (idx < 7 ? 'completed' : 'active') as any,
    }))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">DATALENS AI</h1>
            <p className="text-slate-500 text-xs mt-1 font-bold uppercase tracking-wider">Agent 8 • Processing</p>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 mt-20">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10">
            <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <div className="w-6 h-6 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              Generating Final Intelligence
            </h2>
            <div className="space-y-4">
              {loadingSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                    ${loadingStep > idx ? 'bg-emerald-100 text-emerald-600' : 
                      loadingStep === idx ? 'bg-indigo-600 text-white animate-pulse' : 
                      'bg-slate-100 text-slate-400'}`}>
                    {loadingStep > idx ? '✓' : loadingStep === idx ? '●' : '○'}
                  </div>
                  <span className={`text-[15px] font-bold ${loadingStep >= idx ? 'text-slate-700' : 'text-slate-400'}`}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rawData = data?.raw_data || {};
  const insights = data?.ai_insights || {};
  const customSlides = data?.custom_slides || [];
  const datasetType = rawData.dataset_type || "general";
  const titleText = datasetType === "business" ? "BUSINESS ANALYTICS REPORT" : "DATA SCIENCE REPORT";
  const dq = rawData.data_quality || {};
  const ml = rawData.ml_results || {};
  const kpis = rawData.kpis || [];
  const charts = rawData.charts || [];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 selection:bg-indigo-500/20 font-sans">
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
              {titleText}
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-bold uppercase tracking-wider">Generated by Agent 8</p>
          </div>
          <div className="flex space-x-3 text-xs font-bold text-slate-400 hidden sm:flex bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
            <span className="text-slate-600">A1-A7 ✓</span><span>→</span>
            <span className="text-emerald-600 font-black">A8 ✓</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          <div className="lg:col-span-3 space-y-8">
            
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl shadow-sm font-medium flex items-center gap-3">
                {errorMessage}
              </div>
            )}

            {/* EXECUTIVE SUMMARY */}
            <div className="p-8 md:p-10 bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-4">EXECUTIVE SUMMARY</h2>
              <p className="text-slate-700 font-medium leading-relaxed text-lg">{insights.executive_summary}</p>
            </div>

            {/* DYNAMIC KPIs */}
            {kpis.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {kpis.map((kpi: any, idx: number) => (
                  <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{kpi.name}</p>
                    <p className="text-2xl font-black text-indigo-600">{kpi.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* AI CHAT INTERFACE */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[2rem] border border-indigo-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
              <div className="bg-white/60 p-4 border-b border-indigo-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 tracking-tight">AI Presentation Assistant</h3>
                  <p className="text-xs font-bold text-slate-500">Ask to generate custom slides for your PPT</p>
                </div>
                {customSlides.length > 0 && (
                  <div className="ml-auto bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                    {customSlides.length} Custom Slide{customSlides.length !== 1 ? 's' : ''} Added
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-3">
                    <MessageSquare className="w-10 h-10 opacity-50" />
                    <p className="max-w-[250px] text-sm">"Add a slide about our key risk factors" or "Generate a slide summarizing the top 3 product categories."</p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-sm' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                    }`}>
                      <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl px-5 py-3 bg-white border border-slate-200 rounded-tl-sm shadow-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-indigo-100">
                <form onSubmit={handleChatSubmit} className="relative flex items-center">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask AI to generate a slide..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-full py-3 px-5 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-slate-700"
                    disabled={isChatting}
                  />
                  <button 
                    type="submit" 
                    disabled={isChatting || !chatInput.trim()}
                    className="absolute right-2 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* DOWNLOAD BUTTONS */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Download Reports</h3>
                {customSlides.length > 0 && (
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    Includes {customSlides.length} Custom AI Slides
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => window.location.href = analysisApi.getAgent8DownloadUrl(sessionId, 'pdf')}
                  className="py-4 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl flex flex-col justify-center items-center gap-2 transition-all"
                >
                  <FileText className="w-6 h-6" />
                  Download PDF
                </button>
                <button 
                  onClick={() => window.location.href = analysisApi.getAgent8DownloadUrl(sessionId, 'pptx')}
                  className="py-4 px-4 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold rounded-2xl flex flex-col justify-center items-center gap-2 transition-all ring-2 ring-orange-500 ring-offset-2"
                >
                  <Presentation className="w-6 h-6" />
                  Download PPTX
                </button>
                <button 
                  onClick={() => window.location.href = analysisApi.getAgent8DownloadUrl(sessionId, 'csv')}
                  className="py-4 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold rounded-2xl flex flex-col justify-center items-center gap-2 transition-all"
                >
                  <Table className="w-6 h-6" />
                  Download CSV
                </button>
                <button 
                  onClick={() => window.location.href = analysisApi.getAgent8DownloadUrl(sessionId, 'md')}
                  className="py-4 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl flex flex-col justify-center items-center gap-2 transition-all"
                >
                  <FileCode2 className="w-6 h-6" />
                  Download Markdown
                </button>
              </div>
            </div>

            {/* DYNAMIC CHARTS */}
            {charts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {charts.map((chart: any, idx: number) => (
                  <div key={idx} className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">{chart.title}</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        {chart.type === "line" ? (
                          <LineChart data={chart.data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey={chart.x_axis} tick={{fontSize: 10, fill: '#64748b'}} />
                            <YAxis tick={{fontSize: 10, fill: '#64748b'}} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Line type="monotone" dataKey={chart.y_axis} stroke="#4f46e5" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                          </LineChart>
                        ) : chart.type === "bar" ? (
                          <BarChart data={chart.data} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" tick={{fontSize: 10, fill: '#64748b'}} />
                            <YAxis type="category" dataKey={chart.x_axis} width={80} tick={{fontSize: 10, fill: '#64748b'}} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey={chart.y_axis} fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        ) : (
                          <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey={chart.x_axis} type="number" name={chart.x_axis} tick={{fontSize: 10, fill: '#64748b'}} />
                            <YAxis dataKey={chart.y_axis} type="number" name={chart.y_axis} tick={{fontSize: 10, fill: '#64748b'}} />
                            <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            <Scatter name="Data" data={chart.data} fill="#ec4899" />
                          </ScatterChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* KEY FINDINGS & RECOMMENDATIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8">
                <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6">Key Findings</h3>
                <ul className="space-y-4">
                  {insights.key_findings?.map((item: string, i: number) => (
                    <li key={i} className="flex gap-3 text-slate-600 font-medium text-[15px] leading-relaxed">
                      <span className="text-indigo-500 shrink-0 mt-0.5">●</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-br from-white to-slate-50 rounded-[2rem] border border-slate-100 shadow-md p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6">Actionable Recommendations</h3>
                <ul className="space-y-4">
                  {insights.recommendations?.map((item: string, i: number) => (
                    <li key={i} className="flex gap-4 items-start bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs mt-0.5">{i+1}</div>
                      <span className="text-slate-700 font-medium text-[15px] leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-1 mt-8 lg:mt-0">
            <div className="sticky top-28 bg-white/50 backdrop-blur-xl rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-1">
              <AgentDetailPanel agent={agents[7]} events={mockEvents} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
