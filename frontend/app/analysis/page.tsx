"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout, PageContainer } from '../../components/layout/AppLayout';
import { AgentWorkflow } from '../../components/workflow/AgentWorkflow';
import { AgentDetailPanel } from '../../components/workflow/AgentDetailPanel';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { mockAgents, mockEvents } from '../../lib/mock/workflow';
import { datasetsApi } from '../../lib/api/datasets';
import { analysisApi } from '../../lib/api/analysis';
import { useToast } from '../../components/ui/Toast';

export default function AnalysisPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [agents, setAgents] = useState(
    mockAgents.map((a, idx) => ({
      ...a,
      status: (idx === 0 ? 'active' : 'pending') as any,
    }))
  );
  
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingDemoKey, setLoadingDemoKey] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeAgent = agents[0];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFiles = (selectedFiles: File[]) => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    const newFiles = [...files];
    let hasError = false;

    for (const file of selectedFiles) {
      if (newFiles.some(f => f.name === file.name)) {
        setErrorMessage(`File ${file.name} is already selected.`);
        hasError = true;
        break;
      }
      
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(ext)) {
        setErrorMessage(`Unsupported file type. Please upload CSV or Excel files.`);
        hasError = true;
        break;
      }
      
      if (file.size === 0) {
        setErrorMessage(`File ${file.name} appears to be empty.`);
        hasError = true;
        break;
      }
      
      if (file.size > maxSize) {
        setErrorMessage(`File ${file.name} is larger than the allowed upload size (50MB).`);
        hasError = true;
        break;
      }

      newFiles.push(file);
    }

    if (!hasError) {
      setErrorMessage('');
      setFiles(newFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploadStatus === 'success') return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(files.filter(f => f.name !== fileName));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploadStatus('uploading');
    setErrorMessage('');
    
    try {
      const response = await datasetsApi.upload(files);
      setSessionId(response.session_id);
      setUploadStatus('success');
      showToast('Files uploaded successfully! Ready for Agent 1 profiling.', 'success', 'Upload Complete');
    } catch (err: any) {
      setUploadStatus('error');
      setErrorMessage(err.message || 'Upload failed. Please try again.');
      showToast(err.message || 'Upload failed', 'error', 'Error');
    }
  };

  const handleDemoSelect = async (demoKey: string, demoTitle: string) => {
    setLoadingDemoKey(demoKey);
    setErrorMessage('');
    showToast(`Loading ${demoTitle} sample dataset...`, 'info', 'Loading Demo');
    try {
      const res = await datasetsApi.loadDemo(demoKey);
      setSessionId(res.session_id);
      setUploadStatus('success');
      showToast(`${demoTitle} ready! Launching Agent 1 profiling.`, 'success', 'Demo Loaded');
      // Auto launch profiling
      setIsProcessing(true);
      await analysisApi.runAgent1(res.session_id);
      router.push(`/analysis/${res.session_id}/agent-1`);
    } catch (err: any) {
      setLoadingDemoKey(null);
      setErrorMessage(err.message || 'Failed to load demo dataset.');
      showToast('Failed to load demo dataset.', 'error', 'Error');
    }
  };

  const runAgent1 = async () => {
    if (!sessionId) return;
    setIsProcessing(true);
    setErrorMessage('');
    
    setAgents(agents.map((a, idx) => ({
      ...a,
      status: (idx === 0 ? 'processing' : 'pending') as any,
    })));

    try {
      // Execute backend agent 1 profiling
      await analysisApi.runAgent1(sessionId);
      showToast('Agent 1 dataset profiling finished!', 'success', 'Profiling Complete');
      // On success, redirect to the new Profile page
      router.push(`/analysis/${sessionId}/agent-1`);
      
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Agent 1 processing failed.');
      showToast(err.message || 'Agent 1 processing failed.', 'error', 'Agent 1 Error');
      setAgents(agents.map((a, idx) => ({
        ...a,
        status: (idx === 0 ? 'active' : 'pending') as any,
      })));
    }
  };

  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200 pt-6 pb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">DataLens AI Workflow</h2>
          <AgentWorkflow agents={agents} />
        </div>
      </div>

      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1-CLICK DEMO DATASETS BANNER */}
            <div className="p-6 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-purple-50/60 rounded-3xl border border-indigo-100/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">One-Click Demo Datasets</h3>
                    <p className="text-xs text-slate-500 font-medium">Test the entire 8-agent ML pipeline instantly with pre-loaded benchmarks</p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100/70 rounded-lg">Instant Testing</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleDemoSelect('churn', 'Customer Churn')}
                  disabled={loadingDemoKey !== null || isProcessing}
                  className="p-3.5 bg-white hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-300 rounded-2xl text-left transition-all shadow-xs hover:shadow-md group active:scale-95 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors">Customer Churn</span>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Classification</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 font-medium">300 users, contract terms, tenure, charges, tickets & churn labels.</p>
                  <div className="mt-2.5 text-[11px] font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    {loadingDemoKey === 'churn' ? 'Loading...' : 'Launch 1-Click →'}
                  </div>
                </button>

                <button
                  onClick={() => handleDemoSelect('sales', 'E-Commerce Sales')}
                  disabled={loadingDemoKey !== null || isProcessing}
                  className="p-3.5 bg-white hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-300 rounded-2xl text-left transition-all shadow-xs hover:shadow-md group active:scale-95 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors">E-Commerce Sales</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Regression</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 font-medium">350 campaigns, ad spend, web visits, conversion rate & revenue.</p>
                  <div className="mt-2.5 text-[11px] font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    {loadingDemoKey === 'sales' ? 'Loading...' : 'Launch 1-Click →'}
                  </div>
                </button>

                <button
                  onClick={() => handleDemoSelect('health', 'Healthcare Diagnostics')}
                  disabled={loadingDemoKey !== null || isProcessing}
                  className="p-3.5 bg-white hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-300 rounded-2xl text-left transition-all shadow-xs hover:shadow-md group active:scale-95 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors">Healthcare Risk</span>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Diagnosis</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 font-medium">250 patients, BMI, glucose, blood pressure, insulin & outcome risk.</p>
                  <div className="mt-2.5 text-[11px] font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    {loadingDemoKey === 'health' ? 'Loading...' : 'Launch 1-Click →'}
                  </div>
                </button>
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg shadow-sm">
                {errorMessage}
              </div>
            )}

            {isProcessing ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Agent 1 is profiling datasets</h3>
                  <p className="text-gray-500">Reading schemas, detecting keys, and generating AI recommendations...</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8">
                  {uploadStatus === 'success' ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Dataset upload complete</h3>
                      <p className="text-gray-600 mb-8">{files.length} dataset{files.length !== 1 ? 's' : ''} uploaded successfully.</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-sm ring-1 ring-inset ring-indigo-100/50">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">Upload Dataset</h3>
                        <p className="text-gray-500">Select one or more CSV or Excel files to begin analysis.</p>
                      </div>

                      <div 
                        className={`group relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ease-in-out cursor-pointer
                          ${isDragging 
                            ? 'border-indigo-500 bg-indigo-50/50 shadow-inner' 
                            : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-white hover:shadow-md'
                          }
                        `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input 
                          type="file" 
                          multiple 
                          accept=".csv, .xlsx, .xls"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                        
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging ? 'bg-indigo-100' : 'bg-white group-hover:bg-indigo-50 shadow-sm'}`}>
                            <svg className={`w-10 h-10 transition-colors duration-300 ${isDragging ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors">Click to upload</span> or drag and drop
                          </div>
                          <p className="text-xs text-gray-400">CSV, XLSX, XLS up to 50MB</p>
                        </div>
                      </div>

                      {files.length > 0 && (
                        <div className="mt-10">
                          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                            <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2.5 rounded-full text-xs mr-2">{files.length}</span>
                            Ready for analysis
                          </h4>
                          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 bg-white shadow-sm overflow-hidden ring-1 ring-black ring-opacity-5">
                            {files.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-4">
                                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  disabled={uploadStatus === 'uploading'}
                                  title="Remove file"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {!isProcessing && (
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <Link href="/">
                  <Button variant="ghost">Back</Button>
                </Link>
                
                {uploadStatus === 'success' ? (
                  <Button variant="primary" onClick={runAgent1}>Continue to Agent 1 &rarr;</Button>
                ) : (
                  <Button 
                    variant="primary" 
                    onClick={handleUpload}
                    disabled={files.length === 0 || uploadStatus === 'uploading'}
                  >
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload'}
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <AgentDetailPanel agent={activeAgent} events={mockEvents} />
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}

