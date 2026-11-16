# DataLens AI 🔍🤖
> **Automated Multi-Agent Tabular Data Analysis, Cleaning, AutoML & Reporting Platform**

DataLens AI is a full-stack platform designed to automate end-to-end data science workflows. Powered by a multi-agent AI architecture, it takes raw tabular data (CSV/Excel) and guides it through ingestion, diagnosis, cleaning, statistical exploration, relationship analysis, automated machine learning (AutoML), and executive presentation generation.

---

## 🌟 Key Features & Multi-Agent Architecture

The platform breaks data analysis down into specialized autonomous agents:

1. **Agent 1: Ingestion & Dataset Combination**
   - File upload (CSV, XLSX, XLS) validation and schema inspection.
   - Smart multi-dataset joining and concatenation.
2. **Agent 2: Data Diagnosis & Quality Audit**
   - Missing value identification, cardinality checks, anomaly and outlier detection.
   - Rule-based & LLM-driven diagnostic recommendations.
3. **Agent 3: Automated Data Cleaning**
   - Imputation strategies, duplicates removal, type casting, and outlier handling.
4. **Agent 4: Deep Exploratory Data Analysis (EDA)**
   - Descriptive statistics, distribution analysis, and metric breakdowns.
5. **Agent 5: Correlation & Relationship Analysis**
   - Feature interaction analysis, correlation heatmaps, collinearity detection.
6. **Agent 6: Feature Engineering & Preprocessing**
   - Scaling, encoding, feature selection, and preparation for ML pipelines.
7. **Agent 7: AutoML & Model Training**
   - Automated model selection, hyperparameter tuning, evaluation metrics, and model artifact generation.
8. **Agent 8: Executive Reporting & Presentation Generation**
   - Automated summary reports and PowerPoint / PDF generation summarizing dataset insights.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy, SQLite
- **AI / LLM Integration**: LangChain, LangGraph, Mistral AI, GroqCloud (Llama/Mixtral fallback), xAI Grok
- **Data Science & ML**: pandas, NumPy, scikit-learn, SciPy, statsmodels, openpyxl, python-pptx

---

## 📁 Repository Structure

```text
DataLens-AI/
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── agents/           # Multi-agent workflow implementations (1 to 8)
│   │   ├── api/              # REST API route endpoints
│   │   ├── config/           # App configuration and environment loaders
│   │   ├── database/         # Database engine and connection
│   │   ├── models/           # SQLAlchemy DB models
│   │   ├── schemas/          # Pydantic schemas for validation
│   │   └── tools/            # Analysis, AutoML, and reporting utility engines
│   ├── diagrams/             # System and module architecture diagrams
│   ├── sample_data/          # Sample datasets for testing (churn, sales, health)
│   ├── tests/                # Automated pytest suites
│   ├── requirements.txt      # Python dependencies
│   └── main.py
├── frontend/                 # Next.js TypeScript frontend
│   ├── app/                  # Next.js App Router pages (Agent 1-8 views)
│   ├── components/           # UI and Workflow React components
│   ├── lib/                  # Frontend utilities & helpers
│   ├── public/               # Static assets & dashboard graphics
│   ├── types/                # TypeScript type definitions
│   └── package.json
├── data/                     # Local data processing directory
├── .env.example              # Template for environment variables
├── .gitignore                # Production-ready git ignore rules
├── run.bat                   # 1-click startup script for Windows
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python**: Version 3.10 or higher
- **Node.js**: Version 18.x or higher (with `npm`)
- **Git**

---

### 2. Clone Repository
```bash
git clone https://github.com/nandakumar-123/DataLens-AI.git
cd DataLens-AI
```

---

### 3. Setup Environment Variables
Copy `.env.example` to create your `.env` in the root directory:
```bash
cp .env.example .env
```
Fill in your API keys in `.env`:
```env
MISTRAL_API_KEY=your_mistral_api_key
GROQ_API_KEY=your_groq_api_key
GROK_API_KEY=your_grok_api_key
DATABASE_URL=sqlite:///./datalens.db
```

---

### 4. Running the Application

#### Option A: Quick Start (Windows)
Double-click or run:
```cmd
.\run.bat
```
This activates the Python virtual environment and starts both backend and frontend development servers in separate windows.

#### Option B: Manual Setup

**Terminal 1 — Backend (FastAPI):**
```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```
- API is live at: `http://localhost:8000`
- Interactive Swagger docs: `http://localhost:8000/docs`

**Terminal 2 — Frontend (Next.js):**
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Next.js dev server
npm run dev
```
- Frontend application is live at: `http://localhost:3000`

---

## 🧪 Running Backend Tests

To run the backend test suite:
```bash
cd backend
pytest
```

---

## 📄 License
This project is licensed under the MIT License.
