"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, 
  ArrowRight, 
  Database, 
  Wand2, 
  ShieldCheck, 
  BarChart3, 
  MessageSquareCode, 
  Cpu, 
  Boxes, 
  FileSpreadsheet, 
  Layers, 
  Activity, 
  CheckCircle2, 
  Sliders, 
  Flame, 
  Download, 
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  Zap,
  Check,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Bot,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const AGENTS = [
  {
    id: 1,
    name: "Agent 1: Ingestion & Profiling",
    tag: "Multi-Table Overlap",
    icon: Database,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 text-blue-700 border-blue-200",
    badge: "Deterministic",
    description: "Ingests CSV, Excel, and JSON datasets, profiles data types, and computes key overlap matrices to recommend optimal multi-table joins without data loss.",
    metrics: [
      { label: "Supported Formats", val: "CSV, XLSX, XLS, JSON" },
      { label: "Join Algorithm", val: "Fuzzy Match & Overlap Scoring" },
      { label: "Profiling Speed", val: "< 50ms / 10k rows" }
    ],
    sampleOutput: {
      action: "Schema Discovered & Overlap Analyzed",
      details: "Detected customers.csv ↔ orders.csv on 'customer_id' with 98.4% key overlap. Recommended: LEFT JOIN."
    }
  },
  {
    id: 2,
    name: "Agent 2: Intelligent Cleaning",
    tag: "Non-Destructive",
    icon: Wand2,
    color: "from-purple-500 to-indigo-500",
    bgColor: "bg-purple-50 text-purple-700 border-purple-200",
    badge: "Smart Recipe",
    description: "Executes automated missing value imputation (median, mode, KNN), IQR & Z-score outlier remediation, and data type coercion with full human review checkpoints.",
    metrics: [
      { label: "Null Handling", val: "Iterative Multi-Strategy" },
      { label: "Outlier Method", val: "IQR / Modified Z-Score" },
      { label: "Data Integrity", val: "100% Non-Destructive" }
    ],
    sampleOutput: {
      action: "Cleaning Pipeline Applied",
      details: "Imputed 142 missing values in 'income' using median. Coerced 3 datetime columns. 0 rows lost."
    }
  },
  {
    id: 3,
    name: "Agent 3: Health & Validation",
    tag: "Audit Quality Score",
    icon: ShieldCheck,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badge: "0-100 Scoring",
    description: "Audits schema integrity, validates value constraints, evaluates duplicate records, and generates an auditable 0–100 Data Quality Score before modeling.",
    metrics: [
      { label: "Score Range", val: "0 to 100 Health Score" },
      { label: "Constraint Verification", val: "Type, Range, Nulls" },
      { label: "Sanitization Audit", val: "Automated Verified" }
    ],
    sampleOutput: {
      action: "Validation Certified: 96 / 100",
      details: "Dataset passed 12/12 validation checks. Zero orphaned foreign keys. High analytical fidelity confirmed."
    }
  },
  {
    id: 4,
    name: "Agent 4: Statistics & Research",
    tag: "Hypothesis Engine",
    icon: BarChart3,
    color: "from-blue-600 to-indigo-600",
    bgColor: "bg-blue-50 text-blue-700 border-blue-200",
    badge: "P-Value Verified",
    description: "Computes descriptive stats, interactive Pearson & Spearman correlation heatmaps, and executes automated hypothesis tests (T-tests, ANOVA, Chi-Square).",
    metrics: [
      { label: "Correlation Matrix", val: "Pearson & Spearman" },
      { label: "Hypothesis Tests", val: "T-Test, ANOVA, Chi-Square" },
      { label: "AI Summary", val: "Executive Briefing" }
    ],
    sampleOutput: {
      action: "Statistical Discovery Complete",
      details: "Found significant correlation between 'tenure' and 'spend' (r = +0.78, p < 0.001). ANOVA confirmed group variance."
    }
  },
  {
    id: 5,
    name: "Agent 5: Interactive Q&A",
    tag: "Natural Language",
    icon: MessageSquareCode,
    color: "from-indigo-500 to-violet-500",
    bgColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    badge: "Conversational",
    description: "Empowers both technical analysts and executive decision-makers to interrogate datasets in natural language, receiving contextual charts and answers in real-time.",
    metrics: [
      { label: "LLM Backend", val: "Mistral / Groq Dual-Engine" },
      { label: "Response Latency", val: "Sub-Second Inference" },
      { label: "Query Scope", val: "Trends, Outliers, Distributions" }
    ],
    sampleOutput: {
      action: "Natural Language Query Answered",
      details: "User: 'Which region had highest variance in Q3?' → AI: 'Region West exhibited 34.2% std deviation driven by high-value outliers.'"
    }
  },
  {
    id: 6,
    name: "Agent 6: ML Preparation",
    tag: "Zero Data Leakage",
    icon: Cpu,
    color: "from-purple-600 to-pink-600",
    bgColor: "bg-purple-50 text-purple-700 border-purple-200",
    badge: "Safety Guard",
    description: "Prepares preprocessing pipelines, scales numerical attributes, encodes categoricals, audits class imbalance, and scans for mutual information target leakage.",
    metrics: [
      { label: "Leakage Scan", val: "Mutual Information & Exact Match" },
      { label: "Class Imbalance", val: "Automated Ratio Guard" },
      { label: "Pipeline Encoders", val: "One-Hot, Target & Robust Scaler" }
    ],
    sampleOutput: {
      action: "ML Safety Certified",
      details: "Supervised Classification configured. 0 data leakage risks detected. Class balance: 64% / 36% (Safe)."
    }
  },
  {
    id: 7,
    name: "Agent 7: AutoML Benchmark",
    tag: "Overfitting Guard",
    icon: Boxes,
    color: "from-emerald-600 to-teal-600",
    bgColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badge: "K-Fold Verified",
    description: "Trains, cross-validates, and benchmarks competing machine learning algorithms with automated generalization gap diagnostics (|Train - CV| > 0.08) to eliminate overfitting.",
    metrics: [
      { label: "Supported Algorithms", val: "Random Forest, XGBoost, SVM, Logistic, Ridge, KMeans" },
      { label: "Validation Strategy", val: "5-Fold Stratified CV" },
      { label: "Artifact Export", val: "Serialized Scikit-Learn .pkl" }
    ],
    sampleOutput: {
      action: "Best Model Selected: Gradient Boosting",
      details: "CV Accuracy: 94.2% (Train: 95.8%, Gap: +1.6% - Generalizes Excellently). Model artifact ready for download."
    }
  },
  {
    id: 8,
    name: "Agent 8: Executive Presentation",
    tag: "Instant Delivery",
    icon: FileSpreadsheet,
    color: "from-sky-500 to-blue-600",
    bgColor: "bg-sky-50 text-sky-700 border-sky-200",
    badge: "1-Click PPTX",
    description: "Aggregates end-to-end insights, visual dashboards, and model evaluation metrics into polished, presentation-ready PowerPoint slide decks (.pptx) and executive summaries.",
    metrics: [
      { label: "Slide Deck Export", val: "Native PowerPoint (.pptx)" },
      { label: "Visual Dashboards", val: "Recharts & Plotly Integrated" },
      { label: "Executive Synthesis", val: "Key Findings & Recommendations" }
    ],
    sampleOutput: {
      action: "Presentation Deck Generated",
      details: "Created 14-slide executive briefing presentation with embedded KPI cards, correlation charts, and AutoML conclusions."
    }
  }
];

const SAMPLE_BENCHMARKS = [
  { name: "Gradient Boost", score: 94.2, cv: 93.8, gap: 0.4, best: true, color: "#10b981" },
  { name: "Random Forest", score: 92.5, cv: 91.0, gap: 1.5, best: false, color: "#3b82f6" },
  { name: "Support Vector", score: 88.4, cv: 87.1, gap: 1.3, best: false, color: "#8b5cf6" },
  { name: "Logistic Reg", score: 84.6, cv: 84.2, gap: 0.4, best: false, color: "#64748b" },
];

const FAQ_ITEMS = [
  {
    q: "How does DataLens AI detect and prevent Target Data Leakage?",
    a: "Agent 6 runs a proactive mutual information scan and exact match check between features (X) and target (Y). If any feature exhibits an artificially perfect correlation or temporal future leakage, it is automatically flagged for human review before training."
  },
  {
    q: "Can I combine and join multiple relational CSV / Excel tables?",
    a: "Yes! Agent 1 deterministically extracts primary keys and foreign key overlaps, scoring intersection ratios (e.g. 98% overlap between customer_id). It suggests optimal joins (LEFT, INNER, OUTER) with preview verification."
  },
  {
    q: "How does the 0–100 Data Quality Score work?",
    a: "Agent 3 audits 12 essential data health dimensions including completeness, type validity, duplicate frequency, constraint compliance, and outlier skewness, returning an auditable composite 0-100 score."
  },
  {
    q: "Can I download the trained Machine Learning model for production?",
    a: "Absolutely. Once Agent 7 selects the champion model, you can export the complete scikit-learn pipeline (.pkl) which includes all preprocessing scalers, encoders, and model weights ready for production inference."
  }
];

export default function Home() {
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [activeTab, setActiveTab] = useState("wrangling");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  
  // Interactive Live Simulator State
  const [nullThreshold, setNullThreshold] = useState(15);
  const [outlierSensitivity, setOutlierSensitivity] = useState(2.5);
  const [simulatedScore, setSimulatedScore] = useState(96);
  const [simulatedQuestion, setSimulatedQuestion] = useState("Which feature has the strongest influence on model predictions?");
  const [simulatedAnswer, setSimulatedAnswer] = useState<string | null>(null);
  const [isSimulatingChat, setIsSimulatingChat] = useState(false);

  useEffect(() => {
    // Dynamically calculate simulated quality score based on sliders
    const penalty = (nullThreshold > 20 ? (nullThreshold - 20) * 0.8 : 0) + (outlierSensitivity < 2.0 ? (2.0 - outlierSensitivity) * 12 : 0);
    const score = Math.max(70, Math.min(100, Math.round(98 - penalty)));
    setSimulatedScore(score);
  }, [nullThreshold, outlierSensitivity]);

  const handleSimulatedAsk = (q: string) => {
    setSimulatedQuestion(q);
    setIsSimulatingChat(true);
    setSimulatedAnswer(null);
    setTimeout(() => {
      if (q.includes("influence") || q.includes("feature")) {
        setSimulatedAnswer("✨ AI Insight: Feature Importance analysis reveals 'Account_Tenure' (38.4%) and 'Monthly_Spend' (29.1%) constitute over 67% of predictive power with zero leakage.");
      } else if (q.includes("outlier")) {
        setSimulatedAnswer("✨ AI Insight: Detected 18 skewed outliers in 'Transaction_Amount' beyond 3.0 IQR. Applied robust log-transform without row deletion.");
      } else {
        setSimulatedAnswer("✨ AI Insight: The dataset exhibits strong linear separability across principal components with 94.2% CV generalization score.");
      }
      setIsSimulatingChat(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-500/20 selection:text-blue-900">
      
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs font-semibold py-2.5 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-inner">
        <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[11px] uppercase tracking-wider backdrop-blur-sm">
          Next-Gen AutoML
        </span>
        <span>✨ 8-Agent Autonomous Collaborative Architecture for Tabular Data Analytics</span>
        <Link href="/analysis" className="underline font-bold hover:text-blue-100 ml-1 inline-flex items-center gap-1">
          Try Live Studio <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 pb-20 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-blue-50/20 border-b border-gray-200">
        
        {/* Subtle Background Glow Mesh */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-blue-200/20 via-indigo-100/30 to-purple-200/20 blur-3xl -z-10 rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider mb-8 shadow-xs animate-fade-in">
            <Sparkles className="w-4 h-4 text-blue-600 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Autonomous Multi-Agent AI Data Intelligence</span>
          </div>

          {/* Main Title & Subtitle */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight max-w-5xl mx-auto mb-6">
            DataLens AI
            <span className="block text-3xl sm:text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mt-2">
              AI-Powered Automated Data Analysis Platform
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Upload single or multi-table datasets and let <strong className="text-gray-900 font-semibold">8 collaborative AI agents</strong> automatically profile, clean, run hypothesis tests, benchmark AutoML models with zero data leakage, and generate executive presentations.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link 
              href="/analysis"
              className="w-full sm:w-auto px-9 py-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
            >
              <span>Upload Dataset & Start Analysis</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a 
              href="#agent-pipeline"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 text-base font-bold rounded-2xl border border-gray-300 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Boxes className="w-5 h-5 text-indigo-600" />
              <span>Explore 8-Agent Pipeline ↓</span>
            </a>
          </div>

          {/* Interactive Hero 3D Showcase Preview Box */}
          <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-slate-200/60 text-left relative overflow-hidden group">
            
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100 px-2">
              <div className="flex items-center gap-3">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <span className="text-xs font-mono font-bold text-gray-500">datalens-studio://live-interactive-preview</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Studio Connected
                </span>
              </div>
            </div>

            {/* Generated High-Res 3D Dashboard Hero Image */}
            <div className="relative w-full h-[320px] sm:h-[420px] rounded-2xl overflow-hidden mt-3 border border-gray-100 shadow-inner">
              <Image 
                src="/images/dashboard_hero.jpg" 
                alt="DataLens AI 3D Analytics Dashboard"
                fill
                className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
                priority
              />
              
              {/* Overlay Interactive Callouts */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/60 shadow-md flex items-center gap-2 text-xs font-bold text-gray-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Quality Score: 96/100 Verified</span>
              </div>

              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/60 shadow-md flex items-center gap-2 text-xs font-bold text-gray-900">
                <BrainCircuit className="w-4 h-4 text-indigo-600" />
                <span>AutoML Champion: GradientBoost (94.2% CV Acc)</span>
              </div>
            </div>

            {/* Quick Flow Launch Bar */}
            <div className="mt-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-blue-900">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                <span>One-click automated data science: Ingestion → Cleaning → Stats → AutoML → Presentation.</span>
              </div>
              <Link 
                href="/analysis" 
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition"
              >
                Launch Live Studio →
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 3. KEY HIGHLIGHT METRICS */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-4 rounded-2xl hover:bg-gray-50 transition">
              <div className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">10x</div>
              <div className="text-sm font-semibold text-gray-500 mt-1">Faster Analysis Turnaround</div>
            </div>
            <div className="p-4 rounded-2xl hover:bg-gray-50 transition">
              <div className="text-4xl sm:text-5xl font-black text-blue-600 tracking-tight">8</div>
              <div className="text-sm font-semibold text-gray-500 mt-1">Autonomous Specialized Agents</div>
            </div>
            <div className="p-4 rounded-2xl hover:bg-gray-50 transition">
              <div className="text-4xl sm:text-5xl font-black text-emerald-600 tracking-tight">100%</div>
              <div className="text-sm font-semibold text-gray-500 mt-1">Zero Target Data Leakage</div>
            </div>
            <div className="p-4 rounded-2xl hover:bg-gray-50 transition">
              <div className="text-4xl sm:text-5xl font-black text-purple-600 tracking-tight">1-Click</div>
              <div className="text-sm font-semibold text-gray-500 mt-1">Executive PPTX & .pkl Export</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE LIVE DATA SCIENCE SANDBOX */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider">
              Live Sandbox Simulator
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mt-3">
              Test DataLens AI Logic in Real-Time
            </h2>
            <p className="text-gray-600 text-base mt-2">
              Interact with our live AutoML benchmark chart, adjust data cleaning thresholds, and query conversational insights.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Interactive Recharts AutoML Benchmark Chart */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      AutoML Model Leaderboard (5-Fold CV)
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Real-time benchmark with Overfitting Generalization Gap diagnostics</p>
                  </div>
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                    Champion: GradientBoost
                  </span>
                </div>

                <div className="h-64 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={SAMPLE_BENCHMARKS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                      <YAxis domain={[75, 100]} stroke="#64748b" fontSize={12} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        formatter={(value: any) => [`${value}% CV Accuracy`, 'Score']}
                      />
                      <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                        {SAMPLE_BENCHMARKS.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.best ? '#10b981' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-gray-100 text-xs mt-4">
                {SAMPLE_BENCHMARKS.map((m, i) => (
                  <div key={i} className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-center">
                    <span className="font-bold text-gray-800 block truncate">{m.name}</span>
                    <span className="text-blue-600 font-bold font-mono">{m.score}%</span>
                    <span className="text-[10px] text-gray-400 block">Gap: +{m.gap}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Live Interactive Quality & Chat Sandbox */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Interactive Health Score Slider Widget */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                    Interactive Data Health Tuner
                  </h3>
                  <div className="text-xl font-black text-emerald-600 font-mono">
                    {simulatedScore}/100
                  </div>
                </div>

                <div className="space-y-4 text-xs font-semibold text-gray-700">
                  <div>
                    <div className="flex justify-between mb-1 text-gray-600">
                      <span>Missing Value Tolerance:</span>
                      <span className="font-mono text-gray-900">{nullThreshold}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="40" 
                      value={nullThreshold} 
                      onChange={(e) => setNullThreshold(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-gray-600">
                      <span>Outlier Sensitivity Threshold:</span>
                      <span className="font-mono text-gray-900">{outlierSensitivity.toFixed(1)}σ</span>
                    </div>
                    <input 
                      type="range" 
                      min="1.5" 
                      max="3.5" 
                      step="0.1" 
                      value={outlierSensitivity} 
                      onChange={(e) => setOutlierSensitivity(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Calculated Quality: <strong>{simulatedScore >= 90 ? 'Optimal Grade A' : 'Good Grade B'}</strong> (Safe for ML)</span>
                </div>
              </div>

              {/* Interactive Agent 5 Q&A Sandbox */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <Bot className="w-4 h-4 text-purple-600" />
                  Agent 5 Conversational Intelligence
                </h3>

                <div className="flex flex-wrap gap-2 mb-3">
                  <button 
                    onClick={() => handleSimulatedAsk("Which feature has the strongest influence on model predictions?")}
                    className="text-[11px] font-semibold bg-gray-100 hover:bg-blue-50 hover:text-blue-700 p-2 rounded-lg transition border border-gray-200"
                  >
                    💬 Feature Importance?
                  </button>
                  <button 
                    onClick={() => handleSimulatedAsk("Did you detect any significant outliers in Transaction Amount?")}
                    className="text-[11px] font-semibold bg-gray-100 hover:bg-blue-50 hover:text-blue-700 p-2 rounded-lg transition border border-gray-200"
                  >
                    💬 Outlier Report?
                  </button>
                </div>

                {/* Chat Bubble Result */}
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-800 leading-relaxed min-h-[64px] flex items-center">
                  {isSimulatingChat ? (
                    <div className="flex items-center gap-2 text-gray-500 animate-pulse font-medium">
                      <div className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></div>
                      Agent 5 is querying dataset statistics...
                    </div>
                  ) : (
                    <div>{simulatedAnswer || "Click a sample question above to see Agent 5 contextual analysis in real-time."}</div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE 8-AGENT PIPELINE EXPLORER WITH 3D NETWORK ILLUSTRATION */}
      <section id="agent-pipeline" className="py-20 bg-gray-50/70 border-b border-gray-200 scroll-mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
              Interactive Workflow Engine
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              The 8 Autonomous AI Agents
            </h2>
            <p className="text-gray-600 text-base sm:text-lg mt-3">
              Click any agent below to inspect its mathematical foundation, inputs, outputs, and live simulated execution.
            </p>
          </div>

          {/* 3D Multi-Agent Visual Architecture Banner */}
          <div className="relative w-full h-64 sm:h-80 rounded-3xl overflow-hidden mb-10 border border-gray-200 shadow-md group">
            <Image 
              src="/images/multiagent_network.jpg" 
              alt="DataLens AI Autonomous Multi-Agent Collaborative Architecture"
              fill
              className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 via-transparent to-transparent flex items-end p-6">
              <div className="text-white">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Autonomous Multi-Agent Workflow</span>
                <h3 className="text-xl sm:text-2xl font-black">Coordinated Autonomous Pipeline from Ingestion to Executive Presentation</h3>
              </div>
            </div>
          </div>

          {/* Agent Selection Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {AGENTS.map((agent) => {
              const isSelected = selectedAgent.id === agent.id;
              const IconComponent = agent.icon;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20 transform -translate-y-1' 
                      : 'bg-white/80 border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                      Agent {agent.id}
                    </span>
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {agent.name.split(':')[1]}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">{agent.tag}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Agent Interactive Detail Panel */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedAgent.bgColor}`}>
                    {selectedAgent.badge}
                  </span>
                  <span className="text-xs font-mono font-semibold text-gray-400">Step {selectedAgent.id} of 8</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {selectedAgent.name}
                </h3>

                <p className="text-gray-600 text-base leading-relaxed">
                  {selectedAgent.description}
                </p>

                {/* Key Technical Specifications */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {selectedAgent.metrics.map((m, i) => (
                    <div key={i} className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                      <span className="text-[11px] uppercase font-semibold text-gray-500 block mb-0.5">{m.label}</span>
                      <span className="text-sm font-bold text-gray-900 block">{m.val}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <Link 
                    href={`/analysis`}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition inline-flex items-center gap-2"
                  >
                    <span>Run {selectedAgent.name.split(':')[0]} in Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Simulated Live Agent Output Box */}
              <div className="lg:col-span-5 bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-inner font-mono text-xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider">Agent Execution Stream</span>
                  </div>
                  <span className="text-[10px] text-slate-500">v2.4 Engine</span>
                </div>

                <div className="space-y-3">
                  <div className="text-emerald-400 font-bold">
                    ✓ STATUS: {selectedAgent.sampleOutput.action}
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 leading-relaxed font-sans text-xs">
                    {selectedAgent.sampleOutput.details}
                  </div>
                  <div className="text-[11px] text-slate-500 pt-2 flex items-center justify-between">
                    <span>Validation Guard: PASSED</span>
                    <span className="text-emerald-400 font-bold">Latency: 42ms</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 6. SAMPLE DATASET QUICK LAUNCH */}
      <section className="py-20 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full uppercase tracking-wider">
              Instant Launch
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mt-3">
              Experience the Full Analysis Workflow
            </h2>
            <p className="text-gray-600 text-base mt-2">
              Ready to analyze your files? Launch into DataLens Studio now.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg mb-4">
                📊
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">E-Commerce & Retail Sales</h3>
              <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                Multi-table orders and customer records. Perfect for evaluating relational key joins and sales correlation matrices.
              </p>
              <Link 
                href="/analysis"
                className="w-full py-2.5 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-900 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
              >
                Upload E-Commerce Data →
              </Link>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg mb-4">
                🏥
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Healthcare & Clinical Outcomes</h3>
              <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                Clinical test parameters and patient records. Evaluates statistical hypothesis tests (ANOVA/T-Tests) and outlier repair.
              </p>
              <Link 
                href="/analysis"
                className="w-full py-2.5 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-900 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
              >
                Upload Healthcare Data →
              </Link>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4">
                💳
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Customer Churn & Finance</h3>
              <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                Classification target with imbalanced distributions. Tests mutual info leakage scans and AutoML cross-validation.
              </p>
              <Link 
                href="/analysis"
                className="w-full py-2.5 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-900 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
              >
                Upload Financial Data →
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS ACCORDION */}
      <section className="py-20 bg-gray-50/70 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-gray-600 text-sm mt-2">Everything you need to know about DataLens AI architecture and algorithms.</p>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                  <button 
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left font-bold text-gray-900 flex justify-between items-center text-sm sm:text-base hover:bg-gray-50/80 transition"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 bg-gray-50/30">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 8. FINAL CALL TO ACTION */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-6">
            Transform Raw Data into Verified Intelligence
          </h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Experience the automated 8-agent data science workflow in action. Zero setup required.
          </p>
          <Link
            href="/analysis"
            className="inline-flex items-center gap-2 px-10 py-4 bg-white text-blue-700 hover:bg-gray-100 text-base font-extrabold rounded-2xl shadow-xl shadow-indigo-950/20 transition-all transform hover:scale-105"
          >
            <span>Get Started in DataLens Studio</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-12 text-sm text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 text-base">DataLens AI</span>
            <span className="text-xs text-gray-400">AI-Powered Automated Data Analysis Platform</span>
          </div>
          <div className="flex items-center space-x-6 text-xs font-medium text-gray-600">
            <Link href="/analysis" className="hover:text-blue-600">Analysis Studio</Link>
            <span>•</span>
            <a href="#agent-pipeline" className="hover:text-blue-600">8-Agent Architecture</a>
            <span>•</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
